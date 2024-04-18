import expressLoader from './express';
import dependencyInjectorLoader from './dependencyInjection';
import mongooseLoader from './mongoose';

// import jobsLoader from './jobs';
import Logger from './logger';
//We have to import at least all the events once so they can be triggered
// import './events';

export default async ({ expressApp }) => {
  await mongooseLoader();
  Logger.info('✌️ DB loaded and connected!');

  const enablerModel ={
    name: 'enablerModel',
    model: require('../models/enabler').default
  }

  // It returns the agenda instance because it's needed in the subsequent loaders
  await dependencyInjectorLoader({
    models: [
      enablerModel
    ],
  });
  Logger.info('✌️ Dependency Injector loaded');

  await expressLoader({ app: expressApp });
  Logger.info('✌️ Express loaded');
};
