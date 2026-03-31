const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const requireGroupAccess = async (req, res, next) => {
    const groupId = req.headers['x-group-id'];
    if (!groupId) return res.status(400).json({ error: 'X-Group-ID header is required' });

    const isValidUUID = (id) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
    if (!isValidUUID(groupId)) return res.status(400).json({ error: 'Invalid Group ID format' });

    try {
        const result = await pool.query('SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, req.user.id]);
        if (result.rows.length === 0) return res.status(403).json({ error: 'Access denied' });
        req.group = { id: groupId, role: result.rows[0].role };
        next();
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { authenticateToken, requireGroupAccess };
