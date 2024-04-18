import express from 'express';
import cors from 'cors';
import routes from '../api';
import config from '../config';
export default ({ app }: { app: express.Application }) => {
  /**
   * Health Check endpoints
   * @TODO Explain why they are here
   */
  app.get('/status', (req, res) => {
    res.status(200).end();
  });
  app.head('/status', (req, res) => {
    res.status(200).end();
  });

  // Useful if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
  // It shows the real origin IP in the heroku or Cloudwatch logs
  app.enable('trust proxy');

  // The magic package that prevents frontend developers going nuts
  // Alternate description:
  // Enable Cross Origin Resource Sharing to all origins by default
  app.use(cors());

  // Some sauce that always add since 2014
  // "Lets you use HTTP verbs such as PUT or DELETE in places where the client doesn't support it."
  // Maybe not needed anymore ?
  // app.use(require('method-override')());

  // Transforms the raw string of req.body into json
  app.use(express.json());
  // Load API routes
  app.use(routes());

  /// catch 404 and forward to error handler
  app.use((req, res, next) => {
    console.log(req)
    res.status(404).send("Sorry can't find that!")
    next();
  });

};
