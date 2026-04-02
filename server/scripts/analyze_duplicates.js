const { Pool } = require('pg');
require('dotenv').config({ path: '../../.env', override: true });

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: 'localhost', // Localhost for running outside docker
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
});

async function analyzeDuplicates() {
  const targetGroupId = '4d1e493c-4a4b-422f-8673-a26cf06814fe'; // Finanças de dyone.andrade
  const startDate = '2026-02-01';
  const endDate = '2026-02-28 23:59:59';

  try {
    console.log(`--- Analyzing Duplicates for Group ${targetGroupId} (${startDate} - ${endDate}) ---`);

    // 1. BILLS
    const billsQuery = `
      SELECT id, name, value, due_date, status 
      FROM bills 
      WHERE group_id = $1 AND due_date >= $2 AND due_date <= $3
      ORDER BY name, value
    `;
    const bills = await pool.query(billsQuery, [targetGroupId, startDate, endDate]);
    
    console.log('\n=== BILLS (Contas Fixas) ===');
    const billsMap = {};
    bills.rows.forEach(b => {
      const key = b.name.toLowerCase().trim();
      if (!billsMap[key]) billsMap[key] = [];
      billsMap[key].push(b);
    });

    let duplicateBillsFound = false;
    for (const [name, items] of Object.entries(billsMap)) {
      if (items.length > 1) {
        duplicateBillsFound = true;
        console.log(`\n⚠️  POTENTIAL DUPLICATE: "${name}" appears ${items.length} times:`);
        items.forEach(i => console.log(`   - ID: ${i.id} | Val: ${i.value} | Due: ${i.due_date.toISOString().split('T')[0]} | Status: ${i.status}`));
      } else {
         // console.log(`   OK: "${name}" - ${items[0].value}`);
      }
    }
    if (!duplicateBillsFound) console.log("✅ No duplicate Bill names found.");
    
    console.log(`\n   Total Bills Value: ${bills.rows.reduce((acc, curr) => acc + Number(curr.value), 0).toFixed(2)}`);


    // 2. RANDOM EXPENSES
    const randomQuery = `
      SELECT id, name, value, date 
      FROM random_expenses 
      WHERE group_id = $1 AND date >= $2 AND date <= $3
      ORDER BY name, value
    `;
    const random = await pool.query(randomQuery, [targetGroupId, startDate, endDate]);

    console.log('\n=== RANDOM EXPENSES (Gastos Variáveis) ===');
    const randomMap = {};
    random.rows.forEach(r => {
      const key = r.name.toLowerCase().trim();
      if (!randomMap[key]) randomMap[key] = [];
      randomMap[key].push(r);
    });

    let duplicateRandomFound = false;
    for (const [name, items] of Object.entries(randomMap)) {
      if (items.length > 1) {
        duplicateRandomFound = true;
        console.log(`\n⚠️  POTENTIAL DUPLICATE: "${name}" appears ${items.length} times:`);
        items.forEach(i => console.log(`   - ID: ${i.id} | Val: ${i.value} | Date: ${i.date.toISOString().split('T')[0]}`));
      }
    }
     if (!duplicateRandomFound) console.log("✅ No duplicate Random Expense names found.");

    console.log(`\n   Total Random Value: ${random.rows.reduce((acc, curr) => acc + Number(curr.value), 0).toFixed(2)}`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

analyzeDuplicates();
