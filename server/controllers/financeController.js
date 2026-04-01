const pool = require('../config/db');

const isValidAmount = (val) => !isNaN(parseFloat(val)) && isFinite(val) && parseFloat(val) > 0;
const isValidDate = (val) => !isNaN(Date.parse(val));

// Incomes
exports.getIncomes = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM incomes WHERE group_id = $1 ORDER BY date DESC', [req.group.id]);
        res.json(rows.map(r => ({ ...r, date: r.date.toISOString() })));
    } catch (err) {
        console.error('Error fetching incomes:', err);
        res.status(500).json({ error: 'Erro ao buscar receitas' });
    }
};

exports.createIncome = async (req, res) => {
    const { description, value, date } = req.body;
    if (!description || !description.trim()) return res.status(400).json({ error: 'Descrição é obrigatória' });
    if (!isValidAmount(value)) return res.status(400).json({ error: 'Valor deve ser um número positivo' });
    if (!date || !isValidDate(date)) return res.status(400).json({ error: 'Data inválida' });

    try {
        const result = await pool.query('INSERT INTO incomes (description, value, date, group_id, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *', [description.trim(), value, date, req.group.id, req.user.id]);
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

// Investments
exports.getInvestments = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM investments WHERE group_id = $1 ORDER BY created_at DESC', [req.group.id]);
        res.json(rows.map(r => ({ ...r, initialAmount: parseFloat(r.initial_amount), cdiPercent: r.cdi_percent, startDate: r.start_date.toISOString(), durationMonths: r.duration_months })));
    } catch (err) {
        console.error('Error fetching investments:', err);
        res.status(500).json({ error: 'Erro ao buscar investimentos' });
    }
};

exports.createInvestment = async (req, res) => {
    const { name, initialAmount, cdiPercent, startDate, durationMonths } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Nome é obrigatório' });
    if (!isValidAmount(initialAmount)) return res.status(400).json({ error: 'Valor inicial deve ser um número positivo' });
    if (cdiPercent == null || isNaN(cdiPercent) || cdiPercent < 0) return res.status(400).json({ error: 'Percentual do CDI inválido' });
    if (!startDate || !isValidDate(startDate)) return res.status(400).json({ error: 'Data de início inválida' });
    if (!durationMonths || durationMonths < 1) return res.status(400).json({ error: 'Duração deve ser de pelo menos 1 mês' });

    try {
        const result = await pool.query('INSERT INTO investments (name, initial_amount, cdi_percent, start_date, duration_months, group_id, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [name.trim(), initialAmount, cdiPercent, startDate, durationMonths, req.group.id, req.user.id]);
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

// Random Expenses
exports.getRandomExpenses = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM random_expenses WHERE group_id = $1 ORDER BY date DESC', [req.group.id]);
        res.json(rows.map(r => ({ ...r, date: r.date.toISOString(), paidDate: r.paid_date ? r.paid_date.toISOString() : null })));
    } catch (err) {
        console.error('Error fetching random expenses:', err);
        res.status(500).json({ error: 'Erro ao buscar gastos variáveis' });
    }
};

exports.createRandomExpense = async (req, res) => {
    const { name, value, date, status } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Nome é obrigatório' });
    if (!isValidAmount(value)) return res.status(400).json({ error: 'Valor deve ser um número positivo' });
    if (!date || !isValidDate(date)) return res.status(400).json({ error: 'Data inválida' });

    try {
        const result = await pool.query('INSERT INTO random_expenses (name, value, date, status, group_id, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [name.trim(), value, date, status || 'paid', req.group.id, req.user.id]);
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
        const result = await pool.query(`UPDATE random_expenses SET status = 'paid', paid_date = NOW() WHERE id = $1 AND group_id = $2 RETURNING *`, [req.params.id, req.group.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Gasto não encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error paying random expense:', err);
        res.status(500).json({ error: 'Erro ao marcar gasto como pago' });
    }
};
