import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ignored = new Set(['node_modules', 'dist', '.git', '.firebase', 'coverage']);
const findings = [];
function walk(folder) {
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const full = path.join(folder, entry.name);
    const relative = path.relative(root, full);
    if (entry.isDirectory()) { walk(full); continue; }
    // Private local env files are allowed on disk but excluded from Git by .gitignore.
    if (entry.name.startsWith('.env') && entry.name !== '.env.example') continue;
    if (/^(account-passwords|legacy-passwords|seed-data)\.json$/.test(entry.name) ||
        /(?:service.?account|firebase-adminsdk|credentials).*\.json$/i.test(entry.name) ||
        /\.(pem|key|map|zip)$/.test(entry.name)) {
      findings.push(`${relative}: local/private or generated file`);
      continue;
    }
    if (!/\.(?:[cm]?[jt]sx?|json|md|html|css|rules|ya?ml)$/.test(entry.name)) continue;
    const text = fs.readFileSync(full, 'utf8');
    if (/mongodb(?:\+srv)?:\/\/[^\s'"`{}$]+/i.test(text) ||
        /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/.test(text) ||
        /AIza[0-9A-Za-z_-]{35}/.test(text) ||
        /scrypt:[a-f0-9]{32}:[a-f0-9]{128}/i.test(text)) {
      findings.push(`${relative}: possible embedded credential`);
    }
  }
}
walk(root);
if (findings.length) {
  console.error(findings.join('\n'));
  process.exitCode = 1;
} else console.log('Repository source check passed. Local .env files are excluded; keep them out of Git.');
