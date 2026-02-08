const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' }); // Adjust path if needed

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: 'localhost',
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
});

async function createUser() {
  const username = 'Quilombus';
  const passwordRaw = 'Quilombus2026@'; // Assumed intended password sans typo
  
  try {
    const hash = await bcrypt.hash(passwordRaw, 10);
    const res = await pool.query(
      `INSERT INTO users (username, password_hash) VALUES ($1, $2)
       ON CONFLICT (username) DO UPDATE SET password_hash = $2
       RETURNING id, username`,
      [username, hash]
    );
    console.log(`User created/updated: ${res.rows[0].username} (ID: ${res.rows[0].id})`);
    
    // Ensure this user has a personal group too
    const userId = res.rows[0].id;
    const groupRes = await pool.query(
        `INSERT INTO finance_groups (name) VALUES ($1) RETURNING id`,
        ['Finanças de ' + username]
    );
    const groupId = groupRes.rows[0].id;
    
    await pool.query(
        `INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 'admin')
         ON CONFLICT DO NOTHING`,
        [groupId, userId]
    );
    console.log('Personal group created for Quilombus');

  } catch (err) {
    console.error('Error creating user:', err);
  } finally {
    await pool.end();
  }
}

createUser();
