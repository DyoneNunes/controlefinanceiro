const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config({ override: true });
const pool = require('./config/db');

const app = express();
const port = 3000;

if (!process.env.JWT_SECRET) {
  console.error('CRITICAL ERROR: JWT_SECRET environment variable is not set.');
  process.exit(1);
}

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Group-ID']
}));
app.use(express.json());

// ROTA PÚBLICA - no topo, antes de qualquer middleware
app.get('/api/config/gemini', (req, res) => {
    const { getModelConfig } = require('./config/geminiConfig');
    const config = getModelConfig();
    res.json({
        model: config.model,
        planType: config.planType,
        availableModels: config.availableModels,
        defaults: config.defaults
    });
});

// Routes
const authRoutes = require('./routes/authRoutes');
const billRoutes = require('./routes/billRoutes');
const financeRoutes = require('./routes/financeRoutes');
const encryptionRoutes = require('./routes/encryptionRoutes');
const aiImportRoutes = require('./routes/aiImportRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api', require('./routes/publicRoutes'));
app.use('/api/encryption', encryptionRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/ai', aiImportRoutes);
app.use('/api', financeRoutes);

app.use('/public', express.static(require('path').join(__dirname, 'public')));
app.get('/', (req, res) => { res.send('API is running (Modular + E2EE).'); });

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: err.message });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);

  // Iniciar agendador de e-mails
  const { initScheduler } = require('./services/schedulerService');
  initScheduler();
});
