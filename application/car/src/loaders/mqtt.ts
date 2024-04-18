import mqtt from 'async-mqtt';
import config from '../config';

let clientId = `mqtt_${Math.random().toString(16).slice(3)}`

export default async () => {
  try{
    const connection = await mqtt.connectAsync(config.mqtt.host, {
      clientId,
      clean: true,
      connectTimeout: 180000
    });
    return connection
  }catch{

  }

};

