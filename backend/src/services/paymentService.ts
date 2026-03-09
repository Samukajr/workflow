import * as queries from '../database/queries';
import { PaymentRequest, PaymentWorkflow } from '../types';
import logger from '../utils/logger';
import { notifySecondApprovers } from './notificationService';

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
  // FASE 2: Verificar blocklist do fornecedor
  const blocklisted = await queries.checkSupplierBlocklist(supplierDocument);
  
  if (blocklisted) {
    logger.warn(`Tentativa de submissão com fornecedor bloqueado: ${supplierDocument}`);
    throw new Error(`Fornecedor ${supplierName} está na blocklist: ${blocklisted.reason}`);
  }

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

  // FASE 2: Determinar alçada e necessidade de dupla aprovação
  const approvalRule = await queries.getApprovalRuleByAmount(amount);
  
  if (approvalRule) {
    await queries.updatePaymentRequestApprovers(
      paymentRequest.id,
      undefined,
      undefined,
      approvalRule.requires_double_approval
    );
    
    logger.info(`Requisição ${paymentRequest.id} requer aprovação dupla: ${approvalRule.requires_double_approval}`);
  }

  // FASE 2: Criar checklist de conformidade automaticamente
  const checklistTemplate = await queries.getDefaultChecklistTemplate();
  if (checklistTemplate) {
    await queries.createPaymentChecklist(paymentRequest.id, checklistTemplate.id);
    logger.info(`Checklist criado para requisição ${paymentRequest.id}`);
  }

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
  checklistItems?: string[],
): Promise<PaymentRequest> {
  const paymentRequest = await queries.getPaymentRequestById(paymentRequestId);

  if (!paymentRequest) {
    throw new Error('Requisição de pagamento não encontrada');
  }

  if (paymentRequest.status !== 'pendente_validacao') {
    throw new Error('Requisição não está pendente de validação');
  }

  // FASE 2: Verificar checklist se fornecido
  if (checklistItems && checklistItems.length > 0) {
    await queries.updateChecklistItems(paymentRequestId, checklistItems, validatedBy);
    
    // Verificar se checklist está completo
    const checklist = await queries.getPaymentChecklist(paymentRequestId);
    const template = await queries.getDefaultChecklistTemplate();
    
    if (checklist && template) {
      const requiredItems = template.items.filter(item => item.required).map(item => item.id);
      const allRequiredChecked = requiredItems.every(itemId => checklistItems.includes(itemId));
      
      if (!allRequiredChecked) {
        throw new Error('Checklist de conformidade incompleto. Todos os itens obrigatórios devem ser marcados.');
      }
      
      await queries.completeChecklist(paymentRequestId);
    }
  }

  // FASE 2: Verificar se precisa de dupla aprovação
  const requiresDouble = paymentRequest.requires_double_approval;
  
  if (requiresDouble && approved) {
    // Verificar se já existe primeira aprovação
    const existingApproval = await queries.getApprovalByOrder(paymentRequestId, 1);
    
    if (!existingApproval) {
      // Esta é a primeira aprovação
      await queries.createPaymentApproval(paymentRequestId, validatedBy, 1, 'aprovado', comments);
      await queries.updatePaymentRequestApprovers(paymentRequestId, validatedBy);
      
      logger.info(`Primeira aprovação registrada para requisição ${paymentRequestId} por ${validatedBy}`);
      
      // Não muda o status ainda, aguarda segunda aprovação
      await queries.createWorkflowEntry(
        paymentRequestId,
        'aprovacao',
        validatedBy,
        'pendente_validacao',
        'pendente_validacao',
        `Primeira aprovação: ${comments || 'Aprovado'}`,
      );
      
      await queries.createAuditLog(validatedBy, `PRIMEIRA_APROVACAO`, 'payment_request', paymentRequestId);

      // FASE 3B: Notificar validadores elegíveis para segunda aprovação
      try {
        const dispatch = await notifySecondApprovers(paymentRequest, validatedBy, comments);
        await queries.createAuditLog(validatedBy, 'NOTIFICACAO_SEGUNDA_APROVACAO', 'payment_request', paymentRequestId, {
          attempted: dispatch.attempted,
          sent: dispatch.sent,
          failed: dispatch.failed,
        });
      } catch (notificationError) {
        logger.error('Falha ao disparar notificação de segunda aprovação:', notificationError);
      }
      
      return paymentRequest; // Retorna sem mudar status
    } else {
      // Esta é a segunda aprovação - verificar que não é o mesmo aprovador
      if (existingApproval.approver_id === validatedBy) {
        throw new Error('O mesmo validador não pode fazer a segunda aprovação');
      }
      
      await queries.createPaymentApproval(paymentRequestId, validatedBy, 2, 'aprovado', comments);
      await queries.updatePaymentRequestApprovers(paymentRequestId, existingApproval.approver_id, validatedBy);
      await queries.markApprovalCompleted(paymentRequestId);
      
      logger.info(`Segunda aprovação registrada para requisição ${paymentRequestId} por ${validatedBy}`);
      
      // Agora sim, aprovar a requisição
      const updatedRequest = await queries.updatePaymentRequestStatus(paymentRequestId, 'validado');
      
      await queries.createWorkflowEntry(
        paymentRequestId,
        'aprovacao',
        validatedBy,
        'pendente_validacao',
        'validado',
        `Segunda aprovação: ${comments || 'Aprovado'} - Validação completa com dupla aprovação`,
      );
      
      await queries.createAuditLog(validatedBy, `REQUISICAO_VALIDADO`, 'payment_request', paymentRequestId);
      
      return updatedRequest;
    }
  }

  // Aprovação única ou rejeição
  const newStatus = approved ? 'validado' : 'rejeitado';

  if (!approved) {
    // Registrar rejeição
    await queries.createPaymentApproval(paymentRequestId, validatedBy, 1, 'rejeitado', comments);
  } else {
    // Aprovação única (sem dupla aprovação)
    await queries.createPaymentApproval(paymentRequestId, validatedBy, 1, 'aprovado', comments);
    await queries.updatePaymentRequestApprovers(paymentRequestId, validatedBy);
    await queries.markApprovalCompleted(paymentRequestId);
  }

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

export async function closePaymentRequest(
  paymentRequestId: string,
  closedBy: string,
  closeReason?: string,
  closeEvidenceUrl?: string,
  comments?: string,
): Promise<PaymentRequest> {
  const paymentRequest = await queries.getPaymentRequestById(paymentRequestId);

  if (!paymentRequest) {
    throw new Error('Requisição de pagamento não encontrada');
  }

  if (paymentRequest.status !== 'pago') {
    throw new Error('A solicitação só pode ser encerrada após o status pago');
  }

  // FASE 2: Atualizar informações de encerramento
  await queries.updatePaymentClosureInfo(
    paymentRequestId,
    closedBy,
    closeReason,
    closeEvidenceUrl
  );

  await queries.createWorkflowEntry(
    paymentRequestId,
    'encerramento',
    closedBy,
    'pago',
    'pago',
    comments || closeReason || 'Solicitação encerrada pelo financeiro',
  );

  await queries.createAuditLog(closedBy, 'REQUISICAO_ENCERRADA', 'payment_request', paymentRequestId, {
    close_reason: closeReason || null,
    close_evidence_url: closeEvidenceUrl || null,
    comments: comments || null,
  });

  logger.info(`Requisição ${paymentRequestId} encerrada por ${closedBy} - Motivo: ${closeReason || 'N/A'}`);

  // Buscar e retornar a requisição atualizada
  const updatedRequest = await queries.getPaymentRequestById(paymentRequestId);
  return updatedRequest!;
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

// ===== FASE 2: FUNÇÕES AUXILIARES =====

export async function addSupplierToBlocklist(
  supplierDocument: string,
  supplierName: string,
  reason: string,
  blockedBy: string,
): Promise<void> {
  await queries.addToBlocklist(supplierDocument, supplierName, reason, blockedBy);
  
  await queries.createAuditLog(blockedBy, 'FORNECEDOR_BLOQUEADO', 'supplier_blocklist', null, {
    supplier_document: supplierDocument,
    supplier_name: supplierName,
    reason,
  });
  
  logger.info(`Fornecedor ${supplierName} (${supplierDocument}) adicionado à blocklist por ${blockedBy}`);
}

export async function getPaymentChecklist(paymentRequestId: string) {
  const checklist = await queries.getPaymentChecklist(paymentRequestId);
  
  if (!checklist) {
    return null;
  }
  
  const template = await queries.getDefaultChecklistTemplate();
  
  return {
    checklist,
    template,
  };
}

export async function getApprovalRules() {
  return await queries.getAllApprovalRules();
}

export async function getPaymentApprovals(paymentRequestId: string) {
  return await queries.getPaymentApprovals(paymentRequestId);
}

