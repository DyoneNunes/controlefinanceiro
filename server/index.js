const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); 
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('redis');
const crypto = require('crypto');
const multer = require('multer');
const ofx = require('node-ofx-parser');
// const pdf = require('pdf-parse'); 
require('dotenv').config({ override: true });

const app = express();
const port = 3000;

// Multer Setup
const upload = multer({ storage: multer.memoryStorage() });

if (!process.env.JWT_SECRET) {
  console.error('CRITICAL ERROR: JWT_SECRET environment variable is not set.');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

// CORS Configuration
app.use(cors({
  origin: true, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Group-ID']
}));

app.use(express.json());

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
});

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
           ON CONFLICT (username) DO NOTHING`,
          [cred.user, hash]
        );
        console.log(`User ${cred.user} checked/synced.`);
      } catch (err) {
        console.error(`Failed to sync user ${cred.user}:`, err);
      }
    }
  }
};

pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('Error connecting to database:', err);
  else {
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
  if (!groupId) return res.status(400).json({ error: 'X-Group-ID header is required' });
  const isValidUUID = (id) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
  if (!isValidUUID(groupId)) return res.status(400).json({ error: 'Invalid Group ID format' });

  try {
    const result = await pool.query('SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, req.user.id]);
    if (result.rows.length === 0) return res.status(403).json({ error: 'Access denied' });
    req.group = { id: groupId, role: result.rows[0].role };
    next();
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const isValidUUID = (id) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
const isValidAmount = (val) => !isNaN(parseFloat(val)) && isFinite(val) && parseFloat(val) > 0;

app.get('/', (req, res) => { res.send('API is running.'); });

app.post('/api/auth/login', async (req, res) => {
  let { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
  
  username = username.trim().toLowerCase();
  password = password.trim();

  try {
    const result = await pool.query('SELECT * FROM users WHERE LOWER(username) = $1', [username]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Credenciais inválidas' });
    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) return res.status(401).json({ error: 'Credenciais inválidas' });
    const token = jwt.sign({ username: user.username, id: user.id }, JWT_SECRET, { expiresIn: '8h' });

    // --- AUTO-CREATE DEFAULT GROUP IF NONE EXISTS ---
    const groupCheck = await pool.query('SELECT group_id FROM group_members WHERE user_id = $1 LIMIT 1', [user.id]);
    if (groupCheck.rows.length === 0) {
      console.log(`Auto-creating default group for user ${user.username}`);
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const groupRes = await client.query('INSERT INTO finance_groups (name) VALUES ($1) RETURNING id', ['Minha Carteira']);
        const newGroupId = groupRes.rows[0].id;
        await client.query('INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)', [newGroupId, user.id, 'admin']);
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        console.error('Failed to auto-create group:', e);
      } finally {
        client.release();
      }
    }

    res.json({ username: user.username, token: token, success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.get('/api/auth/validate', authenticateToken, (req, res) => {
  res.json({ valid: true, username: req.user.username });
});

app.get('/api/groups', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT g.id, g.name, gm.role FROM finance_groups g JOIN group_members gm ON g.id = gm.group_id WHERE gm.user_id = $1 ORDER BY gm.joined_at ASC', [req.user.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/groups', authenticateToken, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const groupRes = await client.query('INSERT INTO finance_groups (name) VALUES ($1) RETURNING id, name', [name]);
    const newGroupId = groupRes.rows[0].id;
    await client.query('INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)', [newGroupId, req.user.id, 'admin']);
    await client.query('COMMIT');
    res.json({ id: newGroupId, name: groupRes.rows[0].name, role: 'admin' });
  } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ error: err.message }); }
  finally { client.release(); }
});

// Bills
app.get('/api/bills', authenticateToken, requireGroupAccess, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM bills WHERE group_id = $1 ORDER BY due_date ASC', [req.group.id]);
    res.json(rows.map(r => ({ ...r, dueDate: r.due_date.toISOString(), paidDate: r.paid_date ? r.paid_date.toISOString() : null })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/bills', authenticateToken, requireGroupAccess, async (req, res) => {
  const { name, value, dueDate, status } = req.body;
  if (!name || !isValidAmount(value) || !dueDate) return res.status(400).json({ error: 'Invalid input' });
  try {
    const result = await pool.query('INSERT INTO bills (name, value, due_date, status, group_id, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [name, value, dueDate, status, req.group.id, req.user.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/bills/:id', authenticateToken, requireGroupAccess, async (req, res) => {
  try { await pool.query('DELETE FROM bills WHERE id = $1 AND group_id = $2', [req.params.id, req.group.id]); res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/bills/:id/pay', authenticateToken, requireGroupAccess, async (req, res) => {
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
  try {
    const result = await pool.query('INSERT INTO incomes (description, value, date, group_id, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *', [description, value, date, req.group.id, req.user.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/incomes/:id', authenticateToken, requireGroupAccess, async (req, res) => {
  try { await pool.query('DELETE FROM incomes WHERE id = $1 AND group_id = $2', [req.params.id, req.group.id]); res.json({ message: 'Deleted' });
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
  try { await pool.query('DELETE FROM investments WHERE id = $1 AND group_id = $2', [req.params.id, req.group.id]); res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Random Expenses
app.get('/api/random-expenses', authenticateToken, requireGroupAccess, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM random_expenses WHERE group_id = $1 ORDER BY date DESC', [req.group.id]);
    res.json(rows.map(r => ({ ...r, date: r.date.toISOString(), paidDate: r.paid_date ? r.paid_date.toISOString() : null })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/random-expenses', authenticateToken, requireGroupAccess, async (req, res) => {
  const { name, value, date, status } = req.body;
  try {
    const result = await pool.query('INSERT INTO random_expenses (name, value, date, status, group_id, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [name, value, date, status || 'paid', req.group.id, req.user.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/random-expenses/:id', authenticateToken, requireGroupAccess, async (req, res) => {
  try { await pool.query('DELETE FROM random_expenses WHERE id = $1 AND group_id = $2', [req.params.id, req.group.id]); res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/random-expenses/:id/pay', authenticateToken, requireGroupAccess, async (req, res) => {
  try {
    const result = await pool.query(`UPDATE random_expenses SET status = 'paid', paid_date = NOW() WHERE id = $1 AND group_id = $2 RETURNING *`, [req.params.id, req.group.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Advisor
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
    const dataSummary = `DADOS: Rendas: ${incomes.rows.map(i => i.description + ': R$ ' + formatMoney(i.value)).join(', ') || 'Nenhuma'}. Contas: ${bills.rows.map(b => b.name + ': R$ ' + formatMoney(b.value)).join(', ') || 'Nenhuma'}. Gastos Variáveis: ${random.rows.map(r => r.name + ': R$ ' + formatMoney(r.value)).join(', ') || 'Nenhum'}.`;
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { response_mime_type: "application/json" } });
    const prompt = `Analise em PT-BR e retorne JSON: {"diagnostico": "...", "pontos_atencao": ["..."], "estrategia": [{"titulo": "...", "detalhe": "..."}], "recomendacao_investimentos": "..."}. Dados: ${dataSummary}`;
    const result = await model.generateContent(prompt);
    const text = (await result.response).text();
    const parsedAdvice = JSON.parse(text);

    // Save to history
    await pool.query(
      'INSERT INTO ai_advisor_history (group_id, user_id, summary_input, advice_output) VALUES ($1, $2, $3, $4)',
      [req.group.id, req.user.id, dataSummary, JSON.stringify(parsedAdvice)]
    );

    res.json({ advice: parsedAdvice });
  } catch (err) { 
    console.error('Advisor error:', err);
    res.status(500).json({ error: err.message }); 
  }
});

app.get('/api/advisor/history', authenticateToken, requireGroupAccess, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, generated_at, advice_output->>'diagnostico' as diagnostico_summary 
       FROM ai_advisor_history 
       WHERE group_id = $1 
       ORDER BY generated_at DESC`,
      [req.group.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/advisor/history/:id', authenticateToken, requireGroupAccess, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT advice_output FROM ai_advisor_history WHERE id = $1 AND group_id = $2',
      [req.params.id, req.group.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Histórico não encontrado' });
    res.json(rows[0].advice_output);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Unified Import (OFX / PDF)
app.post('/api/import/ofx', authenticateToken, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const isPdf = req.file.mimetype === 'application/pdf' || req.file.originalname.endsWith('.pdf');
    let transactions = [];
    if (isPdf) {
      try {
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(req.file.buffer);
        const textContent = data.text;

        console.log("PDF text extracted length:", textContent.length);

        const model = genAI.getGenerativeModel({ 
          model: "gemini-2.5-flash",
          generationConfig: { response_mime_type: "application/json" }
        });        const prompt = `
          Atue como um parser de extratos bancários. Analise o texto bruto abaixo extraído de um PDF e identifique as transações individuais.
          
          Regras de Saída:
          1. Retorne APENAS um JSON Array válido.
          2. Formato do Objeto: 
             {
               "date": "YYYY-MM-DD", (Data da transação)
               "description": "Descrição da compra/transferência",
               "amount": Number (Valor absoluto, ex: 10.50),
               "type": "DEBIT" (se for gasto/saída) ou "CREDIT" (se for entrada/depósito).
             }
          3. Ignore linhas de saldo, cabeçalhos de extrato ou rodapés.
          4. Se encontrar valores com "D" ou sinal negativo "-", classifique como DEBIT.
          
          Texto do PDF:
          ${textContent.slice(0, 50000)}
        `;

        const result = await model.generateContent(prompt);
        let responseText = await result.response.text();
        
        console.log("Gemini Raw Response Length:", responseText.length);
        
        // Limpeza básica para garantir JSON válido
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        let aiTransactions;
        try {
          aiTransactions = JSON.parse(responseText);
        } catch (parseErr) {
          console.error("Failed to parse Gemini JSON:", responseText);
          throw new Error("A IA retornou um formato inválido. Tente novamente.");
        }

        transactions = aiTransactions.map((tx, index) => {
          const absAmount = Math.abs(parseFloat(tx.amount));
          const finalAmount = tx.type === 'DEBIT' ? -absAmount : absAmount;
          return {
            id: `pdf-ai-${index}-${Date.now()}`,
            date: tx.date,
            amount: finalAmount,
            description: tx.description,
            type: tx.type,
            category: tx.type === 'CREDIT' ? 'income' : 'expense',
            selected: true
          };
        });

      } catch (pdfErr) {
        console.error('PDF AI parsing error:', pdfErr);
        return res.status(500).json({ error: 'Erro ao processar PDF com Inteligência Artificial. Verifique se o arquivo é legível.' });
      }
    } else {
      const data = ofx.parse(req.file.buffer.toString('utf8'));
      const stmtTrn = data.OFX.BANKMSGSRSV1?.STMTTRNRS?.STMTRS?.BANKTRANLIST?.STMTTRN;
      if (stmtTrn) {
        const txList = Array.isArray(stmtTrn) ? stmtTrn : [stmtTrn];
        transactions = txList.map((tx, index) => ({ id: tx.FITID || index, date: tx.DTPOSTED, amount: parseFloat(tx.TRNAMT), description: tx.MEMO || tx.NAME, type: 'DEBIT', category: 'expense', selected: true }));
      }
    }
    res.json({ transactions });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/import/confirm', authenticateToken, requireGroupAccess, async (req, res) => {
    const { transactions } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const tx of transactions) {
            if (!tx.selected) continue;
            const amount = Math.abs(parseFloat(tx.amount));
            if (tx.category === 'income') await client.query('INSERT INTO incomes (description, value, date, group_id, user_id) VALUES ($1, $2, $3, $4, $5)', [tx.description, amount, tx.date, req.group.id, req.user.id]);
            else await client.query('INSERT INTO random_expenses (name, value, date, status, group_id, user_id) VALUES ($1, $2, $3, $4, $5, $6)', [tx.description, amount, tx.date, 'paid', req.group.id, req.user.id]);
        }
        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ error: err.message }); }
    finally { client.release(); }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});