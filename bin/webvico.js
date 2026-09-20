#!/usr/bin/env node

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '..', 'dist');

if (!fs.existsSync(DIST_DIR)) {
  console.error('\x1b[31mError:\x1b[0m Production build directory (dist/) not found.');
  console.log('Please run \x1b[36mnpm run build\x1b[0m before launching webvico.');
  process.exit(1);
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.cube': 'text/plain',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

function openBrowser(url) {
  const start =
    process.platform === 'darwin'
      ? 'open'
      : process.platform === 'win32'
      ? 'start'
      : 'xdg-open';
  exec(`${start} "${url}"`, () => {});
}

function startServer(initialPort = 3000) {
  let port = initialPort;

  const server = http.createServer((req, res) => {
    // Parse URL and sanitize path
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let safePath = path.normalize(parsedUrl.pathname).replace(/^(\.\.[\/\\])+/, '');
    if (safePath === '/' || safePath === '') {
      safePath = '/index.html';
    }

    let filePath = path.join(DIST_DIR, safePath);

    // If file doesn't exist, fall back to index.html (SPA routing)
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`500 Server Error: ${err.code}`);
      } else {
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache'
        });
        res.end(content);
      }
    });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      port++;
      server.listen(port);
    } else {
      console.error('Server error:', err);
    }
  });

  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log('\n\x1b[1m\x1b[36m===================================================\x1b[0m');
    console.log('\x1b[1m\x1b[36m   CHROMATIC // WebVIco (AI Video Color Grader)   \x1b[0m');
    console.log('\x1b[1m\x1b[36m===================================================\x1b[0m\n');
    console.log(`  \x1b[32m✔\x1b[0m Running locally at: \x1b[1m\x1b[34m${url}\x1b[0m`);
    console.log('  \x1b[32m✔\x1b[0m WebGL2 3D-LUT shader pipeline active');
    console.log('  \x1b[32m✔\x1b[0m Opening in your default browser...\n');
    console.log('  \x1b[90mPress Ctrl+C to stop the server.\x1b[0m\n');

    openBrowser(url);
  });
}

startServer();
