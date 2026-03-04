import * as queries from '../database/queries';
import { PaymentRequest, PaymentWorkflow } from '../types';
import logger from '../utils/logger';

export async function submitPaymentRequest(
  userId: string,
  documentType: string,
  amount: number,
  supplierName: string,
  supplierDocument: string,
  dueDate: Date,
  documentUrl: string,
  notes?: string,
): Promise<PaymentRequest> {
  const paymentRequest = await queries.createPaymentRequest(
    userId,
    documentType,
    amount,
    supplierName,
    supplierDocument,
    dueDate,
    documentUrl,
    notes,
  );

  // Registrar no workflow
  await queries.createWorkflowEntry(
    paymentRequest.id,
    'submissao',
    userId,
    null,
    'pendente_validacao',
    'Requisição de pagamento submetida',
  );

  // Auditoria
  await queries.createAuditLog(userId, 'REQUISICAO_CRIADA', 'payment_request', paymentRequest.id);

  logger.info(`Requisição de pagamento ${paymentRequest.id} submetida por ${userId}`);

  return paymentRequest;
}

export async function validatePaymentRequest(
  paymentRequestId: string,
  approved: boolean,
  validatedBy: string,
  comments?: string,
): Promise<PaymentRequest> {
  const paymentRequest = await queries.getPaymentRequestById(paymentRequestId);

  if (!paymentRequest) {
    throw new Error('Requisição de pagamento não encontrada');
  }

  if (paymentRequest.status !== 'pendente_validacao') {
    throw new Error('Requisição não está pendente de validação');
  }

  const newStatus = approved ? 'validado' : 'rejeitado';

  const updatedRequest = await queries.updatePaymentRequestStatus(paymentRequestId, newStatus);

  // Registrar no workflow
  await queries.createWorkflowEntry(
    paymentRequestId,
    'validacao',
    validatedBy,
    'pendente_validacao',
    newStatus,
    comments || (approved ? 'Validação aprovada' : 'Validação rejeitada'),
  );

  // Auditoria
  await queries.createAuditLog(validatedBy, `REQUISICAO_${newStatus.toUpperCase()}`, 'payment_request', paymentRequestId);

  logger.info(`Requisição ${paymentRequestId} ${newStatus} por ${validatedBy}`);

  return updatedRequest;
}

export async function processPayment(
  paymentRequestId: string,
  processedBy: string,
  transactionId: string,
  paymentDate: Date,
  notes?: string,
): Promise<PaymentRequest> {
  const paymentRequest = await queries.getPaymentRequestById(paymentRequestId);

  if (!paymentRequest) {
    throw new Error('Requisição de pagamento não encontrada');
  }

  if (paymentRequest.status !== 'validado') {
    throw new Error('Requisição não está validada para pagamento');
  }

  // Atualizar para "em_pagamento"
  await queries.updatePaymentRequestStatus(paymentRequestId, 'em_pagamento');

  // Registrar no workflow
  await queries.createWorkflowEntry(
    paymentRequestId,
    'pagamento',
    processedBy,
    'validado',
    'em_pagamento',
    `Pagamento iniciado - Transação: ${transactionId}`,
  );

  // Atualizar para "pago"
  const paidRequest = await queries.updatePaymentRequestStatus(paymentRequestId, 'pago');

  await queries.createWorkflowEntry(
    paymentRequestId,
    'confirmacao_pagamento',
    processedBy,
    'em_pagamento',
    'pago',
    `Pagamento confirmado - Transação: ${transactionId} - Data: ${paymentDate}`,
  );

  // Auditoria
  await queries.createAuditLog(processedBy, 'REQUISICAO_PAGA', 'payment_request', paymentRequestId, {
    transaction_id: transactionId,
    payment_date: paymentDate,
  });

  logger.info(`Requisição ${paymentRequestId} marcada como paga por ${processedBy}`);

  return paidRequest;
}

export async function getPaymentRequestDetails(id: string): Promise<{ request: PaymentRequest; workflow: PaymentWorkflow[] } | null> {
  const request = await queries.getPaymentRequestById(id);

  if (!request) {
    return null;
  }

  const workflow = await queries.getWorkflowHistory(id);

  return { request, workflow };
}

export async function getDashboardStats(currentUserDepartment: string): Promise<any> {
  const pendingValidation = await queries.getPaymentRequestsCountByStatus('pendente_validacao');
  const validated = await queries.getPaymentRequestsCountByStatus('validado');
  const paid = await queries.getPaymentRequestsCountByStatus('pago');
  const rejected = await queries.getPaymentRequestsCountByStatus('rejeitado');

  return {
    pendingValidation,
    validated,
    paid,
    rejected,
    userDepartment: currentUserDepartment,
  };
}
