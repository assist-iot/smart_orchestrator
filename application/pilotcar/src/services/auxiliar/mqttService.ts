import { Container, Service, Inject } from 'typedi'

@Service()
export default class MqttService {
  constructor(
   @Inject('clientMqtt') private client
  ) {}

   public async calibrateSubfleet(groupId, semRepoUrl){
      try {
         this.client.publish(
            `/fleet/${groupId}`,
            JSON.stringify({ "op": "firmware", "firmware_url": semRepoUrl }),
            { qos: 2 }
         )
      } catch (error) {
         throw error
      }
   }

   public async publishMqttGroup(groupId, enablerName, helmChartName, values, helmrepo, version){
      try {
         this.client.publish(
            `/fleet/${groupId}`,
            JSON.stringify({ "op": "install", enablerName, helmChartName, values, helmrepo, "group": groupId, version}),
            { qos: 2 }
         )
      } catch (error) {
         throw error
      }
   }

   public async deleteMqttCar(groupId, carId, enablerName){
      try {
         this.client.publish(`/fleet/${groupId}/${carId}`, 
            JSON.stringify({ "op": "delete", enablerName }),
            { qos: 2 }
         )
      } catch (error) {
         throw error
      }
   }

   public async deleteMqttGroup(groupId, enablerName){
      try {
         this.client.publish(`/fleet/${groupId}`, 
            JSON.stringify({ "op": "delete", enablerName }),
            { qos: 2 }
         )
      } catch (error) {
         throw error
      }
   }

}