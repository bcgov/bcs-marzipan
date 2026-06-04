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
    const targetMigration = '0006_20260604_show_in_user_management.sql';
    const migrationPath = path.join(migrationsDir, targetMigration);
    if(!fs.existsSync(migrationPath)){
      console.error('Migration file not found:', migrationPath);
      process.exit(1);
    }
    const content = fs.readFileSync(migrationPath, 'utf8');
    const hash = crypto.createHash('sha256').update(content).digest('hex');

    await sql`create schema if not exists drizzle`;
    await sql`create table if not exists drizzle.__drizzle_migrations (
      id integer primary key,
      hash text not null,
      created_at bigint not null
    )`;

    const exists = await sql`select count(*)::int as cnt from drizzle.__drizzle_migrations where hash = ${hash}`;
    if(exists[0] && exists[0].cnt > 0){
      console.log('Migration already recorded:', targetMigration);
    }else{
      console.log('Applying migration:', targetMigration);
      await sql.unsafe(content);
      const maxIdRes = await sql`select max(id)::int as maxid from drizzle.__drizzle_migrations`;
      const nextId = (maxIdRes[0] && maxIdRes[0].maxid) ? maxIdRes[0].maxid + 1 : 1;
      await sql`insert into drizzle.__drizzle_migrations (id, hash, created_at) values (${nextId}, ${hash}, ${Date.now()})`;
      console.log('Migration applied and recorded.');
    }

    // apply seed file 0012 if present
    const seedFile = '0012_20260604_show_in_user_management_seed.sql';
    const seedPath = path.join(seedDir, seedFile);
    if(fs.existsSync(seedPath)){
      const seedContent = fs.readFileSync(seedPath, 'utf8');
      console.log('Applying seed:', seedFile);
      await sql.unsafe(seedContent);
      console.log('Seed applied.');
    }else{
      console.log('Seed file not found:', seedPath);
    }

    await sql.end();
    console.log('Done.');
  }catch(err){
    console.error('Failed:', err);
    await sql.end();
    process.exit(1);
  }
})();
