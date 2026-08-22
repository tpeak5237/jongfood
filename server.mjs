import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { createJongFoodServer } from './src/server/http-app.mjs';
import { createMemoryStore } from './src/server/memory-store.mjs';
import { createPostgresStore } from './src/server/postgres-store.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);

export async function createConfiguredStore(env = process.env) {
  const usePostgres = Boolean(env.DATABASE_URL) && env.JONGFOOD_STORE !== 'memory';
  if (usePostgres) {
    const store = createPostgresStore({
      connectionString: env.DATABASE_URL,
      autoMigrate: env.JONGFOOD_AUTO_MIGRATE === 'true',
    });
    await store.ready();
    return store;
  }
  if (env.NODE_ENV === 'production') throw new Error('Production requires DATABASE_URL; the in-memory adapter is development/test only.');
  const store = createMemoryStore();
  await store.ready();
  return store;
}

export async function startServer({ env = process.env, listenPort = port, serverRoot = root } = {}) {
  const store = await createConfiguredStore(env);
  const server = createJongFoodServer({ store, root: serverRoot });
  await new Promise((resolve) => server.listen(listenPort, resolve));
  console.log(`JongFood running at http://localhost:${listenPort} (${store.kind} store)`);
  const shutdown = async () => {
    await new Promise((resolve) => server.close(resolve));
    await store.close();
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  return { server, store };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  startServer().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
