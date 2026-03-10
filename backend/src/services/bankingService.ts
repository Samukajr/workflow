import * as queries from '../database/queries';
import { pool } from '../config/database';
import {
  BankIntegration,
  WebhookEvent,
  PaymentReconciliation,
  PaymentMethod,
  BankPaymentResponse,
  PaymentRequest,
} from '../types';
import { createBankProvider } from './bankProviders';
import { encryptCredential, decryptCredential, verifyWebhookSignature } from '../utils/encryption';
import logger from '../utils/logger';

/**
 * Bank Integration Service
 * Gerencia integrações com múltiplos bancos e processa webhooks
 */

export async function createBankIntegration(
  bankType: string,
  name: string,
  credentials: Record<string, unknown>,
  supportedMethods: PaymentMethod[],
  createdBy: string,
): Promise<BankIntegration> {
  try {
    logger.info(`📍 Criando integração bancária: ${name} (${bankType})`);

    const result = await pool.query(
      `INSERT INTO bank_integrations (
        bank_type, name, api_key_encrypted, api_secret_encrypted,
        client_id, client_secret_encrypted, supported_methods, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        bankType,
        name,
        credentials.api_key ? encryptCredential(credentials.api_key as string) : null,
        credentials.api_secret ? encryptCredential(credentials.api_secret as string) : null,
        credentials.client_id || null,
        credentials.client_secret ? encryptCredential(credentials.client_secret as string) : null,
        supportedMethods,
        createdBy,
      ],
    );

    logger.info(`✅ Integração bancária criada: ${result.rows[0].id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('❌ Erro ao criar integração bancária:', error);
    throw error;
  }
}

export async function getBankIntegration(integrationId: string): Promise<BankIntegration | null> {
  try {
    const result = await pool.query(
      'SELECT * FROM bank_integrations WHERE id = $1 AND is_active = true',
      [integrationId],
    );

    return result.rows[0] || null;
  } catch (error) {
    logger.error('❌ Erro ao buscar integração bancária:', error);
    throw error;
  }
}

export async function getAllBankIntegrations(): Promise<BankIntegration[]> {
  try {
    const result = await pool.query(
      'SELECT * FROM bank_integrations WHERE is_active = true ORDER BY created_at DESC',
    );

    return result.rows;
  } catch (error) {
    logger.error('❌ Erro ao listar integrações bancárias:', error);
    throw error;
  }
}

export async function initiateBankPayment(
  paymentRequestId: string,
  integrationId: string,
  method: PaymentMethod,
  initiatedBy: string,
): Promise<BankPaymentResponse> {
  try {
    logger.info(`💳 Iniciando pagamento bancário para requisição ${paymentRequestId}`);

    // 1. Buscar requisição de pagamento
    const prResult = await pool.query(
      'SELECT * FROM payment_requests WHERE id = $1',
      [paymentRequestId],
    );

    if (prResult.rows.length === 0) {
      throw new Error('Requisição de pagamento não encontrada');
    }

    const paymentRequest: PaymentRequest = prResult.rows[0];

    if (paymentRequest.status !== 'validado') {
      throw new Error(
        `Pagamento não pode ser iniciado. Status atual: ${paymentRequest.status}`,
      );
    }

    // 2. Buscar integração bancária
    const integration = await getBankIntegration(integrationId);
    if (!integration) {
      throw new Error('Integração bancária não encontrada ou inativa');
    }

    // 3. Verificar se método é suportado
    if (!integration.supported_methods.includes(method)) {
      throw new Error(
        `Integração ${integration.name} não suporta método ${method}`,
      );
    }

    // 4. Criar provider e iniciar pagamento
    const provider = createBankProvider(integration);
    const response = await provider.initializePayment(
      paymentRequestId,
      paymentRequest.amount,
      paymentRequest.supplier_name,
      paymentRequest.supplier_document,
      paymentRequest.due_date,
      method,
    );

    if (!response.success) {
      throw new Error(`Erro ao iniciar pagamento: ${response.message}`);
    }

    // 5. Atualizar payment_request com informações do banco
    await pool.query(
      `UPDATE payment_requests SET
        bank_integration_id = $1,
        external_payment_id = $2,
        payment_method = $3,
        payment_initiated_at = NOW(),
        status = 'em_pagamento'
      WHERE id = $4`,
      [integrationId, response.external_payment_id, method, paymentRequestId],
    );

    // 6. Criar workflow entry
    await pool.query(
      `INSERT INTO payment_workflows (
        payment_request_id, action, performed_by, status_from, status_to, comments
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        paymentRequestId,
        'pagamento',
        initiatedBy,
        'validado',
        'em_pagamento',
        `Pagamento iniciado via ${integration.name} - Ext ID: ${response.external_payment_id}`,
      ],
    );

    logger.info(`✅ Pagamento iniciado: ${response.external_payment_id}`);
    return response;
  } catch (error) {
    logger.error('❌ Erro ao iniciar pagamento bancário:', error);
    throw error;
  }
}

export async function processWebhookEvent(
  integrationId: string,
  payload: Record<string, unknown>,
  signature: string,
): Promise<void> {
  try {
    logger.info(`🔔 Processando webhook da integração ${integrationId}`);

    // 1. Buscar integração
    const integration = await getBankIntegration(integrationId);
    if (!integration) {
      throw new Error('Integração não encontrada');
    }

    // 2. Verificar assinatura
    const secret = integration.webhook_secret_encrypted
      ? decryptCredential(integration.webhook_secret_encrypted)
      : 'default-secret';

    const payloadStr = JSON.stringify(payload);
    let signatureVerified = true;

    try {
      signatureVerified = verifyWebhookSignature(payloadStr, signature, secret);
    } catch (error) {
      logger.warn('⚠️ Falha na verificação de assinatura do webhook, mas processando mesmo assim');
      signatureVerified = false;
    }

    // 3. Salvar evento de webhook
    const eventResult = await pool.query(
      `INSERT INTO webhook_events (
        bank_integration_id, event_type, event_data, signature_verified
      ) VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [integrationId, 'payment_confirmed', payload, signatureVerified],
    );

    const event: WebhookEvent = eventResult.rows[0];

    // 4. Parse do evento
    const provider = createBankProvider(integration);
    const parsed = provider.parseWebhookEvent(payload);

    logger.info(
      `📋 Webhook parseado - External ID: ${parsed.externalPaymentId}, Status: ${parsed.status}`,
    );

    // 5. Buscar payment_request pelo external_payment_id
    const prResult = await pool.query(
      'SELECT * FROM payment_requests WHERE external_payment_id = $1',
      [parsed.externalPaymentId],
    );

    if (prResult.rows.length === 0) {
      logger.warn(`⚠️ Pagamento externo não encontrado: ${parsed.externalPaymentId}`);
      return;
    }

    const paymentRequest: PaymentRequest = prResult.rows[0];

    // 6. Atualizar status do pagamento
    let newStatus = 'pago';
    if (parsed.status === 'rejected' || parsed.status === 'falha') {
      newStatus = 'cancelado';
    } else if (parsed.status === 'pending' || parsed.status === 'processando') {
      newStatus = 'em_pagamento';
    }

    await pool.query(
      'UPDATE payment_requests SET status = $1, payment_confirmed_at = NOW() WHERE id = $2',
      [newStatus, paymentRequest.id],
    );

    // 7. Criar reconciliação
    await pool.query(
      `INSERT INTO payment_reconciliations (
        payment_request_id, bank_integration_id, external_payment_id,
        status, local_amount, bank_amount, local_date, bank_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (payment_request_id, external_payment_id) DO UPDATE SET
        status = EXCLUDED.status,
        bank_amount = EXCLUDED.bank_amount,
        bank_date = EXCLUDED.bank_date,
        updated_at = NOW()`,
      [
        paymentRequest.id,
        integrationId,
        parsed.externalPaymentId,
        'confirmado',
        paymentRequest.amount,
        parsed.amount || paymentRequest.amount,
        paymentRequest.created_at,
        parsed.date || new Date(),
      ],
    );

    // 8. Marcar webhook como processado
    await pool.query('UPDATE webhook_events SET processed = true, processed_at = NOW() WHERE id = $1', [
      event.id,
    ]);

    logger.info(
      `✅ Webhook processado com sucesso - Payment Request: ${paymentRequest.id}`,
    );
  } catch (error) {
    logger.error('❌ Erro ao processar webhook:', error);
    throw error;
  }
}

export async function getReconciliationStatus(
  paymentRequestId: string,
): Promise<PaymentReconciliation | null> {
  try {
    const result = await pool.query(
      'SELECT * FROM payment_reconciliations WHERE payment_request_id = $1 ORDER BY created_at DESC LIMIT 1',
      [paymentRequestId],
    );

    return result.rows[0] || null;
  } catch (error) {
    logger.error('❌ Erro ao buscar reconciliação:', error);
    throw error;
  }
}

export async function getPendingReconciliations(): Promise<PaymentReconciliation[]> {
  try {
    const result = await pool.query(
      'SELECT * FROM payment_reconciliations WHERE status = $1 ORDER BY created_at ASC LIMIT 100',
      ['pendente'],
    );

    return result.rows;
  } catch (error) {
    logger.error('❌ Erro ao buscar reconciliações pendentes:', error);
    throw error;
  }
}

export async function testBankConnection(integrationId: string): Promise<boolean> {
  try {
    const integration = await getBankIntegration(integrationId);
    if (!integration) {
      throw new Error('Integração não encontrada');
    }

    const provider = createBankProvider(integration);
    const connected = await provider.testConnection();

    logger.info(`🔌 Teste de conexão: ${connected ? 'OK' : 'FALHA'}`);
    return connected;
  } catch (error) {
    logger.error('❌ Erro ao testar conexão:', error);
    return false;
  }
}
