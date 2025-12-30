const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); 
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false // Disabled for Dev (Vite compatibility)
}));
app.use(cors());
app.use(express.json());

// Database Connection
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'finance_user',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'finance_app',
  password: process.env.POSTGRES_PASSWORD || 'secure_password_123',
  port: process.env.POSTGRES_PORT || 5432,
});

// Test DB Connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to PostgreSQL database');
  }
});

// --- VALIDATION HELPERS ---
const isValidUUID = (id) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
const isValidAmount = (val) => !isNaN(parseFloat(val)) && isFinite(val) && parseFloat(val) > 0;

// --- API ROUTES ---
app.get('/', (req, res) => { res.send('Finance API is running. Access endpoints at /api/...'); });

// 1. Auth Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];
    res.json({ username: user.username, hash: user.password_hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Bills
app.get('/api/bills', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM bills ORDER BY due_date ASC');
    const formatted = rows.map(r => ({
      ...r,
      dueDate: r.due_date.toISOString(),
      paidDate: r.paid_date ? r.paid_date.toISOString() : null
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bills', async (req, res) => {
  const { name, value, dueDate, status } = req.body;
  
  if (!name || !isValidAmount(value) || !dueDate) {
     return res.status(400).json({ error: 'Invalid input data' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO bills (name, value, due_date, status, user_id) 
       VALUES ($1, $2, $3, $4, (SELECT id FROM users LIMIT 1)) 
       RETURNING *`,
      [name, value, dueDate, status]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/bills/:id', async (req, res) => {
  if (!isValidUUID(req.params.id)) return res.status(400).json({ error: 'Invalid ID format' });
  try {
    await pool.query('DELETE FROM bills WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/bills/:id/pay', async (req, res) => {
  if (!isValidUUID(req.params.id)) return res.status(400).json({ error: 'Invalid ID format' });
  try {
    const result = await pool.query(
      `UPDATE bills SET status = 'paid', paid_date = NOW() WHERE id = $1 RETURNING *`, 
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Incomes
app.get('/api/incomes', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM incomes ORDER BY date DESC');
    res.json(rows.map(r => ({ ...r, date: r.date.toISOString() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/incomes', async (req, res) => {
  const { description, value, date } = req.body;
  if (!description || !isValidAmount(value) || !date) {
     return res.status(400).json({ error: 'Invalid input data' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO incomes (description, value, date, user_id) 
       VALUES ($1, $2, $3, (SELECT id FROM users LIMIT 1)) 
       RETURNING *`,
      [description, value, date]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/incomes/:id', async (req, res) => {
  if (!isValidUUID(req.params.id)) return res.status(400).json({ error: 'Invalid ID format' });
  try {
    await pool.query('DELETE FROM incomes WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Investments
app.get('/api/investments', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM investments ORDER BY created_at DESC');
    res.json(rows.map(r => ({ 
      ...r, 
      initialAmount: parseFloat(r.initial_amount),
      cdiPercent: r.cdi_percent,
      startDate: r.start_date.toISOString(),
      durationMonths: r.duration_months
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/investments', async (req, res) => {
  const { name, initialAmount, cdiPercent, startDate, durationMonths } = req.body;
  if (!name || !isValidAmount(initialAmount) || !startDate || !durationMonths) {
     return res.status(400).json({ error: 'Invalid input data' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO investments (name, initial_amount, cdi_percent, start_date, duration_months, user_id) 
       VALUES ($1, $2, $3, $4, $5, (SELECT id FROM users LIMIT 1)) 
       RETURNING *`,
      [name, initialAmount, cdiPercent, startDate, durationMonths]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/investments/:id', async (req, res) => {
  if (!isValidUUID(req.params.id)) return res.status(400).json({ error: 'Invalid ID format' });
  try {
    await pool.query('DELETE FROM investments WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});
