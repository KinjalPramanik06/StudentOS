export function originIsAllowed(req, environment = process.env) {
  const origin = req.headers.origin;
  if (!origin) return true;
  if (origin === (environment.APP_ORIGIN || 'http://localhost:5500')) return true;
  const host = req.headers.host;
  const own = `${req.socket?.encrypted ? 'https' : 'http'}://${host}`;
  if (origin === own) return true;
  // Local development tunnels terminate HTTPS before forwarding to Node.
  if (environment.NODE_ENV !== 'production') {
    if (origin === `https://${host}`) return true;
    const forwardedHost = String(req.headers['x-forwarded-host'] || '').split(',')[0].trim();
    if (/^[a-z0-9-]+\.[a-z0-9-]+\.devtunnels\.ms$/i.test(forwardedHost) && origin === `https://${forwardedHost}`) return true;
  }
  return false;
}
