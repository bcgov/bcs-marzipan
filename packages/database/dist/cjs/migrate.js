"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const migrator_1 = require("drizzle-orm/postgres-js/migrator");
const postgres_1 = __importDefault(require("postgres"));
const postgres_js_1 = require("drizzle-orm/postgres-js");
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
}
const sql = (0, postgres_1.default)(databaseUrl, { max: 1 });
const db = (0, postgres_js_1.drizzle)(sql);
async function run() {
    if (process.env.NODE_ENV === 'development') {
        console.warn('You are running runtime migrations in development. ' +
            'Use db:migrate:local instead.');
    }
    else {
        console.log('Running Drizzle migrations...');
        await (0, migrator_1.migrate)(db, { migrationsFolder: 'drizzle' });
        console.log('Migrations completed');
        await sql.end();
    }
}
run().catch((err) => {
    console.error('Migration failed', err);
    process.exit(1);
});
