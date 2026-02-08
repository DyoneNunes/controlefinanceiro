const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load env vars
const envPath = path.resolve(__dirname, '../.env'); 
// Try loading from root if server/.env doesn't exist or we want to be sure
dotenv.config({ path: envPath });

// Override HOST for local execution (outside container)
// We assume the DB port 5432 is mapped to localhost:5432 as per docker-compose
process.env.POSTGRES_HOST = 'localhost';

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
});

async function migrate() {
  try {
    const sqlPath = path.join(__dirname, '../init-scripts/02-groups-migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log(`Connecting to ${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}...`);
    console.log('Running migration...');
    await pool.query(sql);
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

migrate();