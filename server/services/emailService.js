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
