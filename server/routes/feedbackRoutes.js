const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const jwt = require('jsonwebtoken');

const requireAdmin = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if (err || payload?.role !== 'admin') return res.sendStatus(403);
        next();
    });
};

// EventSource nao suporta header Authorization — token vem na query string.
// Aceita ?token= ou Authorization: Bearer (caso o cliente use fetch).
const requireAdminQuery = (req, res, next) => {
    const headerToken = req.headers['authorization']?.split(' ')[1];
    const token = headerToken || req.query.token;
    if (!token) return res.sendStatus(401);
    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if (err || payload?.role !== 'admin') return res.sendStatus(403);
        next();
    });
};

// IMPORTANTE: rotas /admin/* precisam vir ANTES das rotas /:thread_id/*,
// senao Express casa /admin/stream com /:thread_id/stream (thread_id=admin)
// e fura a autenticacao.

// Rotas admin
router.get('/admin/list', requireAdmin, feedbackController.listAllFeedbackAdmin);
router.post('/admin/reply', requireAdmin, feedbackController.adminReply);
router.post('/admin/typing', requireAdmin, feedbackController.signalAdminTyping);
router.get('/admin/stream', requireAdminQuery, feedbackController.streamAdmin);

// Rotas publicas (anonimizadas)
router.post('/', feedbackController.sendFeedback);
router.get('/:thread_id', feedbackController.getMessages);
router.post('/:thread_id/typing', feedbackController.signalUserTyping);
router.get('/:thread_id/stream', feedbackController.streamThread);

module.exports = router;
