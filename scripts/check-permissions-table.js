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
    const tables = await sql`select table_schema, table_name from information_schema.tables where table_name='permissions'`;
    if(tables.length === 0){
      console.log('permissions table: NOT FOUND');
      await sql.end();
      process.exit(0);
    }
    console.log('permissions table found in schemas:');
    console.table(tables);
    for(const t of tables){
      const cols = await sql`
        select column_name, data_type
        from information_schema.columns
        where table_schema=${t.table_schema} and table_name='permissions'
      `;
      console.log(`columns in ${t.table_schema}.permissions:`);
      console.table(cols);
      const hasCol = cols.some(c => c.column_name === 'show_in_user_management');
      console.log(`${t.table_schema}.permissions has show_in_user_management:`, hasCol);
      const cnt = await sql(sql`select count(*)::int as cnt from ${sql(t.table_schema)}.${sql('permissions')}`);
      console.log(`row count in ${t.table_schema}.permissions:`, cnt[0] ? cnt[0].cnt : 0);
      const sample = await sql`select * from ${sql(t.table_schema)}.${sql('permissions')} limit 5`;
      console.log('sample rows:');
      console.table(sample);
    }
    await sql.end();
  }catch(err){
    console.error('Query failed:', err);
    await sql.end();
    process.exit(1);
  }
})();
