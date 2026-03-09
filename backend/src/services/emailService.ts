import nodemailer from 'nodemailer';
import { env } from '../config/environment';
import logger from '../utils/logger';

// Configurar transporter de email
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST || 'smtp.gmail.com',
  port: env.SMTP_PORT || 587,
  secure: false, // true para 465, false para outros
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD,
  },
});

interface SendPasswordResetEmailParams {
  to: string;
  userName: string;
  resetToken: string;
}

/**
 * Enviar email de recuperação de senha
 */
export async function sendPasswordResetEmail({
  to,
  userName,
  resetToken,
}: SendPasswordResetEmailParams): Promise<void> {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"${env.APP_NAME || 'Sistema de Workflow'}" <${env.SMTP_USER}>`,
    to,
    subject: '🔐 Redefinição de Senha - Sistema de Workflow',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Redefinição de Senha</h1>
          </div>
          <div class="content">
            <p>Olá, <strong>${userName}</strong>!</p>
            
            <p>Recebemos uma solicitação para redefinir a senha da sua conta no Sistema de Workflow.</p>
            
            <p>Para criar uma nova senha, clique no botão abaixo:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Redefinir Minha Senha</a>
            </div>
            
            <p>Ou copie e cole o link abaixo no seu navegador:</p>
            <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px; font-size: 12px;">
              ${resetUrl}
            </p>
            
            <div class="warning">
              <strong>⚠️ Importante:</strong>
              <ul>
                <li>Este link expira em <strong>1 hora</strong></li>
                <li>Só pode ser usado <strong>uma vez</strong></li>
                <li>Se você não solicitou esta redefinição, ignore este email</li>
              </ul>
            </div>
            
            <p style="margin-top: 30px;">
              <strong>Questões de segurança?</strong><br>
              Se você não solicitou a redefinição de senha, sua conta pode estar em risco. 
              Entre em contato com o suporte imediatamente.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Sistema de Workflow - Todos os direitos reservados</p>
            <p>Este é um email automático, não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Olá, ${userName}!

Recebemos uma solicitação para redefinir a senha da sua conta no Sistema de Workflow.

Para criar uma nova senha, acesse o link abaixo:
${resetUrl}

⚠️ IMPORTANTE:
- Este link expira em 1 hora
- Só pode ser usado uma vez
- Se você não solicitou esta redefinição, ignore este email

Questões de segurança?
Se você não solicitou a redefinição de senha, sua conta pode estar em risco. 
Entre em contato com o suporte imediatamente.

---
© ${new Date().getFullYear()} Sistema de Workflow
Este é um email automático, não responda.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`📧 Email de reset enviado para: ${to}`);
  } catch (error) {
    logger.error('Erro ao enviar email de reset:', error);
    throw new Error('Falha ao enviar email de recuperação');
  }
}

/**
 * Verificar conexão do servidor de email
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    logger.info('✅ Conexão com servidor de email verificada');
    return true;
  } catch (error) {
    logger.error('❌ Erro na conexão com servidor de email:', error);
    return false;
  }
}
