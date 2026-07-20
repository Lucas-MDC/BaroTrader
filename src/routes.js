/*
Express router that serves static assets and API routes.
*/

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import servicesRouter from './services/services.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_ROOT = path.join(__dirname);
const FRONTEND_SHELL = path.join(SRC_ROOT, 'frontend', 'index.html');
const FRONTEND_BUNDLE = path.join(SRC_ROOT, 'public', 'build', 'app.js');
const PUBLIC_ASSETS_DIR = path.join(SRC_ROOT, 'public', 'assets');
const PUBLIC_ASSET_TYPES = ['css', 'images', 'icons', 'fonts'];

const FRONTEND_ROUTES = [
  '/',
  '/register',
  '/account'
];

/*
Fixed public assets such as stylesheets and images.
*/
PUBLIC_ASSET_TYPES.forEach((assetType) => {
  router.use(
    `/static/assets/${assetType}`,
    express.static(path.join(PUBLIC_ASSETS_DIR, assetType))
  );
});

/*
The SPA bundle is deliberately exposed as one exact resource. The build
directory is not mounted through express.static.
*/
router.get('/spa/app.js', (_req, res) => {
  res.sendFile(FRONTEND_BUNDLE);
});

/*
API routes.
*/
router.use('/api', servicesRouter);

/*
SPA entry points. Keep these explicit so /api/* never falls back to HTML.
*/
function sendFrontendShell(req, res) {
  res.sendFile(FRONTEND_SHELL);
}

router.get(FRONTEND_ROUTES, sendFrontendShell);

/*
Default 404 handler.
*/
router.use((req, res) => {
  res.status(404).send('Page not found');
});

/*
Default error handler.
*/
router.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).send('Internal server error');
});

export default router;
