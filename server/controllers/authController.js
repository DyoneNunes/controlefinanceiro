const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

exports.register = async (req, res) => {
    let { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });

    username = username.trim().toLowerCase();
    password = password.trim();

    try {
        const checkUser = await pool.query('SELECT id FROM users WHERE LOWER(username) = $1', [username]);
        if (checkUser.rows.length > 0) return res.status(400).json({ error: 'Usuário já existe' });

        const hash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id',
            [username, hash]
        );

        res.status(201).json({ success: true, message: 'Usuário criado com sucesso' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
};

exports.login = async (req, res) => {
    let { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });

    username = username.trim().toLowerCase();
    password = password.trim();

    try {
        const result = await pool.query('SELECT * FROM users WHERE LOWER(username) = $1', [username]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Credenciais inválidas' });
        const user = result.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) return res.status(401).json({ error: 'Credenciais inválidas' });
        const token = jwt.sign({ username: user.username, id: user.id }, JWT_SECRET, { expiresIn: '8h' });

        // --- AUTO-CREATE DEFAULT GROUP IF NONE EXISTS ---
        const groupCheck = await pool.query('SELECT group_id FROM group_members WHERE user_id = $1 LIMIT 1', [user.id]);
        if (groupCheck.rows.length === 0) {
            console.log(`Auto-creating default group for user ${user.username}`);
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                const groupRes = await client.query('INSERT INTO finance_groups (name) VALUES ($1) RETURNING id', ['Minha Carteira']);
                const newGroupId = groupRes.rows[0].id;
                await client.query('INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)', [newGroupId, user.id, 'admin']);
                await client.query('COMMIT');
            } catch (e) {
                await client.query('ROLLBACK');
                console.error('Failed to auto-create group:', e);
            } finally {
                client.release();
            }
        }

        res.json({ username: user.username, token: token, success: true });
    } catch (err) {
        res.status(500).json({ error: 'Erro interno' });
    }
};

exports.validate = (req, res) => {
    res.json({ valid: true, username: req.user.username });
};

exports.resetPassword = async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password || password.trim().length < 4)
        return res.status(400).json({ error: 'Token e senha são obrigatórios (mínimo 4 caracteres)' });

    const client = await pool.connect();
    try {
        const tokenRes = await client.query(
            'SELECT * FROM password_reset_tokens WHERE token = $1 AND used = FALSE AND expires_at > NOW()',
            [token]
        );
        if (tokenRes.rows.length === 0)
            return res.status(400).json({ error: 'Link inválido ou expirado.' });

        const { user_id } = tokenRes.rows[0];
        const hash = await bcrypt.hash(password.trim(), 10);

        await client.query('BEGIN');
        await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, user_id]);
        await client.query('UPDATE password_reset_tokens SET used = TRUE WHERE token = $1', [token]);
        await client.query('COMMIT');

        res.json({ success: true });
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error('Erro ao redefinir senha:', err);
        res.status(500).json({ error: 'Erro ao redefinir senha. Tente novamente.' });
    } finally {
        client.release();
    }
};

exports.getGroups = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT g.id, g.name, gm.role FROM finance_groups g JOIN group_members gm ON g.id = gm.group_id WHERE gm.user_id = $1 ORDER BY gm.joined_at ASC', [req.user.id]);
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createGroup = async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    // Verify user still exists in database
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [req.user.id]);
    if (userCheck.rows.length === 0) return res.status(401).json({ error: 'Sessão inválida. Faça login novamente.' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const groupRes = await client.query('INSERT INTO finance_groups (name) VALUES ($1) RETURNING id, name', [name]);
        const newGroupId = groupRes.rows[0].id;
        await client.query('INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)', [newGroupId, req.user.id, 'admin']);
        await client.query('COMMIT');
        res.json({ id: newGroupId, name: groupRes.rows[0].name, role: 'admin' });
    } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ error: err.message }); }
    finally { client.release(); }
};

exports.inviteUser = async (req, res) => {
    const { username } = req.body;
    const { id: groupId } = req.group;
    if (!username) return res.status(400).json({ error: 'Username required' });

    try {
        // Find user by username
        const userRes = await pool.query('SELECT id FROM users WHERE LOWER(username) = $1', [username.toLowerCase().trim()]);
        if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
        const targetUserId = userRes.rows[0].id;

        // Add to group
        await pool.query(
            'INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT (group_id, user_id) DO NOTHING',
            [groupId, targetUserId, 'editor']
        );
        res.json({ success: true, message: `User ${username} invited.` });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateGroup = async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome do grupo é obrigatório' });
    if (req.group.role !== 'admin') return res.status(403).json({ error: 'Apenas administradores podem editar o grupo' });

    try {
        await pool.query('UPDATE finance_groups SET name = $1 WHERE id = $2', [name, req.group.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Error updating group:', err);
        res.status(500).json({ error: 'Erro ao atualizar grupo' });
    }
};

// ---- USER MANAGEMENT (admin only) ----

exports.listUsers = async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT u.id, u.username, u.created_at,
                (SELECT COUNT(*) FROM group_members gm WHERE gm.user_id = u.id) AS group_count
             FROM users u ORDER BY u.created_at ASC`
        );
        res.json(rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.adminCreateUser = async (req, res) => {
    let { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    username = username.trim().toLowerCase();
    password = password.trim();
    if (password.length < 4) return res.status(400).json({ error: 'Senha deve ter pelo menos 4 caracteres' });
    try {
        const check = await pool.query('SELECT id FROM users WHERE LOWER(username) = $1', [username]);
        if (check.rows.length > 0) return res.status(400).json({ error: 'Usuário já existe' });
        const hash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at',
            [username, hash]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.adminResetPassword = async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    if (!password || password.trim().length < 4) return res.status(400).json({ error: 'Senha deve ter pelo menos 4 caracteres' });
    try {
        const hash = await bcrypt.hash(password.trim(), 10);
        const result = await pool.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id',
            [hash, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.adminDeleteUser = async (req, res) => {
    const { id } = req.params;
    // Prevent self-deletion
    if (id === req.user.id) return res.status(400).json({ error: 'Você não pode excluir seu próprio usuário' });
    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteGroup = async (req, res) => {
    if (req.group.role !== 'admin') return res.status(403).json({ error: 'Apenas administradores podem excluir o grupo' });

    try {
        await pool.query('DELETE FROM finance_groups WHERE id = $1', [req.group.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting group:', err);
        res.status(500).json({ error: 'Erro ao excluir grupo' });
    }
};
