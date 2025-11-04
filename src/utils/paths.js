const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

function safeJoin(baseDir, requestPath) {
  const full = path.normalize(path.join(baseDir, requestPath));
  // bloqueia traversal: o path final PRECISA permanecer dentro de baseDir
  if (!full.startsWith(baseDir)) return null;
  return full;
}

function resolveRequestPath(reqUrl, routes, projectRoot) {
  // 1) parse robusto da URL
  const { pathname } = new URL(reqUrl, 'http://localhost');

  // 2) aplica roteamento “bonito”
  const mapped = routes[pathname] || pathname;

  // se o mapeamento começar com '/' (p.ex. quando vem direto do pathname),
  // removemos o leading slash para garantir junção relativa com projectRoot
  const normalized = typeof mapped === 'string' && mapped.startsWith('/')
    ? mapped.slice(1)
    : mapped;

  // 3) junta de forma segura com a raiz do projeto
  const candidate = safeJoin(projectRoot, normalized);
  if (!candidate) return null; // tentativa de traversal

  // 4) se for diretório, tenta index.html
  try {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      const idx = path.join(candidate, 'index.html');
      if (fs.existsSync(idx)) return idx;
    }
  } catch (_) { /* ignora e segue */ }

  return candidate;
}

module.exports = { safeJoin, resolveRequestPath };
