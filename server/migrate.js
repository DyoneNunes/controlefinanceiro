const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load env vars
const envPath = path.resolve(__dirname, '../.env'); 
dotenv.config({ path: envPath });

// Override HOST for local execution (outside container)
process.env.POSTGRES_HOST = 'localhost';

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
});

async function migrate() {
  const initScriptsPath = path.join(__dirname, '../init-scripts');
  const migrationFiles = fs.readdirSync(initScriptsPath)
                           .filter(file => file.endsWith('.sql'))
                           .sort(); // Sorts alphabetically to ensure correct order (e.g., 01-..., 02-...)

  if (migrationFiles.length === 0) {
    console.log('No migration files found. Exiting.');
    await pool.end();
    return;
  }

  console.log(`Connecting to ${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}...`);
  
  for (const file of migrationFiles) {
    const filePath = path.join(initScriptsPath, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log(`Running migration from ${file}...`);
    try {
      await pool.query(sql);
      console.log(`Migration ${file} completed successfully.`);
    } catch (err) {
      console.error(`Migration ${file} failed:`, err);
      // It's crucial to stop if a migration fails to prevent further issues
      throw err; 
    }
  }
  console.log('All migrations completed successfully.');
}

migrate()
  .catch(err => {
    console.error('Overall migration process failed:', err);
  })
  .finally(async () => {
    await pool.end();
  });