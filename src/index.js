import { createApp } from './app.js';

const app = createApp();
const port = Number(process.env.APP_PORT);

if (!Number.isInteger(port) || port <= 0) {
  throw new Error('APP_PORT must be defined in .env as a positive integer.');
}

app.listen(port, () => {
  console.log(`BaroTrader app listening on port ${port}`);
});
