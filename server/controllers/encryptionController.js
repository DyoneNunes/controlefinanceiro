/**
 * ============================================================================
 * Encryption Controller — Gerenciamento de Chaves E2EE
 * ============================================================================
 *
 * Endpoints para gerenciar as chaves de criptografia do lado do servidor.
 *
 * PRINCÍPIO ZERO-KNOWLEDGE:
 * Este controlador armazena e retorna chaves encapsuladas (wrapped).
 * O servidor NUNCA vê a MEK em texto plano. Ele apenas armazena:
 * - salt: valor aleatório para derivação PBKDF2 (não é segredo)
 * - wrapped_mek: MEK criptografada com a DEK do usuário (opaco)
 * - mek_iv: IV usado para encapsular a MEK (necessário para unwrap)
 *
 * O servidor não tem capacidade de descriptografar nenhum dado do usuário.
 */

const pool = require('../config/db');

/**
 * GET /api/encryption/keys
 * 
 * Retorna as chaves de criptografia encapsuladas do usuário autenticado.
 * 
 * Resposta 200: { salt, wrapped_mek, mek_iv }
 * Resposta 404: Usuário não tem chaves configuradas (primeiro login)
 * 
 * SEGURANÇA:
 * - Requer JWT válido (authenticateToken middleware)
 * - Retorna apenas as chaves do user_id extraído do JWT
 * - Impossível acessar chaves de outro usuário
 */
exports.getKeys = async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT salt, wrapped_mek, mek_iv FROM user_encryption_keys WHERE user_id = $1',
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Chaves de criptografia não encontradas' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error('Erro ao buscar chaves de criptografia:', err);
        res.status(500).json({ error: 'Erro interno ao buscar chaves' });
    }
};

/**
 * POST /api/encryption/setup
 * 
 * Salva as chaves de criptografia do usuário pela primeira vez.
 * Chamado durante o primeiro login após a migração para E2EE.
 * 
 * Body: { salt, wrapped_mek, mek_iv }
 * 
 * SEGURANÇA:
 * - O salt e wrapped_mek são gerados no CLIENTE
 * - O servidor não valida o conteúdo (são blobs opacos)
 * - Vincula obrigatoriamente ao user_id do JWT
 * - Retorna 409 se chaves já existem (previne sobrescrita acidental)
 */
exports.setup = async (req, res) => {
    const { salt, wrapped_mek, mek_iv } = req.body;

    // Validação de presença (não de conteúdo — são blobs opacos)
    if (!salt || !wrapped_mek || !mek_iv) {
        return res.status(400).json({ error: 'salt, wrapped_mek e mek_iv são obrigatórios' });
    }

    try {
        // Verifica se já existem chaves (previne sobrescrita)
        const existing = await pool.query(
            'SELECT user_id FROM user_encryption_keys WHERE user_id = $1',
            [req.user.id]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Chaves de criptografia já configuradas. Use PUT para atualizar.' });
        }

        await pool.query(
            `INSERT INTO user_encryption_keys (user_id, salt, wrapped_mek, mek_iv)
             VALUES ($1, $2, $3, $4)`,
            [req.user.id, salt, wrapped_mek, mek_iv]
        );

        res.status(201).json({ success: true, message: 'Chaves de criptografia configuradas' });
    } catch (err) {
        console.error('Erro ao configurar chaves de criptografia:', err);
        res.status(500).json({ error: 'Erro interno ao configurar chaves' });
    }
};

/**
 * PUT /api/encryption/keys
 * 
 * Atualiza as chaves encapsuladas (usado na troca de senha).
 * 
 * FLUXO NA TROCA DE SENHA:
 * 1. Cliente desencapsula MEK com DEK antiga
 * 2. Cliente gera novo salt + nova DEK com nova senha
 * 3. Cliente re-encapsula MESMA MEK com nova DEK
 * 4. Cliente envia novo salt + nova wrapped MEK via este endpoint
 * 
 * Resultado: a mesma MEK é usada para todos os dados,
 * mas agora protegida pela nova senha.
 * 
 * Body: { salt, wrapped_mek, mek_iv }
 * 
 * SEGURANÇA:
 * - Apenas o próprio usuário pode atualizar suas chaves (via JWT)
 * - O servidor não valida se a MEK subjacente é a mesma (não consegue)
 */
exports.updateKeys = async (req, res) => {
    const { salt, wrapped_mek, mek_iv } = req.body;

    if (!salt || !wrapped_mek || !mek_iv) {
        return res.status(400).json({ error: 'salt, wrapped_mek e mek_iv são obrigatórios' });
    }

    try {
        const result = await pool.query(
            `UPDATE user_encryption_keys
             SET salt = $1, wrapped_mek = $2, mek_iv = $3, updated_at = NOW()
             WHERE user_id = $4
             RETURNING user_id`,
            [salt, wrapped_mek, mek_iv, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Chaves de criptografia não encontradas' });
        }

        res.json({ success: true, message: 'Chaves de criptografia atualizadas' });
    } catch (err) {
        console.error('Erro ao atualizar chaves de criptografia:', err);
        res.status(500).json({ error: 'Erro interno ao atualizar chaves' });
    }
};
