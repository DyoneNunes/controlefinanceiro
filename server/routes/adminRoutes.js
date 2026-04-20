const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const jwt = require('jsonwebtoken');

const requireAdmin = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
        if (err || payload?.role !== 'admin') return res.sendStatus(403);
        next();
    });
};

router.post('/login', adminController.adminLogin);
router.get('/users', requireAdmin, adminController.listUsers);
router.post('/users', requireAdmin, adminController.createUser);
router.put('/users/:id', requireAdmin, adminController.updateUser);
router.put('/users/:id/password', requireAdmin, adminController.resetPassword);
router.post('/users/:id/send-reset', requireAdmin, adminController.sendPasswordReset);
router.delete('/users/:id', requireAdmin, adminController.deleteUser);

// Notificações
router.post('/notifications', requireAdmin, adminController.createNotification);
router.get('/notifications', requireAdmin, adminController.listNotificationsAdmin);
router.delete('/notifications/:id', requireAdmin, adminController.deleteNotification);

// E-mail triggers
router.post('/email/bill-reminder', requireAdmin, async (req, res) => {
  try {
    const { checkBillsDue } = require('../services/schedulerService');
    await checkBillsDue();
    res.json({ success: true, message: 'Lembrete de contas verificado e enviado.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/email/monthly-summary', requireAdmin, async (req, res) => {
  try {
    const { sendMonthlySummaries } = require('../services/schedulerService');
    await sendMonthlySummaries();
    res.json({ success: true, message: 'Resumo mensal verificado e enviado.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
