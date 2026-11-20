// Vite serves the frontend on 5500 and proxies API requests to this port.
process.env.PORT = '5501';
process.env.OPEN_BROWSER = '0';
await import('./index.mjs');
