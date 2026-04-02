/**
 * ============================================================================
 * Encryption Routes — Rotas de Gerenciamento de Chaves E2EE
 * ============================================================================
 *
 * Todas as rotas requerem autenticação JWT (authenticateToken).
 * NÃO requerem acesso a grupo (requireGroupAccess) porque as chaves
 * de criptografia são POR USUÁRIO, não por grupo.
 */

const express = require('express');
const router = express.Router();
const encryptionController = require('../controllers/encryptionController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// GET /api/encryption/keys — Busca salt + wrapped MEK do usuário autenticado
router.get('/keys', encryptionController.getKeys);

// POST /api/encryption/setup — Salva chaves pela primeira vez (primeiro login pós-E2EE)
router.post('/setup', encryptionController.setup);

// PUT /api/encryption/keys — Atualiza chaves (troca de senha)
router.put('/keys', encryptionController.updateKeys);

module.exports = router;
