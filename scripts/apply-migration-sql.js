const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const postgres = require('postgres');

async function main() {
  const migrationPath = path.resolve(__dirname, '..', 'packages', 'database', 'migrations', '0002_20260330_banner_variant_dismiss_scope.sql');
  if (!fs.existsSync(migrationPath)) {
    console.error('Migration file not found:', migrationPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('DATABASE_URL not set in .env');
    process.exit(1);
  }

  const sqlClient = postgres(DATABASE_URL, { max: 1 });

  try {
    console.log('Applying migration:', migrationPath);
    const res = await sqlClient.begin(async (tx) => {
      // Split on statement-breakpoint markers if present
      const parts = sql.split('--> statement-breakpoint').map((s) => s.trim()).filter(Boolean);
      for (const part of parts) {
        console.log('Executing statement...');
        await tx.unsafe(part);
      }
    });
    console.log('Migration applied successfully');
    await sqlClient.end();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    await sqlClient.end();
    process.exit(1);
  }
}

main();
