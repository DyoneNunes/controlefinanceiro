const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

exports.adminLogin = async (req, res) => {
    let { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Usuário e senha obrigatórios' });

    username = username.trim().toLowerCase();
    password = password.trim();

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE LOWER(username) = $1 AND is_admin = TRUE',
            [username]
        );
        if (result.rows.length === 0) return res.status(401).json({ error: 'Credenciais inválidas' });

        const user = result.rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ error: 'Credenciais inválidas' });

        const token = jwt.sign({ id: user.id, username: user.username, role: 'admin' }, JWT_SECRET, { expiresIn: '4h' });
        res.json({ token });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.listUsers = async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT u.id, u.username, u.email, u.created_at,
                (SELECT COUNT(*) FROM group_members gm WHERE gm.user_id = u.id) AS group_count
             FROM users u ORDER BY u.created_at ASC`
        );
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createUser = async (req, res) => {
    let { username, password, email } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    username = username.trim().toLowerCase();
    password = password.trim();
    email = email ? email.trim().toLowerCase() : null;
    if (password.length < 4) return res.status(400).json({ error: 'Senha deve ter pelo menos 4 caracteres' });
    try {
        const check = await pool.query('SELECT id FROM users WHERE LOWER(username) = $1', [username]);
        if (check.rows.length > 0) return res.status(400).json({ error: 'Usuário já existe' });
        const hash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, password_hash, email) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
            [username, hash, email]
        );
        const newUser = result.rows[0];

        // Enviar email de boas-vindas com link de redefinição de senha (se tiver email)
        if (email) {
            try {
                const crypto = require('crypto');
                const emailService = require('../services/emailService');
                const token = crypto.randomBytes(32).toString('hex');
                const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
                await pool.query(
                    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
                    [newUser.id, token, expiresAt]
                );
                const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;
                await emailService.sendWelcomeEmail(email, username, resetUrl);
            } catch (emailErr) {
                console.error('Erro ao enviar email de boas-vindas:', emailErr.message);
                // Não falha a criação se o email não for enviado
            }
        }

        res.status(201).json({ ...newUser, group_count: 0 });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    let { username, email } = req.body;
    if (!username) return res.status(400).json({ error: 'Nome de usuário obrigatório' });
    username = username.trim().toLowerCase();
    email = email ? email.trim().toLowerCase() : null;
    try {
        const conflict = await pool.query('SELECT id FROM users WHERE LOWER(username) = $1 AND id != $2', [username, id]);
        if (conflict.rows.length > 0) return res.status(400).json({ error: 'Nome de usuário já existe' });
        const result = await pool.query(
            'UPDATE users SET username = $1, email = $2 WHERE id = $3 RETURNING id, username, email',
            [username, email, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.sendPasswordReset = async (req, res) => {
    const { id } = req.params;
    const crypto = require('crypto');
    const emailService = require('../services/emailService');

    try {
        const userRes = await pool.query('SELECT id, username, email FROM users WHERE id = $1', [id]);
        if (userRes.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
        const user = userRes.rows[0];
        if (!user.email) return res.status(400).json({ error: 'Usuário não possui e-mail cadastrado' });

        // Invalidar tokens anteriores
        await pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE user_id = $1 AND used = FALSE', [id]);

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 horas

        await pool.query(
            'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
            [id, token, expiresAt]
        );

        const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;
        await emailService.sendPasswordResetEmail(user.email, user.username, resetUrl);

        res.json({ success: true, message: `Link enviado para ${user.email}` });
    } catch (err) {
        console.error('Erro ao enviar email:', err);
        res.status(500).json({ error: 'Erro ao enviar e-mail: ' + err.message });
    }
};

exports.resetPassword = async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    if (!password || password.trim().length < 4) return res.status(400).json({ error: 'Senha deve ter pelo menos 4 caracteres' });
    try {
        const hash = await bcrypt.hash(password.trim(), 10);
        const result = await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id', [hash, id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// --- Notificações ---
exports.createNotification = async (req, res) => {
    const { title, content, type } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Título e conteúdo são obrigatórios' });
    try {
        const result = await pool.query(
            'INSERT INTO global_notifications (title, content, type) VALUES ($1, $2, $3) RETURNING *',
            [title.trim(), content.trim(), type || 'info']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.listNotificationsAdmin = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM global_notifications ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteNotification = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM global_notifications WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Notificação não encontrada' });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};
