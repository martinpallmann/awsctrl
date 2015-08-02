"use strict"

exports.sqs = (AWS) => {
  
  const sqs = new AWS.SQS()
  
  const listQueues = () => { 
    return new Promise(
      (resolve, reject) => { 
        sqs.listQueues({}, (error, data) => {
          if (error) reject(error) 
          else       resolve(data)
        })
      }
    )
  }
  
  const getQueueAttributes = (queueUrl) => {
    return new Promise(
      (resolve, reject) => { 
        sqs.getQueueAttributes({
          QueueUrl: queueUrl, 
          AttributeNames: [ 'All' ]
        }, (error, data) => {
          if (error) reject(error) 
          else       resolve(data)
        })
      }
    )
  }
  
  const purgeQueue = (queueUrl) => {
    return new Promise(
      (resolve, reject) => { 
        sqs.purgeQueue({QueueUrl: queueUrl}, (error, data) => {
          if (error) reject(error) 
          else       resolve(data)
        })
      }
    )
  }
  
  return {
    listQueues: listQueues,
    getQueueAttributes: getQueueAttributes,
    purgeQueue: purgeQueue
  }
}