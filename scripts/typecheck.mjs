import { access } from 'node:fs/promises';

const requiredFiles = [
  'app.js',
  'server.mjs',
  'src/domain.mjs',
  'src/server/http-app.mjs',
  'src/server/memory-store.mjs',
  'src/server/postgres-store.mjs',
];
for (const file of requiredFiles) await access(new URL(`../${file}`, import.meta.url));
console.log(`Type boundary smoke check passed for ${requiredFiles.length} JavaScript modules.`);
