const express = require('express')
const routes = require('./routes/index_routes.js');
const path = require('path');

const app = express();
const port = 3000;

const SRC_ROOT = path.join(__dirname);
app.set('SRC_ROOT', SRC_ROOT);

app.use(express.static(path.join(SRC_ROOT, 'public')));

// montar o “grande router”
app.use('/', routes);

// 404 padrão
app.use((req, res) => {
  res.status(404).send('Página não encontrada');
});

// erro padrão
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Erro interno');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});