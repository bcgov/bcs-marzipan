#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const postgres = require('postgres');

(async function main(){
  const DATABASE_URL = process.env.DATABASE_URL;
  if(!DATABASE_URL){
    console.error('DATABASE_URL not set in .env');
    process.exit(1);
  }
  const sql = postgres(DATABASE_URL, { max: 1 });

  try{
    const migrationsDir = path.resolve(__dirname, '..', 'packages', 'database', 'migrations');
    const seedDir = path.resolve(__dirname, '..', 'packages', 'database', 'seeds');
    if(!fs.existsSync(migrationsDir)){
      console.error('Migrations directory not found:', migrationsDir);
      process.exit(1);
    }
    const files = fs.readdirSync(migrationsDir).filter(f=>f.endsWith('.sql')).sort();

    // ensure drizzle schema/table exists with minimal columns
    await sql`create schema if not exists drizzle`;
    // create table if not exists with expected minimal columns
    await sql`create table if not exists drizzle.__drizzle_migrations (
      id integer primary key,
      hash text not null,
      created_at bigint not null
    )`;

    // fetch existing hashes
    const existing = await sql`select id, hash from drizzle.__drizzle_migrations order by id`;
    const existingHashes = new Set(existing.map(r=>r.hash));
    let nextId = existing.length ? existing[existing.length-1].id + 1 : 1;

    for(const f of files){
      const full = path.join(migrationsDir, f);
      const content = fs.readFileSync(full, 'utf8');
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      if(existingHashes.has(hash)){
        console.log('Skipping already-applied migration:', f);
        continue;
      }
      console.log('Applying migration:', f);
      await sql.unsafe(content);
      const now = Date.now();
      await sql`insert into drizzle.__drizzle_migrations (id, hash, created_at) values (${nextId}, ${hash}, ${now})`;
      nextId++;
    }

    // apply seeds
    if(fs.existsSync(seedDir)){
      const seedFiles = fs.readdirSync(seedDir).filter(f=>f.endsWith('.sql')).sort();
      for(const s of seedFiles){
        const full = path.join(seedDir, s);
        const content = fs.readFileSync(full, 'utf8');
        console.log('Applying seed:', s);
        await sql.unsafe(content);
      }
    }

    console.log('Migrations and seeds applied successfully');
    await sql.end();
  }catch(err){
    console.error('Failed to apply migrations/seeds:', err);
    await sql.end();
    process.exit(1);
  }
})();
