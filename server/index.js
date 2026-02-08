const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); 
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('redis');
const crypto = require('crypto');
require('dotenv').config({ override: true });

const app = express();
const port = 3000;

if (!process.env.JWT_SECRET) {
  console.error('CRITICAL ERROR: JWT_SECRET environment variable is not set.');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

// Initialize AI Client GLOBALLY
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize Redis Client
const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

(async () => {
    try {
        await redisClient.connect();
        console.log('Connected to Redis');
    } catch (err) {
        console.error('Failed to connect to Redis:', err);
    }
})();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false 
}));
app.use(cors());
app.use(express.json());

// Database Connection
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
});

// Sync Users from ENV
const syncUsers = async () => {
  const usersToSync = [
    { user: process.env.APP_USER_DYONE, pass: process.env.APP_PASS_DYONE },
    { user: process.env.APP_USER_JULIA, pass: process.env.APP_PASS_JULIA }
  ];

  for (const cred of usersToSync) {
    if (cred.user && cred.pass) {
      try {
        const hash = await bcrypt.hash(cred.pass, 10);
        await pool.query(
          `INSERT INTO users (username, password_hash) VALUES ($1, $2)
           ON CONFLICT (username) DO UPDATE SET password_hash = $2`,
          [cred.user, hash]
        );
        console.log(`User ${cred.user} synced from environment.`);
      } catch (err) {
        console.error(`Failed to sync user ${cred.user}:`, err);
      }
    }
  }
};

// Test DB Connection & Sync
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to PostgreSQL database');
    syncUsers();
  }
});

// --- AUTH MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const requireGroupAccess = async (req, res, next) => {
  const groupId = req.headers['x-group-id'];
  
  if (!groupId) {
     return res.status(400).json({ error: 'X-Group-ID header is required' });
  }

  // Simple UUID regex check
  const isValidUUID = (id) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);

  if (!isValidUUID(groupId)) {
    return res.status(400).json({ error: 'Invalid Group ID format' });
  }

  try {
    const result = await pool.query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this group' });
    }

    req.group = { id: groupId, role: result.rows[0].role };
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error validating group access' });
  }
};

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
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign({ username: user.username, id: user.id }, JWT_SECRET, { expiresIn: '8h' });

    res.json({
      username: user.username, 
      token: token,
      success: true 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

app.get('/api/auth/validate', authenticateToken, (req, res) => {
  res.json({ valid: true, username: req.user.username });
});

// --- GROUP MANAGEMENT ---
app.get('/api/groups', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT g.id, g.name, gm.role 
      FROM finance_groups g
      JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = $1
      ORDER BY gm.joined_at ASC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/groups', authenticateToken, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Group name required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const groupRes = await client.query('INSERT INTO finance_groups (name) VALUES ($1) RETURNING id, name', [name]);
    const newGroupId = groupRes.rows[0].id;
    await client.query('INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)', [newGroupId, req.user.id, 'admin']);
    await client.query('COMMIT');
    res.json({ id: newGroupId, name: groupRes.rows[0].name, role: 'admin' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.post('/api/groups/:id/invite', authenticateToken, requireGroupAccess, async (req, res) => {
  const { username } = req.body;
  if (req.group.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can invite members' });
  }
  try {
    const userRes = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const newMemberId = userRes.rows[0].id;
    await pool.query('INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [req.group.id, newMemberId, 'editor']);
    res.json({ message: `User ${username} added to group` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET a specific group by ID
app.get('/api/groups/:id', authenticateToken, requireGroupAccess, async (req, res) => {
  try {
    const { id } = req.params;
    // requireGroupAccess already ensures req.group.id is valid and user is a member
    const { rows } = await pool.query('SELECT id, name, created_at FROM finance_groups WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Update a group by ID
app.put('/api/groups/:id', authenticateToken, requireGroupAccess, async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Group name is required' });
  }

  // Ensure only admins can update the group name
  if (req.group.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can update group details' });
  }

  try {
    const { rows } = await pool.query(
      'UPDATE finance_groups SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, created_at, updated_at',
      [name, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Group not found or not authorized to update' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE a group by ID
app.delete('/api/groups/:id', authenticateToken, requireGroupAccess, async (req, res) => {
  const { id } = req.params;

  // Ensure only admins can delete the group
  if (req.group.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can delete a group' });
  }

  try {
    const { rowCount } = await pool.query('DELETE FROM finance_groups WHERE id = $1', [id]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Group not found or not authorized to delete' });
    }
    res.json({ message: 'Group deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- FINANCIAL RESOURCES (Scoped by Group) ---

// Bills
app.get('/api/bills', authenticateToken, requireGroupAccess, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM bills WHERE group_id = $1 ORDER BY due_date ASC', [req.group.id]);
    const formatted = rows.map(r => ({ ...r, dueDate: r.due_date.toISOString(), paidDate: r.paid_date ? r.paid_date.toISOString() : null }));
    res.json(formatted);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/bills', authenticateToken, requireGroupAccess, async (req, res) => {
  const { name, value, dueDate, status } = req.body;
  if (!name || !isValidAmount(value) || !dueDate) return res.status(400).json({ error: 'Invalid input data' });
  try {
    const result = await pool.query('INSERT INTO bills (name, value, due_date, status, group_id, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [name, value, dueDate, status, req.group.id, req.user.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/bills/:id', authenticateToken, requireGroupAccess, async (req, res) => {
  if (!isValidUUID(req.params.id)) return res.status(400).json({ error: 'Invalid ID format' });
  try {
    await pool.query('DELETE FROM bills WHERE id = $1 AND group_id = $2', [req.params.id, req.group.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/bills/:id/pay', authenticateToken, requireGroupAccess, async (req, res) => {
  if (!isValidUUID(req.params.id)) return res.status(400).json({ error: 'Invalid ID format' });
  try {
    const result = await pool.query(`UPDATE bills SET status = 'paid', paid_date = NOW() WHERE id = $1 AND group_id = $2 RETURNING *`, [req.params.id, req.group.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Incomes
app.get('/api/incomes', authenticateToken, requireGroupAccess, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM incomes WHERE group_id = $1 ORDER BY date DESC', [req.group.id]);
    res.json(rows.map(r => ({ ...r, date: r.date.toISOString() })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/incomes', authenticateToken, requireGroupAccess, async (req, res) => {
  const { description, value, date } = req.body;
  if (!description || !isValidAmount(value) || !date) return res.status(400).json({ error: 'Invalid input data' });
  try {
    const result = await pool.query('INSERT INTO incomes (description, value, date, group_id, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *', [description, value, date, req.group.id, req.user.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/incomes/:id', authenticateToken, requireGroupAccess, async (req, res) => {
  if (!isValidUUID(req.params.id)) return res.status(400).json({ error: 'Invalid ID format' });
  try {
    await pool.query('DELETE FROM incomes WHERE id = $1 AND group_id = $2', [req.params.id, req.group.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Investments
app.get('/api/investments', authenticateToken, requireGroupAccess, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM investments WHERE group_id = $1 ORDER BY created_at DESC', [req.group.id]);
    res.json(rows.map(r => ({ ...r, initialAmount: parseFloat(r.initial_amount), cdiPercent: r.cdi_percent, startDate: r.start_date.toISOString(), durationMonths: r.duration_months })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/investments', authenticateToken, requireGroupAccess, async (req, res) => {
  const { name, initialAmount, cdiPercent, startDate, durationMonths } = req.body;
  try {
    const result = await pool.query('INSERT INTO investments (name, initial_amount, cdi_percent, start_date, duration_months, group_id, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [name, initialAmount, cdiPercent, startDate, durationMonths, req.group.id, req.user.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/investments/:id', authenticateToken, requireGroupAccess, async (req, res) => {
  try {
    await pool.query('DELETE FROM investments WHERE id = $1 AND group_id = $2', [req.params.id, req.group.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Random Expenses
app.get('/api/random-expenses', authenticateToken, requireGroupAccess, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM random_expenses WHERE group_id = $1 ORDER BY date DESC', [req.group.id]);
    const formatted = rows.map(r => ({ ...r, date: r.date.toISOString(), paidDate: r.paid_date ? r.paid_date.toISOString() : null }));
    res.json(formatted);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/random-expenses', authenticateToken, requireGroupAccess, async (req, res) => {
  const { name, value, date, status } = req.body;
  const finalStatus = status || 'paid';
  try {
    const result = await pool.query('INSERT INTO random_expenses (name, value, date, status, group_id, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [name, value, date, finalStatus, req.group.id, req.user.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/random-expenses/:id', authenticateToken, requireGroupAccess, async (req, res) => {
  try {
    await pool.query('DELETE FROM random_expenses WHERE id = $1 AND group_id = $2', [req.params.id, req.group.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/random-expenses/:id/pay', authenticateToken, requireGroupAccess, async (req, res) => {
  try {
    const result = await pool.query(`UPDATE random_expenses SET status = 'paid', paid_date = NOW() WHERE id = $1 AND group_id = $2 RETURNING *`, [req.params.id, req.group.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 7. AI Advisor
app.post('/api/advisor', authenticateToken, requireGroupAccess, async (req, res) => {
  try {
    const groupFilter = [req.group.id];
    
    const [incomes, bills, random, investments] = await Promise.all([
      pool.query(`SELECT * FROM incomes WHERE group_id = $1`, groupFilter),
      pool.query(`SELECT * FROM bills WHERE group_id = $1`, groupFilter),
      pool.query(`SELECT * FROM random_expenses WHERE group_id = $1`, groupFilter),
      pool.query(`SELECT * FROM investments WHERE group_id = $1`, groupFilter)
    ]);
    
    const formatMoney = (val) => parseFloat(val).toFixed(2);
    
    const dataSummary = `
      DADOS FINANCEIROS DO USUÁRIO (Carteira Atual):
      
      1. RENDAS MENSAIS (Entradas):
      ${incomes.rows.map(i => `- ${i.description}: R$ ${formatMoney(i.value)}`).join('\n') || 'Nenhuma renda cadastrada.'}
      
      2. CONTAS FIXAS (Obrigações):
      ${bills.rows.map(b => `- ${b.name}: R$ ${formatMoney(b.value)} (Status: ${b.status}, Vencimento: ${b.due_date})`).join('\n') || 'Nenhuma conta cadastrada.'}
      
      3. GASTOS VARIÁVEIS/ALEATÓRIOS (Últimos 30 dias):
      ${random.rows.map(r => `- ${r.name}: R$ ${formatMoney(r.value)} em ${r.date}`).join('\n') || 'Nenhum gasto variável recente.'}
      
      4. INVESTIMENTOS ATUAIS:
      ${investments.rows.map(inv => `- ${inv.name}: R$ ${formatMoney(inv.initial_amount)} (${inv.cdi_percent}% do CDI)`).join('\n') || 'Nenhum investimento.'}
    `;

    // --- CACHE STRATEGY (Redis) ---
    // Create a unique fingerprint (Hash) of the current financial data state
    const dataHash = crypto.createHash('md5').update(dataSummary).digest('hex');
    const cacheKey = `advisor:${req.group.id}:${dataHash}`;

    try {
        const cachedAdvice = await redisClient.get(cacheKey);
        if (cachedAdvice) {
            console.log(`⚡ Cache HIT for advisor: ${cacheKey}`);
            return res.json({ advice: JSON.parse(cachedAdvice) });
        }
    } catch (cacheErr) {
        console.error("Redis Read Error:", cacheErr);
        // Continue to generate fresh advice if cache fails
    }
    
    console.log(`🐢 Cache MISS for advisor. Generating new with Gemini...`);

    // Access the global genAI instance
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      generationConfig: { response_mime_type: "application/json" }
    });
    
    const prompt = `
      Atue como um consultor financeiro pessoal altamente qualificado. Analise os dados brutos abaixo e forneça um relatório estratégico em formato JSON.
      
      ${dataSummary}
      
      O JSON deve seguir EXATAMENTE esta estrutura:
      {
        "diagnostico": "Resumo curto da saúde financeira (Sobrando dinheiro? Endividado? Equilibrado?).",
        "pontos_atencao": ["Ponto 1", "Ponto 2", "Ponto 3"],
        "estrategia": [
          { "titulo": "Ação 1", "detalhe": "Descrição detalhada" },
          { "titulo": "Ação 2", "detalhe": "Descrição detalhada" },
          { "titulo": "Ação 3", "detalhe": "Descrição detalhada" }
        ],
        "recomendacao_investimentos": "Sugestão detalhada de onde alocar recursos."
      }
      
      Seja encorajador mas realista. Fale em português do Brasil.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const adviceJson = JSON.parse(text);

    // Save to Cache (Expire in 24 hours - 86400 seconds)
    // Even if data doesn't change, we might want to refresh advice eventually, 
    // but the main trigger is the dataHash changing.
    try {
        await redisClient.set(cacheKey, JSON.stringify(adviceJson), { EX: 86400 });
    } catch (cacheWriteErr) {
        console.error("Redis Write Error:", cacheWriteErr);
    }

    res.json({ advice: adviceJson });

  } catch (err) {
    console.error('AI Error:', err);
    res.status(500).json({ error: 'Falha ao gerar consultoria: ' + err.message });
  }
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});