import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../public', import.meta.url));
const host = process.argv.includes('--lan') ? '0.0.0.0' : '127.0.0.1';
const port = Number(process.env.SCRATCH_LAB_PORT || 4173);
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.gif': 'image/gif', '.woff2': 'font/woff2', '.woff': 'font/woff', '.wav': 'audio/wav', '.mp3': 'audio/mpeg',
  '.wasm': 'application/wasm', '.sb3': 'application/octet-stream', '.txt': 'text/plain; charset=utf-8'
};

createServer(async (request, response) => {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    const url = new URL(request.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);
    const relative = pathname === '/' ? '/index.html' : pathname;
    // The unmodified Scratch UMD bundle also resolves some assets against the page URL.
    const scratchAsset = /^\/(chunks|static)\//.test(relative) || relative === '/extension-worker.js';
    const assetRoot = scratchAsset ? resolve(root, 'vendor/dist') : root;
    const file = resolve(assetRoot, '.' + relative);
    if (!file.startsWith(assetRoot + sep)) {
      response.writeHead(403).end();
      return;
    }
    const info = await stat(file);
    if (!info.isFile()) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, {
      'Content-Type': types[extname(file)] || 'application/octet-stream',
      'Content-Length': info.size,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-cache'
    });
    if (request.method === 'HEAD') response.end();
    else createReadStream(file).on('error', () => response.destroy()).pipe(response);
  } catch {
    response.writeHead(404).end();
  }
}).listen(port, host, () => console.log(`Scratch-Labor: http://${host}:${port}/`));
