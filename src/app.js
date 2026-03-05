import express from 'express';
import routes from './routes.js';

function createApp() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(routes);

  return app;
}

export { createApp };
