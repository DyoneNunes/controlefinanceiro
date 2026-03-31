const pool = require('../config/db');

// Incomes
exports.getIncomes = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM incomes WHERE group_id = $1 ORDER BY date DESC', [req.group.id]);
        res.json(rows.map(r => ({ ...r, date: r.date.toISOString() })));
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createIncome = async (req, res) => {
    const { description, value, date } = req.body;
    try {
        const result = await pool.query('INSERT INTO incomes (description, value, date, group_id, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *', [description, value, date, req.group.id, req.user.id]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteIncome = async (req, res) => {
    try {
        await pool.query('DELETE FROM incomes WHERE id = $1 AND group_id = $2', [req.params.id, req.group.id]);
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// Investments
exports.getInvestments = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM investments WHERE group_id = $1 ORDER BY created_at DESC', [req.group.id]);
        res.json(rows.map(r => ({ ...r, initialAmount: parseFloat(r.initial_amount), cdiPercent: r.cdi_percent, startDate: r.start_date.toISOString(), durationMonths: r.duration_months })));
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createInvestment = async (req, res) => {
    const { name, initialAmount, cdiPercent, startDate, durationMonths } = req.body;
    try {
        const result = await pool.query('INSERT INTO investments (name, initial_amount, cdi_percent, start_date, duration_months, group_id, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [name, initialAmount, cdiPercent, startDate, durationMonths, req.group.id, req.user.id]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteInvestment = async (req, res) => {
    try {
        await pool.query('DELETE FROM investments WHERE id = $1 AND group_id = $2', [req.params.id, req.group.id]);
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// Random Expenses
exports.getRandomExpenses = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM random_expenses WHERE group_id = $1 ORDER BY date DESC', [req.group.id]);
        res.json(rows.map(r => ({ ...r, date: r.date.toISOString(), paidDate: r.paid_date ? r.paid_date.toISOString() : null })));
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createRandomExpense = async (req, res) => {
    const { name, value, date, status } = req.body;
    try {
        const result = await pool.query('INSERT INTO random_expenses (name, value, date, status, group_id, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [name, value, date, status || 'paid', req.group.id, req.user.id]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteRandomExpense = async (req, res) => {
    try {
        await pool.query('DELETE FROM random_expenses WHERE id = $1 AND group_id = $2', [req.params.id, req.group.id]);
        res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.payRandomExpense = async (req, res) => {
    try {
        const result = await pool.query(`UPDATE random_expenses SET status = 'paid', paid_date = NOW() WHERE id = $1 AND group_id = $2 RETURNING *`, [req.params.id, req.group.id]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
};
