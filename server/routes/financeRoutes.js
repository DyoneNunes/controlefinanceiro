const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const { authenticateToken, requireGroupAccess } = require('../middleware/authMiddleware');

router.use(authenticateToken);
router.use(requireGroupAccess);

// Incomes
router.get('/incomes', financeController.getIncomes);
router.post('/incomes', financeController.createIncome);
router.delete('/incomes/:id', financeController.deleteIncome);

// Investments
router.get('/investments', financeController.getInvestments);
router.post('/investments', financeController.createInvestment);
router.delete('/investments/:id', financeController.deleteInvestment);

// Random Expenses
router.get('/random-expenses', financeController.getRandomExpenses);
router.post('/random-expenses', financeController.createRandomExpense);
router.delete('/random-expenses/:id', financeController.deleteRandomExpense);
router.patch('/random-expenses/:id/pay', financeController.payRandomExpense);

module.exports = router;
