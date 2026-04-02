const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, requireGroupAccess } = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/validate', authenticateToken, authController.validate);
router.post('/reset-password', authController.resetPassword);
router.get('/groups', authenticateToken, authController.getGroups);
router.post('/groups', authenticateToken, authController.createGroup);

// Group Management (Requires Admin role in group, enforced by requireGroupAccess)
router.post('/groups/:id/invite', authenticateToken, requireGroupAccess, authController.inviteUser);
router.put('/groups/:id', authenticateToken, requireGroupAccess, authController.updateGroup);
router.delete('/groups/:id', authenticateToken, requireGroupAccess, authController.deleteGroup);

// User Management (admin panel)
router.get('/users', authenticateToken, authController.listUsers);
router.post('/users', authenticateToken, authController.adminCreateUser);
router.put('/users/:id/password', authenticateToken, authController.adminResetPassword);
router.delete('/users/:id', authenticateToken, authController.adminDeleteUser);

module.exports = router;
