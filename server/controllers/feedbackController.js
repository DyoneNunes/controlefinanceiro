const pool = require('../config/db');
const bus = require('../services/feedbackBus');

exports.sendFeedback = async (req, res) => {
    const { thread_id, ciphertext, iv } = req.body;
    if (!thread_id || !ciphertext || !iv) {
        return res.status(400).json({ error: 'Dados da mensagem incompletos' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO feedback_messages (thread_id, ciphertext, iv, sender) VALUES ($1, $2, $3, $4) RETURNING *',
            [thread_id, ciphertext, iv, 'user']
        );
        bus.publish({ ...result.rows[0], kind: 'message' });
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getMessages = async (req, res) => {
    const { thread_id } = req.params;
    try {
        const { rows } = await pool.query(
            'SELECT * FROM feedback_messages WHERE thread_id = $1 ORDER BY created_at ASC',
            [thread_id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.listAllFeedbackAdmin = async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM feedback_messages ORDER BY created_at ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.adminReply = async (req, res) => {
    const { thread_id, ciphertext, iv } = req.body;
    if (!thread_id || !ciphertext || !iv) {
        return res.status(400).json({ error: 'Dados da resposta incompletos' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO feedback_messages (thread_id, ciphertext, iv, sender) VALUES ($1, $2, $3, $4) RETURNING *',
            [thread_id, ciphertext, iv, 'admin']
        );
        bus.publish({ ...result.rows[0], kind: 'message' });
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Typing notifications — fire-and-forget, no DB write.
// Anonymous user notifies for their own thread; admin notifies for any thread.
exports.signalUserTyping = (req, res) => {
    const { thread_id } = req.params;
    if (!thread_id) return res.sendStatus(400);
    bus.publish({ kind: 'typing', thread_id, sender: 'user', at: Date.now() });
    res.sendStatus(204);
};

exports.signalAdminTyping = (req, res) => {
    const { thread_id } = req.body || {};
    if (!thread_id) return res.status(400).json({ error: 'thread_id requerido' });
    bus.publish({ kind: 'typing', thread_id, sender: 'admin', at: Date.now() });
    res.sendStatus(204);
};

// ─────────────────────────────────────────────────────────────────
// SSE streams
// ─────────────────────────────────────────────────────────────────

function openSseStream(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
    });
    res.write('retry: 3000\n\n');

    const heartbeat = setInterval(() => res.write(': keepalive\n\n'), 25000);
    const cleanup = () => clearInterval(heartbeat);
    req.on('close', cleanup);
    return cleanup;
}

exports.streamThread = (req, res) => {
    const { thread_id } = req.params;
    openSseStream(req, res);
    const unsubscribe = bus.subscribe(thread_id, (msg) => {
        res.write(`data: ${JSON.stringify(msg)}\n\n`);
    });
    req.on('close', unsubscribe);
};

exports.streamAdmin = (req, res) => {
    openSseStream(req, res);
    const unsubscribe = bus.subscribe('*', (msg) => {
        res.write(`data: ${JSON.stringify(msg)}\n\n`);
    });
    req.on('close', unsubscribe);
};
