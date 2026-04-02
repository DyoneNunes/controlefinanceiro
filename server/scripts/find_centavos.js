const { Pool } = require('pg');
require('dotenv').config({ path: '../../.env', override: true });

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: 'localhost',
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
});

async function findTheCentavos() {
  const targetGroupId = '4d1e493c-4a4b-422f-8673-a26cf06814fe';
  const startDate = '2026-02-01';
  const endDate = '2026-02-28 23:59:59';

  try {
    console.log(`--- Precise Analysis for Group ${targetGroupId} ---`);

    // 1. Incomes
    const incRes = await pool.query(`SELECT value FROM incomes WHERE group_id = $1 AND date >= $2 AND date <= $3`, [targetGroupId, startDate, endDate]);
    const incomeTotal = incRes.rows.reduce((sum, r) => sum + Number(r.value), 0);

    // 2. Random Expenses
    const randRes = await pool.query(`SELECT value FROM random_expenses WHERE group_id = $1 AND date >= $2 AND date <= $3`, [targetGroupId, startDate, endDate]);
    const randomTotal = randRes.rows.reduce((sum, r) => sum + Number(r.value), 0);

    // 3. Paid Bills (ANY bill with status 'paid' where paid_date is in Feb)
    const paidBillsRes = await pool.query(`
      SELECT name, value, due_date, paid_date 
      FROM bills 
      WHERE group_id = $1 
      AND status = 'paid' 
      AND (
        (paid_date >= $2 AND paid_date <= $3) 
        OR 
        (paid_date IS NULL AND due_date >= $2 AND due_date <= $3)
      )
    `, [targetGroupId, startDate, endDate]);
    
    const paidBillsTotal = paidBillsRes.rows.reduce((sum, r) => sum + Number(r.value), 0);

    console.log(`
Total Incomes: R$ ${incomeTotal.toFixed(2)}`);
    console.log(`Total Random Expenses: R$ ${randomTotal.toFixed(2)}`);
    console.log(`Total Paid Bills: R$ ${paidBillsTotal.toFixed(2)}`);
    
    const balance = incomeTotal - (paidBillsTotal + randomTotal);
    console.log(`
--- CALCULATED BALANCE (CASH BASIS) ---`);
    console.log(`R$ ${balance.toFixed(2)}`);

    console.log(`
Detailed Paid Bills:`);
    paidBillsRes.rows.forEach(b => {
        const isFromOtherMonth = b.due_date.getMonth() !== 1; // Not Feb (0-indexed, Jan=0, Feb=1)
        console.log(`- ${b.name}: R$ ${b.value} (Due: ${b.due_date.toISOString().split('T')[0]}) ${isFromOtherMonth ? '⚠️ FROM OTHER MONTH' : ''}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

findTheCentavos();
