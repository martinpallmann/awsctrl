"use strict"

exports.ecs = (AWS) => {
  
  const ecs = new AWS.ECS()
  
  const describeContainerInstances = (cluster, containerInstances) => {
    return new Promise(
      (resolve, reject) => { 
        ecs.describeContainerInstances({ 
          cluster: cluster, 
          containerInstances: containerInstances 
        }, (err, data) => {
          if (err) reject(error)
          else     resolve(data)
        })
      }
    )
  }
  
  const listContainerInstances = (cluster) => {
    return new Promise(
      (resolve, reject) => { 
        ecs.listContainerInstances({ cluster: cluster }, (err, data) => {
          if (err) reject(error)
          else     resolve(data)
        })
      }
    )
  }
  
  const listClusters = () => { 
    return new Promise(
      (resolve, reject) => { 
        ecs.listClusters({}, (error, data) => {
          if (error) reject(error) 
          else       resolve(data)
        })
      }
    )
  }
  
  const listServices = (cluster) => {
    return new Promise(
      (resolve, reject) => { 
        ecs.listServices({ cluster: cluster }, (error, data) => {
          if (error) reject(error) 
          else       resolve(data)
        })
      }
    )
  }
  
  const describeServices = (cluster, services) => {
    return new Promise(
      (resolve, reject) => { 
        ecs.describeServices({ cluster: cluster, services : services }, (error, data) => {
          if (error) reject(error)
          else       resolve(data)
        })
      }
    )
  }
  
  const updateService = (cluster, service, taskDefinition, desiredCount) => {
    return new Promise(
      (resolve, reject) => { 
        ecs.updateService({ 
          cluster: cluster, 
          service : service, 
          taskDefinition: taskDefinition,
          desiredCount : desiredCount 
        }, (error, data) => {
          if (error) reject(error)
          else       resolve(data)
        })
      }
    )
  }
  
  return {
    describeContainerInstances: describeContainerInstances,
    listContainerInstances: listContainerInstances,
    listClusters: listClusters,
    listServices: listServices,
    describeServices: describeServices,
    updateService: updateService
  }
}
