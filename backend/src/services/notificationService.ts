import * as queries from '../database/queries';
import { PaymentRequest } from '../types';
import { sendSecondApprovalEmail } from './emailService';
import logger from '../utils/logger';

export interface NotificationDispatchResult {
  attempted: number;
  sent: number;
  failed: number;
}

export async function notifySecondApprovers(
  paymentRequest: PaymentRequest,
  firstApproverId: string,
  comments?: string,
): Promise<NotificationDispatchResult> {
  const firstApprover = await queries.getUserById(firstApproverId);
  const validationUsers = await queries.getUsersByDepartment('validacao');

  const recipients = validationUsers.filter((user) => user.id !== firstApproverId && user.email);

  if (recipients.length === 0) {
    logger.warn(
      `Nenhum validador elegível para segunda aprovação da requisição ${paymentRequest.id}.`,
    );

    return {
      attempted: 0,
      sent: 0,
      failed: 0,
    };
  }

  const result = await Promise.allSettled(
    recipients.map((recipient) =>
      sendSecondApprovalEmail({
        to: recipient.email,
        approverName: recipient.name,
        requestNumber: paymentRequest.request_number,
        amount: paymentRequest.amount,
        supplierName: paymentRequest.supplier_name,
        firstApproverName: firstApprover?.name || 'Validador 1',
        paymentRequestId: paymentRequest.id,
        comments,
      }),
    ),
  );

  const sent = result.filter((entry) => entry.status === 'fulfilled').length;
  const failed = result.length - sent;

  if (failed > 0) {
    logger.warn(
      `Notificação de segunda aprovação enviada parcialmente para requisição ${paymentRequest.id}: ${sent} sucesso(s), ${failed} falha(s).`,
    );
  } else {
    logger.info(
      `Notificação de segunda aprovação enviada para ${sent} usuário(s) na requisição ${paymentRequest.id}.`,
    );
  }

  return {
    attempted: result.length,
    sent,
    failed,
  };
}
