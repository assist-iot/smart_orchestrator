import expressLoader from './express';
import dependencyInjectorLoader from './dependencyInjection';
import mqttLoader from './mqtt';
import { Container } from 'typedi';

// import jobsLoader from './jobs';
import Logger from './logger';
//We have to import at least all the events once so they can be triggered
// import './events';

export default async ({ expressApp }) => {
  // It returns the agenda instance because it's needed in the subsequent loaders
  const client = await mqttLoader();
  Container.set('clientMqtt', client);
  Logger.info('✌️ MQTT connected!');

  await dependencyInjectorLoader();
  Logger.info('✌️ Dependency Injector loaded');

  await expressLoader({ app: expressApp });
  Logger.info('✌️ Express loaded');
};
