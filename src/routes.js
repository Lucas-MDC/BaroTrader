/*
Express router that serves static assets and API routes.
*/

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { requirePageAuth } from './auth/authMiddleware.js';
import servicesRouter from './services/services.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_ROOT = path.join(__dirname);
const FRONTEND_SHELL = path.join(SRC_ROOT, 'frontend', 'index.html');
const PUBLIC_ASSETS_DIR = path.join(SRC_ROOT, 'public', 'assets');
const SHARED_DIR = path.join(SRC_ROOT, 'shared');

const PUBLIC_FRONTEND_ROUTES = [
  '/',
  '/public/static/pages/noSession/register.html'
];

const PRIVATE_FRONTEND_ROUTES = [
  '/private/static/pages/homeInternal.html'
];

/*
Shared static assets for the SPA shell.
*/
router.use('/static/shared', express.static(SHARED_DIR));

/*
Compiled frontend assets.
*/
router.use('/public/static/assets', express.static(PUBLIC_ASSETS_DIR));

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

router.get(PUBLIC_FRONTEND_ROUTES, sendFrontendShell);
router.get(PRIVATE_FRONTEND_ROUTES, requirePageAuth, sendFrontendShell);

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
