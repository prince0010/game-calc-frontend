const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

// Read SSL certificates (same ones your backend uses)
const httpsOptions = {
    key: fs.readFileSync(path.resolve(__dirname, 'private_key.pem')),
    cert: fs.readFileSync(path.resolve(__dirname, 'certificate.crt')),
};

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ 
  dev,
  hostname,
  port
});

const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Ready on https://${hostname}:${port}`);
  });
});