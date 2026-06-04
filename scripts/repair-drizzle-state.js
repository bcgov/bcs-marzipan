#!/usr/bin/env node
const path = require('path');
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
    const schema = await sql`select schema_name from information_schema.schemata where schema_name='drizzle'`;
    if(schema.length === 0){
      console.log('drizzle schema not present — nothing to repair');
      await sql.end();
      process.exit(0);
    }
    console.log('drizzle schema exists');
    const tables = await sql`select table_name from information_schema.tables where table_schema='drizzle'`;
    console.log('tables in drizzle schema:', tables.map(t=>t.table_name));
    const countRes = await sql`select count(*)::int as cnt from drizzle.__drizzle_migrations`;
    const cnt = countRes[0] ? countRes[0].cnt : 0;
    console.log('__drizzle_migrations row count:', cnt);
    if(cnt === 0){
      // only drop schema if it contains only __drizzle_migrations (to avoid destroying other objects)
      if(tables.length === 1 && tables[0].table_name === '__drizzle_migrations'){
        console.log('Dropping empty drizzle schema so drizzle-kit can reinitialise it...');
        await sql`drop schema drizzle cascade`;
        console.log('Dropped drizzle schema');
      }else{
        console.log('drizzle schema contains other tables — not dropping. Please inspect manually.');
      }
    }else{
      console.log('drizzle migrations table already populated — no action needed');
    }
    await sql.end();
  }catch(err){
    console.error('Repair failed:', err);
    await sql.end();
    process.exit(1);
  }
})();
