const pool = require('../config/db');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('redis');
const crypto = require('crypto');
const ofx = require('node-ofx-parser');
const pdfParse = require('pdf-parse');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

(async () => {
    try {
        await redisClient.connect();
        console.log('Connected to Redis');
    } catch (err) {
        console.error('Failed to connect to Redis:', err);
    }
})();

// AI Advisor
exports.getAdvice = async (req, res) => {
    try {
        const groupFilter = [req.group.id];
        const [incomes, bills, random, investments] = await Promise.all([
            pool.query(`SELECT * FROM incomes WHERE group_id = $1`, groupFilter),
            pool.query(`SELECT * FROM bills WHERE group_id = $1`, groupFilter),
            pool.query(`SELECT * FROM random_expenses WHERE group_id = $1`, groupFilter),
            pool.query(`SELECT * FROM investments WHERE group_id = $1`, groupFilter)
        ]);
        const formatMoney = (val) => parseFloat(val).toFixed(2);

        const dataSummary = `
      DADOS FINANCEIROS DO USUÁRIO (Carteira Atual):

      1. RENDAS MENSAIS (Entradas):
      ${incomes.rows.map(i => `- ${i.description}: R$ ${formatMoney(i.value)}`).join('\n') || 'Nenhuma renda cadastrada.'}

      2. CONTAS FIXAS (Obrigações):
      ${bills.rows.map(b => `- ${b.name}: R$ ${formatMoney(b.value)} (Status: ${b.status}, Vencimento: ${b.due_date})`).join('\n') || 'Nenhuma conta cadastrada.'}

      3. GASTOS VARIÁVEIS/ALEATÓRIOS (Últimos 30 dias):
      ${random.rows.map(r => `- ${r.name}: R$ ${formatMoney(r.value)} em ${r.date}`).join('\n') || 'Nenhum gasto variável recente.'}

      4. INVESTIMENTOS ATUAIS:
      ${investments.rows.map(inv => `- ${inv.name}: R$ ${formatMoney(inv.initial_amount)} (${inv.cdi_percent}% do CDI)`).join('\n') || 'Nenhum investimento.'}
    `;

        // --- CACHE STRATEGY (Redis) ---
        const dataHash = crypto.createHash('md5').update(dataSummary).digest('hex');
        const cacheKey = `advisor:${req.group.id}:${dataHash}`;

        try {
            const cachedAdvice = await redisClient.get(cacheKey);
            if (cachedAdvice) {
                console.log(`⚡ Cache HIT for advisor: ${cacheKey}`);
                return res.json({ advice: JSON.parse(cachedAdvice) });
            }
        } catch (cacheErr) {
            console.error("Redis Read Error:", cacheErr);
        }

        console.log(`🐢 Cache MISS for advisor. Generating new with Gemini...`);

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash", // Use stable model
            generationConfig: { response_mime_type: "application/json" }
        });

        const prompt = `
      Atue como um consultor financeiro pessoal altamente qualificado. Analise os dados brutos abaixo e forneça um relatório estratégico em formato JSON.

      ${dataSummary}

      O JSON deve seguir EXATAMENTE esta estrutura:
      {
        "diagnostico": "Resumo curto da saúde financeira (Sobrando dinheiro? Endividado? Equilibrado?).",
        "pontos_atencao": ["Ponto 1", "Ponto 2", "Ponto 3"],
        "estrategia": [
          { "titulo": "Ação 1", "detalhe": "Descrição detalhada" },
          { "titulo": "Ação 2", "detalhe": "Descrição detalhada" },
          { "titulo": "Ação 3", "detalhe": "Descrição detalhada" }
        ],
        "recomendacao_investimentos": "Sugestão detalhada de onde alocar recursos."
      }

      Seja encorajador mas realista. Fale em português do Brasil.
    `;

        const result = await model.generateContent(prompt);
        const text = (await result.response).text();
        const parsedAdvice = JSON.parse(text);

        // Save to history
        await pool.query(
            'INSERT INTO ai_advisor_history (group_id, user_id, summary_input, advice_output) VALUES ($1, $2, $3, $4)',
            [req.group.id, req.user.id, dataSummary, JSON.stringify(parsedAdvice)]
        );

        // Save to Cache (24h)
        try {
            await redisClient.set(cacheKey, JSON.stringify(parsedAdvice), { EX: 86400 });
        } catch (cacheWriteErr) {
            console.error("Redis Write Error:", cacheWriteErr);
        }

        res.json({ advice: parsedAdvice });
    } catch (err) {
        console.error('Advisor error:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getAdvisorHistory = async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT id, generated_at, advice_output->>'diagnostico' as diagnostico_summary
       FROM ai_advisor_history
       WHERE group_id = $1
       ORDER BY generated_at DESC`,
            [req.group.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAdvisorHistoryDetail = async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT advice_output FROM ai_advisor_history WHERE id = $1 AND group_id = $2',
            [req.params.id, req.group.id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Histórico não encontrado' });
        res.json(rows[0].advice_output);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Import
exports.importOfxPdf = async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    try {
        const isPdf = req.file.mimetype === 'application/pdf' || req.file.originalname.endsWith('.pdf');
        let transactions = [];
        if (isPdf) {
            try {
                const data = await pdfParse(req.file.buffer);
                const textContent = data.text;

                const model = genAI.getGenerativeModel({
                    model: "gemini-2.0-flash",
                    generationConfig: { response_mime_type: "application/json" }
                });
                const prompt = `
          Atue como um parser de extratos bancários. Analise o texto bruto abaixo extraído de um PDF e identifique as transações individuais.
          Regras de Saída: APENAS um JSON Array válido.
          Formato: { "date": "YYYY-MM-DD", "description": "...", "amount": Number, "type": "DEBIT"|"CREDIT" }
          Texto: ${textContent.slice(0, 50000)}
        `;

                const result = await model.generateContent(prompt);
                let responseText = await result.response.text();
                responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
                const aiTransactions = JSON.parse(responseText);

                transactions = aiTransactions.map((tx, index) => {
                    const absAmount = Math.abs(parseFloat(tx.amount));
                    const finalAmount = tx.type === 'DEBIT' ? -absAmount : absAmount;
                    return {
                        id: `pdf-ai-${index}-${Date.now()}`,
                        date: tx.date,
                        amount: finalAmount,
                        description: tx.description,
                        type: tx.type,
                        category: tx.type === 'CREDIT' ? 'income' : 'expense',
                        selected: true
                    };
                });
            } catch (pdfErr) {
                console.error('PDF AI parsing error:', pdfErr);
                return res.status(500).json({ error: 'Erro ao processar PDF.' });
            }
        } else {
            const data = ofx.parse(req.file.buffer.toString('utf8'));
            const stmtTrn = data.OFX.BANKMSGSRSV1?.STMTTRNRS?.STMTRS?.BANKTRANLIST?.STMTTRN;
            if (stmtTrn) {
                const txList = Array.isArray(stmtTrn) ? stmtTrn : [stmtTrn];
                transactions = txList.map((tx, index) => ({ id: tx.FITID || index, date: tx.DTPOSTED, amount: parseFloat(tx.TRNAMT), description: tx.MEMO || tx.NAME, type: 'DEBIT', category: 'expense', selected: true }));
            }
        }
        res.json({ transactions });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.confirmImport = async (req, res) => {
    const { transactions } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const tx of transactions) {
            if (!tx.selected) continue;
            const amount = Math.abs(parseFloat(tx.amount));
            if (tx.category === 'income') await client.query('INSERT INTO incomes (description, value, date, group_id, user_id) VALUES ($1, $2, $3, $4, $5)', [tx.description, amount, tx.date, req.group.id, req.user.id]);
            else await client.query('INSERT INTO random_expenses (name, value, date, status, group_id, user_id) VALUES ($1, $2, $3, $4, $5, $6)', [tx.description, amount, tx.date, 'paid', req.group.id, req.user.id]);
        }
        await client.query('COMMIT');
        res.json({ success: true });
    } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ error: err.message }); }
    finally { client.release(); }
};
