#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const postgres = require('postgres');

(async ()=>{
  const sql = postgres(process.env.DATABASE_URL);
  const keys = ['activities.approve','activities.complete','activities.create','activities.create.any','activities.delete','activities.delete.any','activities.edit','reports.view','reports.export','reports.create_custom'];
  const rows = await sql`select key, show_in_user_management from permissions where key = any(${keys}) order by key`;
  console.table(rows);
  await sql.end();
})();
