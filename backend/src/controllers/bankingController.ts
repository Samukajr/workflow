import { Response, Request } from 'express';
import Joi from 'joi';
import * as bankingService from '../services/bankingService';
import { asyncHandler, ErrorHandler } from '../middleware/errorHandler';
import logger from '../utils/logger';

const createIntegrationSchema = Joi.object({
  bank_type: Joi.string()
    .valid('inter', 'bankaool', 'b20', 'open_banking', 'manual')
    .required(),
  name: Joi.string().max(255).required(),
  api_key: Joi.string().optional(),
  api_secret: Joi.string().optional(),
  client_id: Joi.string().optional(),
  client_secret: Joi.string().optional(),
  supported_methods: Joi.array()
    .items(Joi.string().valid('ted', 'pix', 'boleto', 'transferencia'))
    .required(),
});

const initiateBankPaymentSchema = Joi.object({
  payment_request_id: Joi.string().uuid().required(),
  bank_integration_id: Joi.string().uuid().required(),
  payment_method: Joi.string()
    .valid('ted', 'pix', 'boleto', 'transferencia')
    .required(),
});

/**
 * POST /api/banking/integrations
 * Criar nova integração bancária
 */
export const createIntegration = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ErrorHandler(401, 'Não autenticado');
  }

  const { error, value } = createIntegrationSchema.validate(req.body);
  if (error) {
    throw new ErrorHandler(400, error.details[0].message);
  }

  try {
    const credentials = {
      api_key: value.api_key,
      api_secret: value.api_secret,
      client_id: value.client_id,
      client_secret: value.client_secret,
    };

    const integration = await bankingService.createBankIntegration(
      value.bank_type,
      value.name,
      credentials,
      value.supported_methods,
      req.user.id,
    );

    res.status(201).json({
      success: true,
      message: 'Integração bancária criada com sucesso',
      data: integration,
    });
  } catch (err: unknown) {
    throw new ErrorHandler(500, err instanceof Error ? err.message : String(err));
  }
});

/**
 * GET /api/banking/integrations
 * Listar todas as integrações bancárias
 */
export const listIntegrations = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ErrorHandler(401, 'Não autenticado');
  }

  try {
    const integrations = await bankingService.getAllBankIntegrations();

    res.status(200).json({
      success: true,
      data: integrations,
    });
  } catch (err: unknown) {
    throw new ErrorHandler(500, err instanceof Error ? err.message : String(err));
  }
});

/**
 * GET /api/banking/integrations/:id
 * Obter detalhes de uma integração bancária
 */
export const getIntegration = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ErrorHandler(401, 'Não autenticado');
  }

  const { id } = req.params;

  try {
    const integration = await bankingService.getBankIntegration(id);

    if (!integration) {
      throw new ErrorHandler(404, 'Integração não encontrada');
    }

    res.status(200).json({
      success: true,
      data: integration,
    });
  } catch (err: unknown) {
    if (err instanceof ErrorHandler) throw err;
    throw new ErrorHandler(500, err instanceof Error ? err.message : String(err));
  }
});

/**
 * POST /api/banking/integrations/:id/test
 * Testar conexão com banco
 */
export const testConnection = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ErrorHandler(401, 'Não autenticado');
  }

  const { id } = req.params;

  try {
    const connected = await bankingService.testBankConnection(id);

    res.status(200).json({
      success: connected,
      message: connected
        ? 'Conexão com banco estabelecida'
        : 'Falha ao conectar com banco',
      data: { connected },
    });
  } catch (err: unknown) {
    throw new ErrorHandler(500, err instanceof Error ? err.message : String(err));
  }
});

/**
 * POST /api/banking/payments/initiate
 * Iniciar pagamento via banco integrado
 */
export const initiatePayment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ErrorHandler(401, 'Não autenticado');
  }

  const { error, value } = initiateBankPaymentSchema.validate(req.body);
  if (error) {
    throw new ErrorHandler(400, error.details[0].message);
  }

  try {
    const response = await bankingService.initiateBankPayment(
      value.payment_request_id,
      value.bank_integration_id,
      value.payment_method,
      req.user.id,
    );

    res.status(200).json({
      success: response.success,
      message: response.message,
      data: response,
    });
  } catch (err: unknown) {
    throw new ErrorHandler(400, err instanceof Error ? err.message : String(err));
  }
});

/**
 * POST /api/banking/webhooks/:integrationId
 * Receber webhook do banco (sem autenticação)
 */
export const receiveWebhook = asyncHandler(async (req: Request, res: Response) => {
  const { integrationId } = req.params;
  const signature = req.headers['x-webhook-signature'] as string;

  try {
    logger.info(`🔔 Webhook recebido de ${integrationId}`);

    if (!signature) {
      logger.warn('⚠️ Webhook sem assinatura');
    }

    await bankingService.processWebhookEvent(
      integrationId,
      req.body,
      signature || 'no-signature',
    );

    // Sempre responder 200 para o banco confirmar recebimento
    res.status(200).json({
      success: true,
      message: 'Webhook recebido e processado',
    });
  } catch (err: unknown) {
    logger.error('❌ Erro ao processar webhook:', err);
    // Ainda retornar 200 para não gerar retentativas
    res.status(200).json({
      success: false,
      message: 'Webhook recebido mas com erro interno',
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

/**
 * GET /api/banking/reconciliation/:paymentRequestId
 * Obter status de reconciliação de um pagamento
 */
export const getReconciliation = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ErrorHandler(401, 'Não autenticado');
  }

  const { paymentRequestId } = req.params;

  try {
    const reconciliation = await bankingService.getReconciliationStatus(
      paymentRequestId,
    );

    if (!reconciliation) {
      throw new ErrorHandler(404, 'Reconciliação não encontrada');
    }

    res.status(200).json({
      success: true,
      data: reconciliation,
    });
  } catch (err: unknown) {
    if (err instanceof ErrorHandler) throw err;
    throw new ErrorHandler(500, err instanceof Error ? err.message : String(err));
  }
});

/**
 * GET /api/banking/reconciliation/pending
 * Listar reconciliações pendentes
 */
export const getPendingReconciliations = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ErrorHandler(401, 'Não autenticado');
    }

    try {
      const reconciliations = await bankingService.getPendingReconciliations();

      res.status(200).json({
        success: true,
        data: {
          total: reconciliations.length,
          reconciliations,
        },
      });
    } catch (err: unknown) {
      throw new ErrorHandler(500, err instanceof Error ? err.message : String(err));
    }
  },
);
