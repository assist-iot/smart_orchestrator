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
  LTSEURI: process.env.LTSE_URI,
  SEMREPOURI: process.env.SEM_REPO,
  semRepoExternal: process.env.SEM_REPO_EXT,

  /**
   * Used by winston logger
   */
  logs: {
    level: process.env.LOG_LEVEL || 'silly',
  },

  helm: process.env.HELM,
  mqtt:{
    host:`mqtt://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`
  }
  /**
   * Mailgun email credentials
   */
};
