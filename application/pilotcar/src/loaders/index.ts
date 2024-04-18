import expressLoader from './express';
import dependencyInjectorLoader from './dependencyInjection';
import { Container } from 'typedi';
import mqttLoader from './mqtt';

// import jobsLoader from './jobs';
import Logger from './logger';
//We have to import at least all the events once so they can be triggered
// import './events';

export default async ({ expressApp }) => {
  //await mongooseLoader();
  const client = await mqttLoader();
  Container.set('clientMqtt', client);
  Logger.info('✌️ MQTT connected!');

  Logger.info('✌️ Elastic connection available! -> To improve');
  await dependencyInjectorLoader({
    models: [],
  });
  await expressLoader({ app: expressApp });
  Logger.info('✌️ Express loaded');
};
