"use strict"

const draw = function(blessed, contrib, screen) {
  var line = contrib.line(
         { style:
           { line: "yellow"
           , text: "green"
           , baseline: "black"}
         , xLabelPadding: 3
         , xPadding: 5
         , label: 'Title'})
  var data = {
         x: ['t1', 't2', 't3', 't4'],
         y: [5, 1, 7, 5]
      }
   screen.append(line) //must append before setting data
   line.setData([data])
}

const listClusters = (ecs, ec2) => {
   ecs.listClusters(ecs).then((response) => {
    response.clusterArns.forEach((cluster) => {
      ecs.listContainerInstances(cluster).then((response) => {
        ecs.describeContainerInstances(cluster, response.containerInstanceArns).then((response) => {
          //console.log(response)
          //console.log(response.failures) // TODO do something with failures
          
          const instanceIds = response.containerInstances.map((e) => { return e.ec2InstanceId })
          
//          ec2.describeInstances(instanceIds).then((instance) => {
//            instance.Reservations.forEach((r) => {
//              console.log(r.Instances.map((i) => { return i.Tags }))
//            })
//          })
          
          response.containerInstances.forEach((ci) => {
            var regMem = -1
            var regCpu = -1
            var remMem = -1
            var remCpu = -1
            
            ci.registeredResources.forEach((res) => {
              if (res.name == 'CPU') regCpu = res.integerValue
              if (res.name == 'MEMORY') regMem = res.integerValue
            })
            ci.remainingResources.forEach((res) => {
              if (res.name == 'CPU') remCpu = res.integerValue
              if (res.name == 'MEMORY') remMem = res.integerValue
            })
          })
        })
      })
    })
  })
}
 
const tableData = (table, headers) => {
  const data = []

  const values = () => {
    return data.map((elem) => { return elem.value })
  }

  const put = (key, value, metadata) => {
    const idx = data.findIndex((elem) => { return (elem.key == key) })
    const elem = { "key": key, "value": value, "metadata": metadata }
    if (idx == -1) data.push(elem)
    else data[idx] = elem 
    table.setData({ 
      headers: headers, 
      data: values() 
    })
  }

  const get = (idx) => {
    if (data.length > idx) return data[idx]
    else return undefined
  }

  return {
    put: put,
    get: get
  }
}

const listServices = (blessed, screen, contrib, ecs, grid, row, col, rowSpan, colSpan) => {
  
  const table = grid.set(row, col, rowSpan, colSpan, contrib.table, { 
    keys: true, 
    fg: 'white',  
    label: 'Services',
    interactive: false,
    columnSpacing: 2, 
    columnWidth: [20, 10, 10, 10]
  })
  
  table.rows.on('focus', function () {
    table.rows.interactive = true
  })
  
  table.rows.on('blur', function () {
    table.rows.interactive = false
  })
  
  const services = tableData(table, ['Service', 'Pending', 'Desired', 'Running'])
  
  const setData = (cluster, service, name, taskDefinition, pending, desired, running) => {
    if (name) services.put(service, [name, pending, desired, running], {"cluster": cluster, "taskDefinition": taskDefinition })
    screen.render()
  }
  
  const updateService = (cluster, service, taskDefinition, count) => {
    ecs.updateService(cluster, service, taskDefinition, count)
  }
  
  const fetchData = () => ecs.listClusters().then((response) => {
    response.clusterArns.forEach((cluster) => {
      ecs.listServices(cluster).then((response) => {
        ecs.describeServices(cluster, response.serviceArns).then((response) => {
          for (const s of response.services) {
            setData(cluster, s.serviceArn, s.serviceName, s.taskDefinition, s.pendingCount, s.desiredCount, s.runningCount)
          }
        })
      })
    })
  })
  
  table.rows.key('enter', (ch, key) => {
    const q = blessed.Prompt({
      top: 'center',
      left: 'center',
      width: '70%',
      height: '50%',
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        bg: 'blue',
        border: {
          fg: 'white'
        }
      }
    })
    screen.append(q)
    q.readInput("How many instances should run?", "", (a, count) => {
      const s = services.get(table.rows.selected)
      updateService(s.metadata.cluster, s.key, s.metadata.taskDefinition, count)
    })
  });
  
  setData()
  
  fetchData()
  setInterval(fetchData, 1000)  
  
  return table
}

const listQueues = (blessed, screen, contrib, sqs, grid, row, col, rowSpan, colSpan) => {
  const table = grid.set(row, col, rowSpan, colSpan, contrib.table, { 
    keys: true, 
    fg: 'white', 
    label: 'SQS Queues',
    interactive: false,
    columnSpacing: 2, 
    columnWidth: [20, 10, 10, 10]
  })

  const queues = tableData(table, ['Queue', 'Total', 'Available', 'in Flight'])
  
  const setData = (queue, name, available, invisible) => {
    if (name) queues.put(queue, [name, available + invisible, available, invisible], {})
    screen.render()
  }
  
  setData()
  
  table.rows.on('focus', function () {
    table.rows.interactive = true
  })
  
  table.rows.on('blur', function () {
    table.rows.interactive = false
  })
  
  table.rows.key('enter', (ch, key) => {
    const q = blessed.Question({
      top: 'center',
      left: 'center',
      width: '70%',
      height: '50%',
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        bg: 'blue',
        border: {
          fg: 'white'
        }
      }
    })
    screen.append(q)
    q.ask("Do you want to purge the queue?", (err, wantPurge) => {
      if (wantPurge) {
        sqs.purgeQueue(queues.get(table.rows.selected).key)
      }
    })
  });
  
  const fetchData = () => sqs.listQueues().then((response) => { 
    response.QueueUrls.forEach((queue) => {
      sqs.getQueueAttributes(queue).then((response) => {
        const name = response.Attributes.QueueArn.replace(/.*:/, '')
        const available = parseInt(response.Attributes.ApproximateNumberOfMessages)
        const invisible = parseInt(response.Attributes.ApproximateNumberOfMessagesNotVisible)
        setData(queue, name, available, invisible)
      })
    })
  })
  
  fetchData()
  setInterval(fetchData, 1000)  
  
  return table;
}

exports.run = () => {
  const blessed = require('blessed')
  const contrib = require('blessed-contrib')
  const AWS = require('aws-sdk')
  AWS.config.update({region: 'eu-west-1'})
  const ecs = require('./ecs.js').ecs(AWS)
  const sqs = require('./sqs.js').sqs(AWS)
  const ec2 = require('./ec2.js').ec2(AWS)
  
  var screen = blessed.screen({
    autoPadding: true,
    smartCSR: true
  })
  screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    return process.exit(0);
  })
  screen.key('tab', (ch, key) => {
    screen.focusNext()
  })
  
  var grid = new contrib.grid({ rows: 5, cols: 1, screen: screen }) 
  const services = listServices(blessed, screen, contrib, ecs, grid, 0, 0, 3, 1)
  const queues = listQueues(blessed, screen, contrib, sqs, grid, 3, 0, 2, 1)
  
  services.focus()
  
  screen.render()
}
