/*
HTTP server entry point for the BaroTrader application.
Configures middleware and registers the route handler.
*/

import express from 'express';
import routes from './routes.js';

const app = express();
const resolvedPort = Number.parseInt(process.env.APP_PORT, 10);
const port = Number.isFinite(resolvedPort) ? resolvedPort : 3000;

/*
Register core middleware and application routes.
*/

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(routes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
