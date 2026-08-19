// Guards the two halves of AI access control against drifting apart.
// Run: node scripts/check-ai-access.mjs
//
// 1. Every edge-function route that spends Replicate credits must call
//    requireWhitelisted(), otherwise anyone with the public anon key can
//    drive our billing.
// 2. No client call to a whitelist-gated route may send publicAnonKey, or
//    the server will reject it with 401 and the feature silently breaks.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SERVER_FILE = 'supabase/functions/server/index.tsx';
const server = readFileSync(SERVER_FILE, 'utf8');
const failures = [];

// Split on route registrations: each chunk is one handler body.
const chunks = server.split(/\napp\.(?=get|post|put|delete)/).slice(1);
const gatedRoutes = [];

for (const chunk of chunks) {
  const path = chunk.match(/\$\{ROUTE_PREFIX\}([^`]*)`/)?.[1];
  if (!path) continue;
  const isGated = chunk.includes('requireWhitelisted(c)');
  if (isGated) gatedRoutes.push(path);
  if (chunk.includes('REPLICATE_API_TOKEN') && !isGated) {
    failures.push(`${SERVER_FILE}: route ${path} calls Replicate but has no requireWhitelisted() guard`);
  }
}

if (gatedRoutes.length === 0) failures.push('No gated routes found — did requireWhitelisted() get removed or renamed?');

// Route params can't be matched literally, so compare against the static prefix.
const gatedPrefixes = [...new Set(gatedRoutes.map((p) => p.replace(/\/:.*$/, '')))];

const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : /\.tsx?$/.test(full) ? [full] : [];
  });

for (const file of walk('src')) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (!gatedPrefixes.some((p) => line.includes(`${p}/`) || line.includes(`${p}\``) || line.includes(`${p}?`))) return;
    // The Authorization header sits within a few lines of the URL.
    const window = lines.slice(i, i + 6).join('\n');
    if (window.includes('publicAnonKey')) {
      failures.push(`${file}:${i + 1}: calls a whitelist-gated route with publicAnonKey instead of getAuthToken()`);
    }
  });
}

if (failures.length) {
  console.error('AI access check FAILED:\n' + failures.map((f) => `  - ${f}`).join('\n'));
  process.exit(1);
}
console.log(`AI access check OK: ${gatedRoutes.length} gated routes, no client call site uses the anon key.`);
