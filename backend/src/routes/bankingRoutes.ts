import { Router } from 'express';
import * as bankingController from '../controllers/bankingController';
import { authMiddleware } from '../middleware/auth';
import { requireDepartment } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/banking/integrations:
 *   post:
 *     summary: Criar nova integração bancária
 *     tags: [Banking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bank_type:
 *                 type: string
 *                 enum: [inter, bankaool, b20, open_banking, manual]
 *               name:
 *                 type: string
 *               api_key:
 *                 type: string
 *               api_secret:
 *                 type: string
 *               supported_methods:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [ted, pix, boleto, transferencia]
 */
router.post('/integrations', authMiddleware, requireDepartment('financeiro'), bankingController.createIntegration);

/**
 * @swagger
 * /api/banking/integrations:
 *   get:
 *     summary: Listar todas as integrações bancárias
 *     tags: [Banking]
 *     security:
 *       - bearerAuth: []
 */
router.get('/integrations', authMiddleware, requireDepartment('financeiro'), bankingController.listIntegrations);

/**
 * @swagger
 * /api/banking/integrations/{id}:
 *   get:
 *     summary: Obter detalhes de uma integração bancária
 *     tags: [Banking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/integrations/:id', authMiddleware, requireDepartment('financeiro'), bankingController.getIntegration);

/**
 * @swagger
 * /api/banking/integrations/{id}/test:
 *   post:
 *     summary: Testar conexão com banco
 *     tags: [Banking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.post('/integrations/:id/test', authMiddleware, requireDepartment('financeiro'), bankingController.testConnection);

/**
 * @swagger
 * /api/banking/payments/initiate:
 *   post:
 *     summary: Iniciar pagamento via banco
 *     tags: [Banking]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payment_request_id:
 *                 type: string
 *               bank_integration_id:
 *                 type: string
 *               payment_method:
 *                 type: string
 *                 enum: [ted, pix, boleto, transferencia]
 */
router.post('/payments/initiate', authMiddleware, requireDepartment('financeiro'), bankingController.initiatePayment);

/**
 * @swagger
 * /api/banking/webhooks/{integrationId}:
 *   post:
 *     summary: Receber webhook do banco
 *     tags: [Banking]
 *     parameters:
 *       - in: path
 *         name: integrationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: x-webhook-signature
 *         required: false
 *         schema:
 *           type: string
 */
router.post('/webhooks/:integrationId', bankingController.receiveWebhook);

/**
 * @swagger
 * /api/banking/reconciliation/pending:
 *   get:
 *     summary: Listar reconciliações pendentes
 *     tags: [Banking]
 *     security:
 *       - bearerAuth: []
 */
router.get('/reconciliation/pending', authMiddleware, requireDepartment('financeiro'), bankingController.getPendingReconciliations);

/**
 * @swagger
 * /api/banking/reconciliation/{paymentRequestId}:
 *   get:
 *     summary: Obter status de reconciliação
 *     tags: [Banking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentRequestId
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/reconciliation/:paymentRequestId', authMiddleware, bankingController.getReconciliation);

export default router;
