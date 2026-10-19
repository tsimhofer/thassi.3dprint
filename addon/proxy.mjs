import http from 'node:http';

const PORT = Number(process.env.PORT || 8099);
const APP_ID = "3d-print";
const TARGET_HOST = process.env.THASSI_HOST_IP || '192.168.188.92';
const TARGET_PORT = Number(process.env.THASSI_HOST_PORT || 8099);

const server = http.createServer((req, res) => {
  const headers = {
    ...req.headers,
    host: `${TARGET_HOST}:${TARGET_PORT}`,
    'x-thassi-standalone-app': APP_ID,
  };

  const proxyReq = http.request(
    {
      hostname: TARGET_HOST,
      port: TARGET_PORT,
      path: req.url || '/',
      method: req.method || 'GET',
      headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    }
  );

  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: 'Thassi Main Host (thassi_host:8099) is unreachable',
        details: err.message,
      })
    );
  });

  req.pipe(proxyReq, { end: true });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Thassi Sidebar Proxy] ${APP_ID} listening on :${PORT} -> http://${TARGET_HOST}:${TARGET_PORT}`);
});
