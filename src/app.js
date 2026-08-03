import express from 'express';
import { installAppMiddleware } from './middleware/appMiddleware.js';
import routes from './routes.js';

function createApp() {
  const app = express();

  installAppMiddleware(app);
  app.use(routes);

  return app;
}

export { createApp };
