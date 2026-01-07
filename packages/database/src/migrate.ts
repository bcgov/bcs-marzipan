import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const sql = postgres(databaseUrl, { max: 1 });
const db = drizzle(sql);

async function run() {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      'You are running runtime migrations in development. ' +
        'Use db:migrate:local instead.'
    );
  } else {
    console.log('Running Drizzle migrations...');
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log('Migrations completed');
    await sql.end();
  }
}

run().catch((err) => {
  console.error('Migration failed', err);
  process.exit(1);
});
