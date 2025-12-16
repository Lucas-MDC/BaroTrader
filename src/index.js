import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

const SRC_ROOT = path.join(__dirname);
const PUBLIC_PAGES_DIR = path.join(SRC_ROOT, 'public', 'pages');
const PUBLIC_ASSETS_DIR = path.join(SRC_ROOT, 'public', 'assets');
const PRIVATE_PAGES_DIR = path.join(SRC_ROOT, 'private', 'pages');
const PRIVATE_ASSETS_DIR = path.join(SRC_ROOT, 'private', 'assets');
const SHARED_DIR = path.join(SRC_ROOT, 'shared');

// Recursos compartilhados entre paginas publicas e privadas (CSS/JS/imagens)
app.use('/static/shared', express.static(SHARED_DIR));

// Publico: apenas assets e paginas publicas
app.use('/public/static/assets', express.static(PUBLIC_ASSETS_DIR));
app.use('/public/static/pages', express.static(PUBLIC_PAGES_DIR));

// Privado: proteger futuramente com requireAuth
app.use('/private/static/assets', express.static(PRIVATE_ASSETS_DIR));
app.use('/private/static/pages', express.static(PRIVATE_PAGES_DIR));

// Entrypoint: pagina inicial publica
app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_PAGES_DIR, 'home.html'));
});

// 404 padrao
app.use((req, res) => {
  res.status(404).send('Pagina nao encontrada');
});

// erro padrao
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).send('Erro interno');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});
