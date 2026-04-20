const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const logoUrl = `${process.env.APP_URL}/public/logo.svg`;
const year = new Date().getFullYear();

const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1d4ed8,#4f46e5);padding:32px 40px;text-align:center;">
            <img src="${logoUrl}" alt="MeuDin" height="52" style="max-height:52px;object-fit:contain;" />
          </td>
        </tr>

        <!-- Content -->
        <tr><td style="padding:40px;">
          ${content}
        </td></tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">
              MeuDin &copy; ${year} &nbsp;·&nbsp; Este é um e-mail automático, não responda.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

exports.sendWelcomeEmail = async (to, username, resetUrl) => {
  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;color:#1e293b;">Bem-vindo ao MeuDin! 🎉</h1>
    <p style="margin:0 0 24px;color:#64748b;font-size:15px;">
      Olá, <strong style="color:#1e293b;">${username}</strong>! Sua conta foi criada pelo administrador do sistema.
    </p>

    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 6px;color:#0369a1;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Suas credenciais de acesso</p>
      <p style="margin:0;color:#0c4a6e;font-size:15px;">
        <strong>Usuário:</strong> ${username}<br>
        <strong>Senha:</strong> Defina sua senha pelo link abaixo
      </p>
    </div>

    <p style="color:#64748b;font-size:14px;margin-bottom:24px;">
      Para acessar o sistema, clique no botão abaixo e defina sua senha. O link expira em <strong>2 horas</strong>.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <a href="${resetUrl}"
           style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#1d4ed8,#4f46e5);color:#ffffff;font-size:15px;font-weight:700;border-radius:10px;text-decoration:none;letter-spacing:0.3px;">
          Definir minha senha →
        </a>
      </td></tr>
    </table>

    <p style="margin-top:28px;color:#94a3b8;font-size:12px;text-align:center;">
      Se você não esperava este e-mail, entre em contato com o administrador.
    </p>`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'MeuDin <noreply@meudim.com>',
    to,
    subject: `Bem-vindo ao MeuDin, ${username}!`,
    html: baseTemplate(content),
  });
};

exports.sendPasswordResetEmail = async (to, username, resetUrl) => {
  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;color:#1e293b;">Redefinição de senha</h1>
    <p style="margin:0 0 20px;color:#64748b;font-size:15px;">
      Olá, <strong style="color:#1e293b;">${username}</strong>. Um administrador solicitou a redefinição da sua senha no MeuDin.
    </p>
    <p style="color:#64748b;font-size:14px;margin-bottom:24px;">
      Clique no botão abaixo para criar uma nova senha. O link expira em <strong>2 horas</strong>.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <a href="${resetUrl}"
           style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#1d4ed8,#4f46e5);color:#ffffff;font-size:15px;font-weight:700;border-radius:10px;text-decoration:none;letter-spacing:0.3px;">
          Redefinir minha senha →
        </a>
      </td></tr>
    </table>

    <p style="margin-top:28px;color:#94a3b8;font-size:12px;text-align:center;">
      Se você não solicitou isso, ignore este e-mail. Sua senha não será alterada.
    </p>`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'MeuDin <noreply@meudin.com>',
    to,
    subject: 'MeuDin — Redefinição de senha',
    html: baseTemplate(content),
  });
};

// ─── Lembrete de contas próximas do vencimento ───────────────────────────────

exports.sendBillDueReminder = async (to, username, bills) => {
  const rows = bills.map(b => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;color:#1e293b;font-size:14px;">${b.name}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;color:#1e293b;font-size:14px;text-align:right;white-space:nowrap;">R$ ${Number(b.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;color:#1e293b;font-size:14px;text-align:center;white-space:nowrap;">${new Date(b.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:center;">
        <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;
          ${b.status === 'overdue' ? 'background:#fef2f2;color:#dc2626;' : 'background:#fffbeb;color:#d97706;'}">
          ${b.status === 'overdue' ? 'Atrasado' : 'Pendente'}
        </span>
      </td>
    </tr>`).join('');

  const totalValue = bills.reduce((sum, b) => sum + Number(b.value), 0);

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;color:#1e293b;">⏰ Contas próximas do vencimento</h1>
    <p style="margin:0 0 20px;color:#64748b;font-size:15px;">
      Olá, <strong style="color:#1e293b;">${username}</strong>! Você tem <strong style="color:#dc2626;">${bills.length} conta${bills.length > 1 ? 's' : ''}</strong> pendente${bills.length > 1 ? 's' : ''} nos próximos dias.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:20px;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="padding:10px 14px;text-align:left;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e2e8f0;">Descrição</th>
          <th style="padding:10px 14px;text-align:right;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e2e8f0;">Valor</th>
          <th style="padding:10px 14px;text-align:center;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e2e8f0;">Vencimento</th>
          <th style="padding:10px 14px;text-align:center;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e2e8f0;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
      <tfoot>
        <tr style="background:#f8fafc;">
          <td style="padding:12px 14px;font-weight:700;color:#1e293b;font-size:14px;">Total</td>
          <td style="padding:12px 14px;font-weight:700;color:#1e293b;font-size:14px;text-align:right;" colspan="3">
            R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </td>
        </tr>
      </tfoot>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <a href="${process.env.APP_URL}/bills"
           style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#1d4ed8,#4f46e5);color:#ffffff;font-size:15px;font-weight:700;border-radius:10px;text-decoration:none;">
          Ver minhas contas →
        </a>
      </td></tr>
    </table>

    <p style="margin-top:28px;color:#94a3b8;font-size:12px;text-align:center;">
      Pague suas contas em dia para manter suas finanças em ordem.
    </p>`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'MeuDin <noreply@meudin.com>',
    to,
    subject: `MeuDin — ${bills.length} conta${bills.length > 1 ? 's' : ''} próxima${bills.length > 1 ? 's' : ''} do vencimento`,
    html: baseTemplate(content),
  });
};

// ─── Resumo financeiro mensal ────────────────────────────────────────────────

exports.sendMonthlySummary = async (to, username, summary) => {
  const { monthName, totalBills, totalPaid, totalPending, totalOverdue, totalIncomes, totalExpenses, billCount, incomeCount, expenseCount } = summary;

  const statCard = (icon, label, value, color) => `
    <td width="33%" style="padding:8px;">
      <div style="background:${color}10;border:1px solid ${color}30;border-radius:12px;padding:16px;text-align:center;">
        <div style="font-size:22px;margin-bottom:4px;">${icon}</div>
        <div style="font-size:20px;font-weight:800;color:${color};">R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        <div style="font-size:11px;color:#64748b;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">${label}</div>
      </div>
    </td>`;

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;color:#1e293b;">📊 Resumo Financeiro</h1>
    <p style="margin:0 0 4px;color:#64748b;font-size:15px;">
      Olá, <strong style="color:#1e293b;">${username}</strong>! Aqui está o resumo do mês de <strong style="color:#1d4ed8;">${monthName}</strong>.
    </p>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:13px;">Os valores abaixo consideram todas as suas carteiras.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        ${statCard('💰', `Entradas (${incomeCount})`, totalIncomes, '#059669')}
        ${statCard('📋', `Contas (${billCount})`, totalBills, '#1d4ed8')}
        ${statCard('🛒', `Gastos (${expenseCount})`, totalExpenses, '#dc2626')}
      </tr>
    </table>

    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 10px;color:#0369a1;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Status de Pagamentos</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:4px 0;color:#64748b;font-size:14px;">✅ Já pago</td>
          <td style="padding:4px 0;color:#059669;font-size:14px;font-weight:700;text-align:right;">R$ ${Number(totalPaid).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#64748b;font-size:14px;">⏳ Pendente</td>
          <td style="padding:4px 0;color:#d97706;font-size:14px;font-weight:700;text-align:right;">R$ ${Number(totalPending).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#64748b;font-size:14px;">🚨 Atrasado</td>
          <td style="padding:4px 0;color:#dc2626;font-size:14px;font-weight:700;text-align:right;">R$ ${Number(totalOverdue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        </tr>
      </table>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <a href="${process.env.APP_URL}/dashboard"
           style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#1d4ed8,#4f46e5);color:#ffffff;font-size:15px;font-weight:700;border-radius:10px;text-decoration:none;">
          Ver meu dashboard →
        </a>
      </td></tr>
    </table>

    <p style="margin-top:28px;color:#94a3b8;font-size:12px;text-align:center;">
      Continue acompanhando suas finanças pelo MeuDin.
    </p>`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'MeuDin <noreply@meudin.com>',
    to,
    subject: `MeuDin — Resumo financeiro de ${monthName}`,
    html: baseTemplate(content),
  });
};
