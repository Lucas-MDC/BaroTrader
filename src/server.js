const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const { resolve } = require('./routes');
const { contentTypeFor } = require('./utils/mime');
const { resolveRequestPath } = require('./utils/paths');

const PORT = process.env.PORT || 5173;
const ROOT = process.cwd();

http.createServer((req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  const mapped = resolve(pathname);
  const filePath = resolveRequestPath(pathname, { [pathname]: mapped }, ROOT);

  if (!filePath) {
    res.writeHead(400, { 'Content-Type':'text/plain; charset=utf-8' });
    return res.end('Bad request');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      const notFound = path.join(ROOT, 'pages', '404.html');
      if (err.code === 'ENOENT' && fs.existsSync(notFound)) {
        res.writeHead(404, {
          'Content-Type':'text/html; charset=utf-8',
          'X-Content-Type-Options': 'nosniff'
        });
        return res.end(fs.readFileSync(notFound));
      }
      res.writeHead(err.code === 'ENOENT' ? 404 : 500, {
        'Content-Type':'text/plain; charset=utf-8'
      });
      return res.end(err.code || 'Error');
    }

    const type = contentTypeFor(path.extname(filePath));
    res.writeHead(200, {
      'Content-Type': type,
      // HTML sem cache (dev); assets com cache curto
      'Cache-Control': /\.html$/i.test(filePath) ? 'no-store' : 'public, max-age=300',
      // evita MIME sniffing do navegador
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
