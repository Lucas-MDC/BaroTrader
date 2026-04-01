import { createApp } from './app.js';

const app = createApp();
const resolvedPort = Number.parseInt(process.env.APP_PORT, 10);
const port = Number.isFinite(resolvedPort) ? resolvedPort : 3000;

app.listen(port, () => {
  console.log(`BaroTrader app listening on port ${port}`);
});
