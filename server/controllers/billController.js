/**
 * ============================================================================
 * Bill Controller — Adaptado para E2EE
 * ============================================================================
 *
 * MODELO DE DADOS E2EE:
 * Os dados sensíveis (name, value) são armazenados criptografados no campo
 * 'encrypted_data'. O IV está no campo 'encryption_iv'.
 *
 * Metadados operacionais (due_date, status, group_id) são mantidos em
 * texto plano para permitir ordenação e filtragem no servidor.
 *
 * COMPATIBILIDADE COM DADOS LEGACY:
 * Registros sem encrypted_data são tratados como dados pré-E2EE.
 * O frontend detecta esses registros e pode migrá-los.
 *
 * VALIDAÇÃO DE PROPRIEDADE:
 * O acesso é controlado por group_id (via requireGroupAccess middleware).
 * Adicionalmente, endpoints individuais verificam owner_id === req.user.id.
 */

const pool = require('../config/db');

const isValidDate = (val) => !isNaN(Date.parse(val));

/**
 * GET /api/bills
 *
 * Retorna todas as contas do grupo autenticado.
 * Os campos encrypted_data e encryption_iv são retornados para que o
 * frontend possa descriptografar no navegador.
 *
 * Registros com encrypted_data são E2EE.
 * Registros sem encrypted_data são legacy (texto plano).
 */
exports.getBills = async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT id, user_id, group_id, name, value, due_date, status, paid_date,
                    encrypted_data, encryption_iv, created_at
             FROM bills WHERE group_id = $1 ORDER BY due_date ASC`,
            [req.group.id]
        );

        res.json(rows.map(r => ({
            id: r.id,
            userId: r.user_id,
            groupId: r.group_id,
            // Dados em texto plano (legacy) — campos mantidos para compatibilidade
            name: r.name,
            value: r.value ? parseFloat(r.value) : null,
            dueDate: r.due_date ? r.due_date.toISOString() : null,
            status: r.status,
            paidDate: r.paid_date ? r.paid_date.toISOString() : null,
            // Dados criptografados (E2EE)
            encryptedData: r.encrypted_data,
            encryptionIv: r.encryption_iv,
            // Flag para o frontend saber se precisa descriptografar
            isEncrypted: !!r.encrypted_data,
        })));
    } catch (err) {
        console.error('Error fetching bills:', err);
        res.status(500).json({ error: 'Erro ao buscar contas' });
    }
};

/**
 * POST /api/bills
 *
 * Cria uma nova conta com dados criptografados.
 *
 * Body esperado (E2EE):
 * {
 *   encrypted_data: "base64...",  // Dados sensíveis criptografados (name, value)
 *   encryption_iv: "base64...",   // IV da criptografia
 *   dueDate: "2026-01-15",       // Metadado em texto plano (para filtragem)
 *   status: "pending",           // Metadado em texto plano
 *   value: 150.00                // Valor em texto plano (para cálculos server-side)
 * }
 *
 * Body esperado (Legacy/Compatibilidade):
 * { name, value, dueDate, status }
 */
exports.createBill = async (req, res) => {
    const { name, value, dueDate, status, encrypted_data, encryption_iv } = req.body;

    // Validação: dueDate é obrigatório (metadado operacional)
    if (!dueDate || !isValidDate(dueDate)) {
        return res.status(400).json({ error: 'Data de vencimento inválida' });
    }

    // Se não tem dados criptografados, valida os campos em texto plano (modo legacy)
    if (!encrypted_data) {
        if (!name || !name.trim()) return res.status(400).json({ error: 'Nome é obrigatório' });
        const isValidAmount = (val) => !isNaN(parseFloat(val)) && isFinite(val) && parseFloat(val) > 0;
        if (!isValidAmount(value)) return res.status(400).json({ error: 'Valor deve ser um número positivo' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO bills (name, value, due_date, status, group_id, user_id, encrypted_data, encryption_iv)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [
                name ? name.trim() : null,
                value || null,
                dueDate,
                status || 'pending',
                req.group.id,
                req.user.id,
                encrypted_data || null,
                encryption_iv || null,
            ]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error creating bill:', err);
        res.status(500).json({ error: 'Erro ao criar conta' });
    }
};

/**
 * DELETE /api/bills/:id
 *
 * Exclui uma conta. Verifica ownership via group_id.
 */
exports.deleteBill = async (req, res) => {
    try {
        await pool.query('DELETE FROM bills WHERE id = $1 AND group_id = $2', [req.params.id, req.group.id]);
        res.json({ message: 'Deleted' });
    } catch (err) {
        console.error('Error deleting bill:', err);
        res.status(500).json({ error: 'Erro ao excluir conta' });
    }
};

/**
 * PATCH /api/bills/:id/pay
 *
 * Marca uma conta como paga. Operação sobre metadado (status),
 * portanto funciona sem necessidade de descriptografar.
 */
exports.payBill = async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE bills SET status = 'paid', paid_date = NOW()
             WHERE id = $1 AND group_id = $2 RETURNING *`,
            [req.params.id, req.group.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Conta não encontrada' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error paying bill:', err);
        res.status(500).json({ error: 'Erro ao marcar conta como paga' });
    }
};

/**
 * PUT /api/bills/:id
 *
 * Atualiza uma conta com dados criptografados (migração de dados legacy).
 * Usado pelo frontend para migrar registros pré-E2EE.
 *
 * VALIDAÇÃO DE PROPRIEDADE:
 * Verifica que o user_id do registro === user_id do JWT.
 * Se não, retorna HTTP 403 Forbidden.
 */
exports.updateBill = async (req, res) => {
    const { encrypted_data, encryption_iv, name, value, dueDate, status } = req.body;

    try {
        // Verificação de propriedade estrita (Zero-Knowledge ownership)
        const ownerCheck = await pool.query(
            'SELECT user_id FROM bills WHERE id = $1 AND group_id = $2',
            [req.params.id, req.group.id]
        );
        if (ownerCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Conta não encontrada' });
        }
        if (ownerCheck.rows[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'Acesso negado: você não é o proprietário deste registro' });
        }

        const result = await pool.query(
            `UPDATE bills SET
                name = COALESCE($1, name),
                value = COALESCE($2, value),
                due_date = COALESCE($3, due_date),
                status = COALESCE($4, status),
                encrypted_data = $5,
                encryption_iv = $6
             WHERE id = $7 AND group_id = $8 RETURNING *`,
            [
                name || null, value || null, dueDate || null,
                status || null, encrypted_data || null, encryption_iv || null,
                req.params.id, req.group.id,
            ]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating bill:', err);
        res.status(500).json({ error: 'Erro ao atualizar conta' });
    }
};
