/**
 * ============================================================================
 * Finance Controller — Adaptado para E2EE
 * ============================================================================
 *
 * Gerencia Incomes (Receitas), Investments (Investimentos) e
 * Random Expenses (Gastos Variáveis) com suporte a criptografia E2EE.
 *
 * MODELO DE DADOS E2EE:
 * - encrypted_data: blob criptografado em Base64 (name, description, value)
 * - encryption_iv: IV de 12 bytes em Base64 (único por registro)
 * - Metadados em texto plano: date, status, group_id (para filtros server-side)
 *
 * COMPATIBILIDADE LEGACY:
 * Registros sem encrypted_data são tratados normalmente (pré-E2EE).
 * O campo isEncrypted indica ao frontend se precisa descriptografar.
 *
 * VALIDAÇÃO DE PROPRIEDADE:
 * Endpoints de UPDATE verificam user_id do registro === user_id do JWT.
 */

const pool = require('../config/db');

const isValidAmount = (val) => !isNaN(parseFloat(val)) && isFinite(val) && parseFloat(val) > 0;
const isValidDate = (val) => !isNaN(Date.parse(val));

// ============================================================================
// INCOMES (Receitas)
// ============================================================================

exports.getIncomes = async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT id, user_id, group_id, description, value, date,
                    encrypted_data, encryption_iv, created_at
             FROM incomes WHERE group_id = $1 ORDER BY date DESC`,
            [req.group.id]
        );
        res.json(rows.map(r => ({
            id: r.id,
            userId: r.user_id,
            groupId: r.group_id,
            description: r.description,
            value: r.value ? parseFloat(r.value) : null,
            date: r.date ? r.date.toISOString() : null,
            encryptedData: r.encrypted_data,
            encryptionIv: r.encryption_iv,
            isEncrypted: !!r.encrypted_data,
        })));
    } catch (err) {
        console.error('Error fetching incomes:', err);
        res.status(500).json({ error: 'Erro ao buscar receitas' });
    }
};

exports.createIncome = async (req, res) => {
    const { description, value, date, encrypted_data, encryption_iv } = req.body;

    if (!date || !isValidDate(date)) return res.status(400).json({ error: 'Data inválida' });

    // Validação legacy (sem criptografia)
    if (!encrypted_data) {
        if (!description || !description.trim()) return res.status(400).json({ error: 'Descrição é obrigatória' });
        if (!isValidAmount(value)) return res.status(400).json({ error: 'Valor deve ser um número positivo' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO incomes (description, value, date, group_id, user_id, encrypted_data, encryption_iv)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [
                description ? description.trim() : null,
                value || null,
                date,
                req.group.id,
                req.user.id,
                encrypted_data || null,
                encryption_iv || null,
            ]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error creating income:', err);
        res.status(500).json({ error: 'Erro ao criar receita' });
    }
};

exports.deleteIncome = async (req, res) => {
    try {
        await pool.query('DELETE FROM incomes WHERE id = $1 AND group_id = $2', [req.params.id, req.group.id]);
        res.json({ message: 'Deleted' });
    } catch (err) {
        console.error('Error deleting income:', err);
        res.status(500).json({ error: 'Erro ao excluir receita' });
    }
};

/**
 * PUT /api/finance/incomes/:id
 *
 * Atualiza receita (migração E2EE ou edição).
 * Verifica propriedade estrita: user_id do registro === JWT user_id.
 */
exports.updateIncome = async (req, res) => {
    const { description, value, date, encrypted_data, encryption_iv } = req.body;

    try {
        const ownerCheck = await pool.query(
            'SELECT user_id FROM incomes WHERE id = $1 AND group_id = $2',
            [req.params.id, req.group.id]
        );
        if (ownerCheck.rows.length === 0) return res.status(404).json({ error: 'Receita não encontrada' });
        if (ownerCheck.rows[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'Acesso negado: você não é o proprietário deste registro' });
        }

        const result = await pool.query(
            `UPDATE incomes SET
                description = COALESCE($1, description),
                value = COALESCE($2, value),
                date = COALESCE($3, date),
                encrypted_data = $4,
                encryption_iv = $5
             WHERE id = $6 AND group_id = $7 RETURNING *`,
            [
                description || null, value || null, date || null,
                encrypted_data || null, encryption_iv || null,
                req.params.id, req.group.id,
            ]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating income:', err);
        res.status(500).json({ error: 'Erro ao atualizar receita' });
    }
};

// ============================================================================
// INVESTMENTS (Investimentos)
// ============================================================================

exports.getInvestments = async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT id, user_id, group_id, name, initial_amount, cdi_percent,
                    start_date, duration_months, encrypted_data, encryption_iv, created_at
             FROM investments WHERE group_id = $1 ORDER BY created_at DESC`,
            [req.group.id]
        );
        res.json(rows.map(r => ({
            id: r.id,
            userId: r.user_id,
            groupId: r.group_id,
            name: r.name,
            initialAmount: r.initial_amount ? parseFloat(r.initial_amount) : null,
            cdiPercent: r.cdi_percent,
            startDate: r.start_date ? r.start_date.toISOString() : null,
            durationMonths: r.duration_months,
            encryptedData: r.encrypted_data,
            encryptionIv: r.encryption_iv,
            isEncrypted: !!r.encrypted_data,
        })));
    } catch (err) {
        console.error('Error fetching investments:', err);
        res.status(500).json({ error: 'Erro ao buscar investimentos' });
    }
};

exports.createInvestment = async (req, res) => {
    const { name, initialAmount, cdiPercent, startDate, durationMonths, encrypted_data, encryption_iv } = req.body;

    // Metadados obrigatórios (sempre em texto plano para cálculos)
    if (!startDate || !isValidDate(startDate)) return res.status(400).json({ error: 'Data de início inválida' });
    if (!durationMonths || durationMonths < 1) return res.status(400).json({ error: 'Duração deve ser de pelo menos 1 mês' });

    // Validação legacy
    if (!encrypted_data) {
        if (!name || !name.trim()) return res.status(400).json({ error: 'Nome é obrigatório' });
        if (!isValidAmount(initialAmount)) return res.status(400).json({ error: 'Valor inicial deve ser um número positivo' });
        if (cdiPercent == null || isNaN(cdiPercent) || cdiPercent < 0) return res.status(400).json({ error: 'Percentual do CDI inválido' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO investments (name, initial_amount, cdi_percent, start_date, duration_months, group_id, user_id, encrypted_data, encryption_iv)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [
                name ? name.trim() : null,
                initialAmount || null,
                cdiPercent != null ? cdiPercent : null,
                startDate,
                durationMonths,
                req.group.id,
                req.user.id,
                encrypted_data || null,
                encryption_iv || null,
            ]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error creating investment:', err);
        res.status(500).json({ error: 'Erro ao criar investimento' });
    }
};

exports.deleteInvestment = async (req, res) => {
    try {
        await pool.query('DELETE FROM investments WHERE id = $1 AND group_id = $2', [req.params.id, req.group.id]);
        res.json({ message: 'Deleted' });
    } catch (err) {
        console.error('Error deleting investment:', err);
        res.status(500).json({ error: 'Erro ao excluir investimento' });
    }
};

exports.updateInvestment = async (req, res) => {
    const { name, initialAmount, cdiPercent, startDate, durationMonths, encrypted_data, encryption_iv } = req.body;

    try {
        const ownerCheck = await pool.query(
            'SELECT user_id FROM investments WHERE id = $1 AND group_id = $2',
            [req.params.id, req.group.id]
        );
        if (ownerCheck.rows.length === 0) return res.status(404).json({ error: 'Investimento não encontrado' });
        if (ownerCheck.rows[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'Acesso negado: você não é o proprietário deste registro' });
        }

        const result = await pool.query(
            `UPDATE investments SET
                name = COALESCE($1, name),
                initial_amount = COALESCE($2, initial_amount),
                cdi_percent = COALESCE($3, cdi_percent),
                start_date = COALESCE($4, start_date),
                duration_months = COALESCE($5, duration_months),
                encrypted_data = $6,
                encryption_iv = $7
             WHERE id = $8 AND group_id = $9 RETURNING *`,
            [
                name || null, initialAmount || null, cdiPercent != null ? cdiPercent : null,
                startDate || null, durationMonths || null,
                encrypted_data || null, encryption_iv || null,
                req.params.id, req.group.id,
            ]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating investment:', err);
        res.status(500).json({ error: 'Erro ao atualizar investimento' });
    }
};

// ============================================================================
// RANDOM EXPENSES (Gastos Variáveis)
// ============================================================================

exports.getRandomExpenses = async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT id, user_id, group_id, name, value, date, status, paid_date,
                    encrypted_data, encryption_iv, created_at
             FROM random_expenses WHERE group_id = $1 ORDER BY date DESC`,
            [req.group.id]
        );
        res.json(rows.map(r => ({
            id: r.id,
            userId: r.user_id,
            groupId: r.group_id,
            name: r.name,
            value: r.value ? parseFloat(r.value) : null,
            date: r.date ? r.date.toISOString() : null,
            status: r.status,
            paidDate: r.paid_date ? r.paid_date.toISOString() : null,
            encryptedData: r.encrypted_data,
            encryptionIv: r.encryption_iv,
            isEncrypted: !!r.encrypted_data,
        })));
    } catch (err) {
        console.error('Error fetching random expenses:', err);
        res.status(500).json({ error: 'Erro ao buscar gastos variáveis' });
    }
};

exports.createRandomExpense = async (req, res) => {
    const { name, value, date, status, encrypted_data, encryption_iv } = req.body;

    if (!date || !isValidDate(date)) return res.status(400).json({ error: 'Data inválida' });

    if (!encrypted_data) {
        if (!name || !name.trim()) return res.status(400).json({ error: 'Nome é obrigatório' });
        if (!isValidAmount(value)) return res.status(400).json({ error: 'Valor deve ser um número positivo' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO random_expenses (name, value, date, status, group_id, user_id, encrypted_data, encryption_iv)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [
                name ? name.trim() : null,
                value || null,
                date,
                status || 'paid',
                req.group.id,
                req.user.id,
                encrypted_data || null,
                encryption_iv || null,
            ]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error creating random expense:', err);
        res.status(500).json({ error: 'Erro ao criar gasto variável' });
    }
};

exports.deleteRandomExpense = async (req, res) => {
    try {
        await pool.query('DELETE FROM random_expenses WHERE id = $1 AND group_id = $2', [req.params.id, req.group.id]);
        res.json({ message: 'Deleted' });
    } catch (err) {
        console.error('Error deleting random expense:', err);
        res.status(500).json({ error: 'Erro ao excluir gasto variável' });
    }
};

exports.payRandomExpense = async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE random_expenses SET status = 'paid', paid_date = NOW()
             WHERE id = $1 AND group_id = $2 RETURNING *`,
            [req.params.id, req.group.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Gasto não encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error paying random expense:', err);
        res.status(500).json({ error: 'Erro ao marcar gasto como pago' });
    }
};

exports.updateRandomExpense = async (req, res) => {
    const { name, value, date, status, encrypted_data, encryption_iv } = req.body;

    try {
        const ownerCheck = await pool.query(
            'SELECT user_id FROM random_expenses WHERE id = $1 AND group_id = $2',
            [req.params.id, req.group.id]
        );
        if (ownerCheck.rows.length === 0) return res.status(404).json({ error: 'Gasto não encontrado' });
        if (ownerCheck.rows[0].user_id !== req.user.id) {
            return res.status(403).json({ error: 'Acesso negado: você não é o proprietário deste registro' });
        }

        const result = await pool.query(
            `UPDATE random_expenses SET
                name = COALESCE($1, name),
                value = COALESCE($2, value),
                date = COALESCE($3, date),
                status = COALESCE($4, status),
                encrypted_data = $5,
                encryption_iv = $6
             WHERE id = $7 AND group_id = $8 RETURNING *`,
            [
                name || null, value || null, date || null,
                status || null, encrypted_data || null, encryption_iv || null,
                req.params.id, req.group.id,
            ]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating random expense:', err);
        res.status(500).json({ error: 'Erro ao atualizar gasto variável' });
    }
};
