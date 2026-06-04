#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
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
    console.log('drizzle schema exists: ', schema.length > 0);
    const tables = await sql`select table_name from information_schema.tables where table_schema='drizzle'`;
    console.log('tables in drizzle schema:');
    console.table(tables);
    const cols = await sql`select column_name, data_type from information_schema.columns where table_schema='drizzle' and table_name='__drizzle_migrations'`;
    console.log('__drizzle_migrations columns:');
    console.table(cols);
    const count = await sql`select count(*)::int as cnt from drizzle.__drizzle_migrations`;
    console.log('rows count in drizzle.__drizzle_migrations:', count[0] ? count[0].cnt : 0);
    const rows = await sql`select * from drizzle.__drizzle_migrations limit 50`;
    console.log('sample rows:');
    console.table(rows);
    await sql.end();
  }catch(err){
    console.error('Query failed:', err);
    await sql.end();
    process.exit(1);
  }
})();
