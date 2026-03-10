import * as queries from '../database/queries';
import { PaymentRequest } from '../types';
import { sendSecondApprovalEmail } from './emailService';
import { isSmsEnabled, sendSecondApprovalSms } from './smsService';
import { env } from '../config/environment';
import logger from '../utils/logger';

export interface NotificationDispatchResult {
  email_attempted: number;
  email_sent: number;
  email_failed: number;
  sms_attempted: number;
  sms_sent: number;
  sms_failed: number;
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
      email_attempted: 0,
      email_sent: 0,
      email_failed: 0,
      sms_attempted: 0,
      sms_sent: 0,
      sms_failed: 0,
    };
  }

  const emailResult = await Promise.allSettled(
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

  const emailSent = emailResult.filter((entry) => entry.status === 'fulfilled').length;
  const emailFailed = emailResult.length - emailSent;

  let smsAttempted = 0;
  let smsSent = 0;
  let smsFailed = 0;

  if (isSmsEnabled()) {
    const smsRecipients = recipients
      .map((user) => user.phone)
      .filter((phone): phone is string => Boolean(phone));

    // Fallback útil para ambientes sem telefone cadastrado em users
    if (smsRecipients.length === 0 && env.SMS_FALLBACK_PHONE) {
      smsRecipients.push(env.SMS_FALLBACK_PHONE);
    }

    if (smsRecipients.length > 0) {
      const smsResult = await Promise.allSettled(
        smsRecipients.map((phone) =>
          sendSecondApprovalSms({
            to: phone,
            requestNumber: paymentRequest.request_number,
            amount: paymentRequest.amount,
            supplierName: paymentRequest.supplier_name,
            paymentRequestId: paymentRequest.id,
          }),
        ),
      );

      smsAttempted = smsResult.length;
      smsSent = smsResult.filter((entry) => entry.status === 'fulfilled').length;
      smsFailed = smsAttempted - smsSent;
    }
  }

  if (emailFailed > 0 || smsFailed > 0) {
    logger.warn(
      `Notificação de segunda aprovação parcial para requisição ${paymentRequest.id}: email ${emailSent}/${emailResult.length}, sms ${smsSent}/${smsAttempted}.`,
    );
  } else {
    logger.info(
      `Notificação de segunda aprovação enviada com sucesso para requisição ${paymentRequest.id}: email ${emailSent}/${emailResult.length}, sms ${smsSent}/${smsAttempted}.`,
    );
  }

  return {
    email_attempted: emailResult.length,
    email_sent: emailSent,
    email_failed: emailFailed,
    sms_attempted: smsAttempted,
    sms_sent: smsSent,
    sms_failed: smsFailed,
  };
}
