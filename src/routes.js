// Mapeia URLs públicas para arquivos no disco
const STATIC_ROUTES = {
  '/': 'src/pages/index.html',
  '/conta': 'src/pages/Conta/logged.html',
  '/register' : 'src/pages/noSession/register.html'
};

// Função auxiliar para verificar se uma URL começa com um prefixo
const hasPrefix = (url, prefix) => url === prefix || url.startsWith(prefix + '/');

// Função que resolve uma URL para um caminho no disco
function resolve(url) {
  // 1. Rota estática exata (páginas)
  if (url in STATIC_ROUTES) {
    return STATIC_ROUTES[url];
  }

  // 2. Assets (CSS, JS, imagens etc)
  if (hasPrefix(url, '/assets')) {
    // Converte /assets/css/style.css para src/assets/css/style.css
    return 'src' + url;
  }

  // 3. Se não encontrou, retorna a URL original
  // (será tratado como 404 se o arquivo não existir)
  return url;
}

module.exports = { resolve };