const express = require('express');
const router = express.Router();
const aiImportController = require('../controllers/aiImportController');
const { authenticateToken, requireGroupAccess } = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticateToken);
router.use(requireGroupAccess);

// AI Advisor
router.post('/advisor', aiImportController.getAdvice);
router.get('/advisor/history', aiImportController.getAdvisorHistory);
router.get('/advisor/history/:id', aiImportController.getAdvisorHistoryDetail);

// Import
router.post('/import/ofx', upload.single('file'), aiImportController.importOfxPdf);
router.post('/import/confirm', aiImportController.confirmImport);

module.exports = router;
