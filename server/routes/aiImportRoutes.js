const express = require('express');
const router = express.Router();
const aiImportController = require('../controllers/aiImportController');
const { authenticateToken, requireGroupAccess } = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// AI Advisor (with auth)
router.post('/advisor', authenticateToken, requireGroupAccess, aiImportController.getAdvice);
router.get('/advisor/history', authenticateToken, requireGroupAccess, aiImportController.getAdvisorHistory);
router.get('/advisor/history/:id', authenticateToken, requireGroupAccess, aiImportController.getAdvisorHistoryDetail);

// Import (with auth)
router.post('/import/ofx', authenticateToken, requireGroupAccess, upload.single('file'), aiImportController.importOfxPdf);
router.post('/import/confirm', authenticateToken, requireGroupAccess, aiImportController.confirmImport);

module.exports = router;
