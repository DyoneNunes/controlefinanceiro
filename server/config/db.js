const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT,
});

pool.query('SELECT NOW()', (err, res) => {
    if (err) console.error('Error connecting to database:', err);
    else {
        console.log('Connected to PostgreSQL database');
    }
});

module.exports = pool;
