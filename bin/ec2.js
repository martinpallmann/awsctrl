"use strict"

exports.ec2 = (AWS) => {
  
  const ec2 = new AWS.EC2()

  const describeInstances = (instanceIds) => {
    return new Promise(
      (resolve, reject) => { 
        ec2.describeInstances({InstanceIds: instanceIds}, (error, data) => {
          if (error) reject(error) 
          else       resolve(data)
        })
      }
    )
  }
  
  return {
    describeInstances: describeInstances
  }
}
