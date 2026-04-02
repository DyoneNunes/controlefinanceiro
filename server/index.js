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

// Routes
const authRoutes = require('./routes/authRoutes');
const billRoutes = require('./routes/billRoutes');
const financeRoutes = require('./routes/financeRoutes');
const encryptionRoutes = require('./routes/encryptionRoutes');
const aiImportRoutes = require('./routes/aiImportRoutes');

app.use('/public', express.static(require('path').join(__dirname, 'public')));
app.get('/', (req, res) => { res.send('API is running (Modular + E2EE).'); });

app.use('/api/auth', authRoutes);
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/encryption', encryptionRoutes); // E2EE key management (per-user, no group required)
app.use('/api/bills', billRoutes);
app.use('/api', financeRoutes); // incomes, investments, random-expenses
app.use('/api', aiImportRoutes); // Advisor and Import endpoints — must be last (has global auth middleware)

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
