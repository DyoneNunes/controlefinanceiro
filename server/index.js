const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pool = require('./config/db');
require('dotenv').config({ override: true });

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
const aiImportRoutes = require('./routes/aiImportRoutes');

app.get('/', (req, res) => { res.send('API is running (Modular).'); });

app.use('/api/auth', authRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/finance', financeRoutes); // Note: financeRoutes covers incomes, investments, random-expenses
app.use('/api', aiImportRoutes); // Advisor and Import endpoints

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
