import { createApp } from './app.js';
import { getAppConfig } from '../config/index.js';
import { closeUserModel } from './models/user/index.js';

const app = createApp();
const { host, port } = getAppConfig();
const shutdownTimeoutMs = 10000;
let shuttingDown = false;

const server = app.listen(port, host, () => {
  console.log(`BaroTrader app listening on ${host}:${port}`);
});

function closeHttpServer() {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });

    if (typeof server.closeIdleConnections === 'function') {
      server.closeIdleConnections();
    }
  });
}

async function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  /*
  Graceful shutdown keeps the runtime DB pool alive until the HTTP server stops
  accepting new connections and any request that arrived right before shutdown
  has a chance to finish without losing its database access mid-flight.
  */
  console.log(`[shutdown] Received ${signal}. Closing HTTP server...`);

  const forceExitTimer = setTimeout(() => {
    console.error('[shutdown] Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, shutdownTimeoutMs);

  forceExitTimer.unref?.();

  try {
    await closeHttpServer();
    console.log('[shutdown] HTTP server closed. Closing runtime DB pool...');
    await closeUserModel();
    clearTimeout(forceExitTimer);
    console.log('[shutdown] Runtime DB pool closed. Exiting.');
    process.exit(0);
  } catch (error) {
    clearTimeout(forceExitTimer);
    console.error('[shutdown] Error during graceful shutdown:', error);
    process.exit(1);
  }
}

process.once('SIGINT', () => {
  void shutdown('SIGINT');
});

process.once('SIGTERM', () => {
  void shutdown('SIGTERM');
});
