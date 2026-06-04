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
    const files = fs.readdirSync(migrationsDir).filter(f=>f.endsWith('.sql')).sort();
    await sql`create schema if not exists drizzle`;
    await sql`create table if not exists drizzle.__drizzle_migrations (
      id integer primary key,
      hash text not null,
      created_at bigint not null
    )`;
    const existing = await sql`select id, hash from drizzle.__drizzle_migrations order by id`;
    const existingHashes = new Set(existing.map(r=>r.hash));
    let nextId = existing.length ? existing[existing.length-1].id + 1 : 1;
    for(const f of files){
      const full = path.join(migrationsDir, f);
      const content = fs.readFileSync(full, 'utf8');
      const hash = crypto.createHash('sha256').update(content).digest('hex');
      if(existingHashes.has(hash)){
        console.log('Already recorded:', f);
        continue;
      }
      console.log('Recording migration as applied:', f);
      await sql`insert into drizzle.__drizzle_migrations (id, hash, created_at) values (${nextId}, ${hash}, ${Date.now()})`;
      nextId++;
    }
    await sql.end();
    console.log('All migrations recorded.');
  }catch(err){
    console.error('Failed to record migrations:', err);
    await sql.end();
    process.exit(1);
  }
})();
