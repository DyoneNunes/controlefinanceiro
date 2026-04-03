const express = require('express');
const { getModelConfig } = require('../config/geminiConfig');

const router = express.Router();

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
