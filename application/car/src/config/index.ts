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
  mqtt:{
    host:`mqtt://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`
  },
  repository: process.env.REPOSITORY,
  /**
   * That long string from mlab
   */
  fiware: process.env.FIWARE,
  /**
   * Used by winston logger
   */
  logs: {
    level: process.env.LOG_LEVEL || 'silly',
  }


  /**
   * Mailgun email credentials
   */
};
