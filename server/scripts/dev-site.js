const express = require('express');
const http = require('http');
const path = require('path');

const app = express();
const projectDir = path.resolve(__dirname, '../..');
const apiPort = Number(process.env.API_PORT) || 3001;
const sitePort = Number(process.env.DEV_SITE_PORT) || 8000;

app.disable('x-powered-by');

function forwardToApi(req, res) {
  const upstream = http.request({
    hostname: '127.0.0.1',
    port: apiPort,
    path: req.originalUrl,
    method: req.method,
    headers: { ...req.headers, host: `127.0.0.1:${apiPort}` },
  }, (apiResponse) => {
    res.writeHead(apiResponse.statusCode || 502, apiResponse.headers);
    apiResponse.pipe(res);
  });

  upstream.on('error', () => {
    if (!res.headersSent) {
      res.status(502).json({ error: 'Portfolio API is unavailable. Start the backend and try again.' });
    }
  });

  req.pipe(upstream);
}

app.use('/api', forwardToApi);
app.use('/uploads', forwardToApi);
app.use('/assets', express.static(path.join(projectDir, 'assets'), {
  dotfiles: 'deny',
  index: false,
  fallthrough: false,
}));

app.get('/', (req, res) => res.sendFile(path.join(projectDir, 'index.html')));
app.use((req, res) => res.status(404).send('Not found.'));

app.listen(sitePort, '127.0.0.1', () => {
  console.log(`Portfolio site and local API proxy listening on http://localhost:${sitePort}`);
  console.log(`Forwarding /api and /uploads to http://127.0.0.1:${apiPort}`);
});
