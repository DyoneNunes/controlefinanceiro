const cron = require('node-cron');
const pool = require('../config/db');
const emailService = require('./emailService');

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// ─── Lembrete diário de contas próximas do vencimento ────────────────────────
// Roda todos os dias às 08:00 (horário do servidor)
// Busca contas pendentes/atrasadas com vencimento nos próximos 3 dias

async function checkBillsDue() {
  console.log('[CRON] Verificando contas próximas do vencimento...');
  try {
    // Busca todos os usuários que têm e-mail
    const usersRes = await pool.query(`
      SELECT DISTINCT u.id, u.username, u.email
      FROM users u
      WHERE u.email IS NOT NULL AND u.email != ''
    `);

    for (const user of usersRes.rows) {
      // Busca contas pendentes/atrasadas que vencem em até 3 dias (ou já venceram nos últimos 3 dias)
      const billsRes = await pool.query(`
        SELECT b.name, b.value, b.due_date, b.status
        FROM bills b
        JOIN group_members gm ON gm.group_id = b.group_id AND gm.user_id = $1
        WHERE b.deleted_at IS NULL
          AND b.status IN ('pending', 'overdue')
          AND b.due_date BETWEEN CURRENT_DATE - INTERVAL '3 days' AND CURRENT_DATE + INTERVAL '3 days'
        ORDER BY b.due_date ASC
      `, [user.id]);

      if (billsRes.rows.length > 0) {
        try {
          // Nome descriptografado pode não estar disponível, usa campo name (que pode ter encrypted_data)
          // Manda com campo name mesmo (será o nome criptografado ou plaintext dependendo do registro)
          await emailService.sendBillDueReminder(user.email, user.username, billsRes.rows);
          console.log(`[CRON] Lembrete enviado para ${user.username} (${billsRes.rows.length} contas)`);
        } catch (emailErr) {
          console.error(`[CRON] Erro ao enviar lembrete para ${user.username}:`, emailErr.message);
        }
      }
    }
    console.log('[CRON] Verificação de contas concluída.');
  } catch (err) {
    console.error('[CRON] Erro ao verificar contas:', err.message);
  }
}

// ─── Resumo financeiro mensal ────────────────────────────────────────────────
// Roda no dia 1 de cada mês às 09:00
// Envia resumo do mês anterior para todos os usuários com e-mail

async function sendMonthlySummaries() {
  console.log('[CRON] Gerando resumos financeiros mensais...');
  try {
    // Mês anterior
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const monthName = MONTH_NAMES[prevMonth.getMonth()];
    const yearStr = prevMonth.getFullYear();

    const startDate = prevMonth.toISOString().split('T')[0];
    const endDate = prevMonthEnd.toISOString().split('T')[0];

    const usersRes = await pool.query(`
      SELECT DISTINCT u.id, u.username, u.email
      FROM users u
      WHERE u.email IS NOT NULL AND u.email != ''
    `);

    for (const user of usersRes.rows) {
      try {
        // Contas do mês
        const billsRes = await pool.query(`
          SELECT
            COUNT(*)::int AS bill_count,
            COALESCE(SUM(value), 0) AS total_bills,
            COALESCE(SUM(CASE WHEN status = 'paid' THEN value ELSE 0 END), 0) AS total_paid,
            COALESCE(SUM(CASE WHEN status = 'pending' THEN value ELSE 0 END), 0) AS total_pending,
            COALESCE(SUM(CASE WHEN status = 'overdue' THEN value ELSE 0 END), 0) AS total_overdue
          FROM bills b
          JOIN group_members gm ON gm.group_id = b.group_id AND gm.user_id = $1
          WHERE b.deleted_at IS NULL
            AND b.due_date BETWEEN $2 AND $3
        `, [user.id, startDate, endDate]);

        // Entradas do mês
        const incomesRes = await pool.query(`
          SELECT COUNT(*)::int AS income_count, COALESCE(SUM(value), 0) AS total_incomes
          FROM incomes i
          JOIN group_members gm ON gm.group_id = i.group_id AND gm.user_id = $1
          WHERE i.deleted_at IS NULL
            AND i.date BETWEEN $2 AND $3
        `, [user.id, startDate, endDate]);

        // Gastos variáveis do mês
        const expensesRes = await pool.query(`
          SELECT COUNT(*)::int AS expense_count, COALESCE(SUM(value), 0) AS total_expenses
          FROM random_expenses re
          JOIN group_members gm ON gm.group_id = re.group_id AND gm.user_id = $1
          WHERE re.deleted_at IS NULL
            AND re.date BETWEEN $2 AND $3
        `, [user.id, startDate, endDate]);

        const bills = billsRes.rows[0];
        const incomes = incomesRes.rows[0];
        const expenses = expensesRes.rows[0];

        // Só envia se o usuário teve alguma movimentação
        if (bills.bill_count > 0 || incomes.income_count > 0 || expenses.expense_count > 0) {
          await emailService.sendMonthlySummary(user.email, user.username, {
            monthName: `${monthName} ${yearStr}`,
            totalBills: bills.total_bills,
            totalPaid: bills.total_paid,
            totalPending: bills.total_pending,
            totalOverdue: bills.total_overdue,
            totalIncomes: incomes.total_incomes,
            totalExpenses: expenses.total_expenses,
            billCount: bills.bill_count,
            incomeCount: incomes.income_count,
            expenseCount: expenses.expense_count,
          });
          console.log(`[CRON] Resumo mensal enviado para ${user.username}`);
        }
      } catch (emailErr) {
        console.error(`[CRON] Erro no resumo de ${user.username}:`, emailErr.message);
      }
    }
    console.log('[CRON] Resumos mensais concluídos.');
  } catch (err) {
    console.error('[CRON] Erro ao gerar resumos:', err.message);
  }
}

// ─── Registrar cron jobs ─────────────────────────────────────────────────────

function initScheduler() {
  // Lembrete de contas: todo dia às 08:00
  cron.schedule('0 8 * * *', checkBillsDue, {
    timezone: 'America/Sao_Paulo'
  });
  console.log('[CRON] Agendado: Lembrete de contas (diário 08:00 BRT)');

  // Resumo mensal: dia 1 de cada mês às 09:00
  cron.schedule('0 9 1 * *', sendMonthlySummaries, {
    timezone: 'America/Sao_Paulo'
  });
  console.log('[CRON] Agendado: Resumo mensal (dia 1, 09:00 BRT)');
}

module.exports = { initScheduler, checkBillsDue, sendMonthlySummaries };
