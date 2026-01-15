// Usage: node apply_userproduct_view.js [DATABASE_URL]
// If DATABASE_URL is omitted, the script will read DATABASE_URL env var.
import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

const sqlPath = path.join(process.cwd(), 'scripts', 'apply_userproduct_view.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

const databaseUrl = process.argv[2] || process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Missing DATABASE_URL. Provide it as an arg or set env var.');
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    console.log('Connected to database. Running SQL...');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('UserProduct view and grants applied successfully.');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Error applying SQL:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
