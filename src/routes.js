import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import servicesRouter from './services/services.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_ROOT = path.join(__dirname);
const PUBLIC_PAGES_DIR = path.join(SRC_ROOT, 'public', 'pages');
const PUBLIC_ASSETS_DIR = path.join(SRC_ROOT, 'public', 'assets');
const PRIVATE_PAGES_DIR = path.join(SRC_ROOT, 'private', 'pages');
const PRIVATE_ASSETS_DIR = path.join(SRC_ROOT, 'private', 'assets');
const SHARED_DIR = path.join(SRC_ROOT, 'shared');

// Recursos compartilhados entre paginas publicas e privadas (CSS/JS/imagens)
router.use('/static/shared', express.static(SHARED_DIR));

// Publico: apenas assets e paginas publicas
router.use('/public/static/assets', express.static(PUBLIC_ASSETS_DIR));
router.use('/public/static/pages', express.static(PUBLIC_PAGES_DIR));

// Privado: proteger futuramente com requireAuth
router.use('/private/static/assets', express.static(PRIVATE_ASSETS_DIR));
router.use('/private/static/pages', express.static(PRIVATE_PAGES_DIR));

// API
router.use('/api', servicesRouter);

// Entrypoint: pagina inicial publica
router.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_PAGES_DIR, 'home.html'));
});

// 404 padrao
router.use((req, res) => {
  res.status(404).send('Pagina nao encontrada');
});

// erro padrao
router.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).send('Erro interno');
});

export default router;
