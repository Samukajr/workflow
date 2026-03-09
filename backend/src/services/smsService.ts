import superagent from 'superagent';
import { env } from '../config/environment';
import logger from '../utils/logger';

interface SendSecondApprovalSmsParams {
  to: string;
  requestNumber: string;
  amount: number;
  supplierName: string;
  paymentRequestId: string;
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function isSmsEnabled(): boolean {
  return env.SMS_ENABLED;
}

export async function sendSecondApprovalSms({
  to,
  requestNumber,
  amount,
  supplierName,
  paymentRequestId,
}: SendSecondApprovalSmsParams): Promise<void> {
  if (!env.SMS_ENABLED) {
    logger.info('SMS desabilitado por configuração.');
    return;
  }

  if (!env.SMS_WEBHOOK_URL) {
    logger.warn('SMS habilitado, mas SMS_WEBHOOK_URL não está configurado.');
    return;
  }

  const toNormalized = normalizePhone(to);
  const amountFormatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);

  const detailsUrl = `${env.FRONTEND_URL}/payments/${paymentRequestId}`;
  const text = `2ª aprovação pendente ${requestNumber}. Fornecedor: ${supplierName}. Valor: ${amountFormatted}. Acesse: ${detailsUrl}`;

  try {
    let request = superagent
      .post(env.SMS_WEBHOOK_URL)
      .send({
        provider: env.SMS_PROVIDER,
        to: toNormalized,
        message: text,
        reference: {
          payment_request_id: paymentRequestId,
          request_number: requestNumber,
        },
      });

    if (env.SMS_WEBHOOK_TOKEN) {
      request = request.set('Authorization', `Bearer ${env.SMS_WEBHOOK_TOKEN}`);
    }

    await request;

    logger.info(`SMS de segunda aprovação enviado para: ${toNormalized}`);
  } catch (error) {
    logger.error('Erro ao enviar SMS de segunda aprovação:', error);
    throw new Error('Falha ao enviar SMS de segunda aprovação');
  }
}
