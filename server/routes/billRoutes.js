const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');
const { authenticateToken, requireGroupAccess } = require('../middleware/authMiddleware');

router.use(authenticateToken);
router.use(requireGroupAccess);

router.get('/', billController.getBills);
router.post('/', billController.createBill);
router.delete('/:id', billController.deleteBill);
router.patch('/:id/pay', billController.payBill);

module.exports = router;
