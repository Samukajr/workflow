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

interface SendSecondApprovalEmailParams {
  to: string;
  approverName: string;
  requestNumber: string;
  amount: number;
  supplierName: string;
  firstApproverName: string;
  paymentRequestId: string;
  comments?: string;
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

/**
 * Enviar email para segunda aprovação em fluxo de dupla aprovação
 */
export async function sendSecondApprovalEmail({
  to,
  approverName,
  requestNumber,
  amount,
  supplierName,
  firstApproverName,
  paymentRequestId,
  comments,
}: SendSecondApprovalEmailParams): Promise<void> {
  const paymentDetailsUrl = `${env.FRONTEND_URL}/payments/${paymentRequestId}`;
  const formattedAmount = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);

  const safeComments = comments?.trim() || 'Sem observações adicionais.';

  const mailOptions = {
    from: `"${env.APP_NAME || 'Sistema de Workflow'}" <${env.SMTP_USER}>`,
    to,
    subject: `Ação necessária: 2ª aprovação pendente (${requestNumber})`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; }
          .container { max-width: 640px; margin: 0 auto; padding: 20px; }
          .header { background: #0f766e; color: #ffffff; padding: 24px; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 24px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none; }
          .card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0; }
          .button { display: inline-block; padding: 12px 20px; background: #0f766e; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; }
          .hint { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px; margin-top: 18px; }
          .footer { margin-top: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">2ª aprovação pendente</h2>
          </div>
          <div class="content">
            <p>Olá, <strong>${approverName}</strong>.</p>
            <p>A requisição <strong>${requestNumber}</strong> recebeu a 1ª aprovação e aguarda sua análise final.</p>

            <div class="card">
              <p style="margin: 4px 0;"><strong>Fornecedor:</strong> ${supplierName}</p>
              <p style="margin: 4px 0;"><strong>Valor:</strong> ${formattedAmount}</p>
              <p style="margin: 4px 0;"><strong>1º aprovador:</strong> ${firstApproverName}</p>
              <p style="margin: 4px 0;"><strong>Comentário:</strong> ${safeComments}</p>
            </div>

            <p>
              <a href="${paymentDetailsUrl}" class="button">Abrir solicitação</a>
            </p>

            <div class="hint">
              <strong>Lembrete:</strong> a segunda aprovação deve ser realizada por um validador diferente do primeiro.
            </div>

            <div class="footer">
              <p>Este é um email automático. Não responda esta mensagem.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Olá, ${approverName}.

A requisição ${requestNumber} recebeu a 1ª aprovação e aguarda sua análise final.

Fornecedor: ${supplierName}
Valor: ${formattedAmount}
1º aprovador: ${firstApproverName}
Comentário: ${safeComments}

Acesse a solicitação para concluir a 2ª aprovação:
${paymentDetailsUrl}

Lembrete: a segunda aprovação deve ser realizada por um validador diferente do primeiro.

Este é um email automático. Não responda esta mensagem.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`📧 Email de segunda aprovação enviado para: ${to}`);
  } catch (error) {
    logger.error('Erro ao enviar email de segunda aprovação:', error);
    throw new Error('Falha ao enviar notificação de segunda aprovação');
  }
}
