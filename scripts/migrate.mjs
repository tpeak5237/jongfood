import { createPostgresStore } from '../src/server/postgres-store.mjs';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for migrations.');
const store = createPostgresStore({ connectionString: process.env.DATABASE_URL, autoMigrate: true });
try {
  await store.ready();
  console.log('PostgreSQL migrations applied.');
} finally {
  await store.close();
}
