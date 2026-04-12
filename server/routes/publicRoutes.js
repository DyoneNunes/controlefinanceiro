const express = require('express');
const pool = require('../config/db');
const { getModelConfig } = require('../config/geminiConfig');

const router = express.Router();

router.get('/notifications', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM global_notifications ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/config', (req, res) => {
    console.log('>>> /config called (public)');
    const config = getModelConfig();
    res.json({
        model: config.model,
        planType: config.planType,
        availableModels: config.availableModels,
        defaults: config.defaults
    });
});

module.exports = router;
