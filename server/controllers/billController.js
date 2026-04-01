const pool = require('../config/db');

const isValidAmount = (val) => !isNaN(parseFloat(val)) && isFinite(val) && parseFloat(val) > 0;
const isValidDate = (val) => !isNaN(Date.parse(val));

exports.getBills = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM bills WHERE group_id = $1 ORDER BY due_date ASC', [req.group.id]);
        res.json(rows.map(r => ({ ...r, dueDate: r.due_date.toISOString(), paidDate: r.paid_date ? r.paid_date.toISOString() : null })));
    } catch (err) {
        console.error('Error fetching bills:', err);
        res.status(500).json({ error: 'Erro ao buscar contas' });
    }
};

exports.createBill = async (req, res) => {
    const { name, value, dueDate, status } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Nome é obrigatório' });
    if (!isValidAmount(value)) return res.status(400).json({ error: 'Valor deve ser um número positivo' });
    if (!dueDate || !isValidDate(dueDate)) return res.status(400).json({ error: 'Data de vencimento inválida' });

    try {
        const result = await pool.query('INSERT INTO bills (name, value, due_date, status, group_id, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [name.trim(), value, dueDate, status || 'pending', req.group.id, req.user.id]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error creating bill:', err);
        res.status(500).json({ error: 'Erro ao criar conta' });
    }
};

exports.deleteBill = async (req, res) => {
    try {
        await pool.query('DELETE FROM bills WHERE id = $1 AND group_id = $2', [req.params.id, req.group.id]);
        res.json({ message: 'Deleted' });
    } catch (err) {
        console.error('Error deleting bill:', err);
        res.status(500).json({ error: 'Erro ao excluir conta' });
    }
};

exports.payBill = async (req, res) => {
    try {
        const result = await pool.query(`UPDATE bills SET status = 'paid', paid_date = NOW() WHERE id = $1 AND group_id = $2 RETURNING *`, [req.params.id, req.group.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Conta não encontrada' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error paying bill:', err);
        res.status(500).json({ error: 'Erro ao marcar conta como paga' });
    }
};
