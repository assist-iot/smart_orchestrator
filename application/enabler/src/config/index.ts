import dotenv from 'dotenv';

// Set the NODE_ENV to 'development' by default
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const envFound = dotenv.config();
if (envFound.error) {
  // This error should crash whole process

  throw new Error("⚠️  Couldn't find .env file  ⚠️");
}

export default {
  /**
   * Your favorite port
   */
  port: process.env.PORT,

  /**
   * That long string from mlab
   */
  databaseURL: process.env.MONGODB_URI,
  /**
   * Used by winston logger
   */
  logs: {
    level: process.env.LOG_LEVEL || 'silly',
  },

  helm: process.env.HELM,
  repo: process.env.REPO,
  cluster: process.env.CLUSTER,
  scheduler: process.env.SCHEDULER
  /**
   * Mailgun email credentials
   */
};
