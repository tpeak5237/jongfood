import { cp, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
await rm(dist, { recursive: true, force: true });
await mkdir(join(dist, 'src', 'server'), { recursive: true });
await mkdir(join(dist, 'db', 'migrations'), { recursive: true });
await cp(join(root, 'index.html'), join(dist, 'index.html'));
await cp(join(root, 'styles.css'), join(dist, 'styles.css'));
await cp(join(root, 'app.js'), join(dist, 'app.js'));
await cp(join(root, 'src', 'domain.mjs'), join(dist, 'src', 'domain.mjs'));
await cp(join(root, 'server.mjs'), join(dist, 'server.mjs'));
await cp(join(root, 'src', 'server'), join(dist, 'src', 'server'), { recursive: true });
await cp(join(root, 'db', 'migrations', '001_initial.sql'), join(dist, 'db', 'migrations', '001_initial.sql'));
console.log('JongFood build complete: dist/');
