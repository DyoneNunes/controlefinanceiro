/**
 * Seed: Cria o usuário administrador e seu grupo pessoal.
 * 
 * Uso:
 *   node server/scripts/seed_admin.js
 * 
 * As credenciais são lidas do .env (APP_USER_DYONE / APP_PASS_DYONE).
 */
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: 'localhost',
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT || 5432,
});

async function seed() {
  const username = process.env.APP_USER_DYONE;
  const password = process.env.APP_PASS_DYONE;

  if (!username || !password) {
    console.error('❌ APP_USER_DYONE e APP_PASS_DYONE devem estar definidos no .env');
    process.exit(1);
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    // Criar ou atualizar usuário admin
    const userRes = await pool.query(
      `INSERT INTO users (username, password_hash, is_admin)
       VALUES ($1, $2, TRUE)
       ON CONFLICT (username) DO UPDATE SET password_hash = $2, is_admin = TRUE
       RETURNING id, username, is_admin`,
      [username, hash]
    );
    const user = userRes.rows[0];
    console.log(`✅ Admin criado: ${user.username} (ID: ${user.id})`);

    // Verificar se já possui grupo
    const existingGroup = await pool.query(
      'SELECT g.id, g.name FROM finance_groups g JOIN group_members gm ON g.id = gm.group_id WHERE gm.user_id = $1 LIMIT 1',
      [user.id]
    );

    if (existingGroup.rows.length > 0) {
      console.log(`ℹ️  Grupo já existe: "${existingGroup.rows[0].name}" (ID: ${existingGroup.rows[0].id})`);
    } else {
      const groupRes = await pool.query(
        `INSERT INTO finance_groups (name) VALUES ($1) RETURNING id`,
        ['Finanças de Dyone']
      );
      const groupId = groupRes.rows[0].id;

      await pool.query(
        `INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, 'admin') ON CONFLICT DO NOTHING`,
        [groupId, user.id]
      );
      console.log(`✅ Grupo criado: "Finanças de Dyone" (ID: ${groupId})`);
    }

    console.log('\n🎉 Seed concluído com sucesso!');
  } catch (err) {
    console.error('❌ Erro no seed:', err.message);
  } finally {
    await pool.end();
  }
}

seed();
