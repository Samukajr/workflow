import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController';
import { authMiddleware, requireDepartment } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/analytics/metrics:
 *   get:
 *     summary: Obter resumo de métricas por período
 *     tags: [Analytics - Fase 3C]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [today, week, month, quarter, year]
 *         description: Período para agregação de dados
 */
router.get('/metrics', authMiddleware, analyticsController.getMetrics);

/**
 * @swagger
 * /api/analytics/approval-rate:
 *   get:
 *     summary: Obter taxa de aprovação/rejeição
 *     tags: [Analytics - Fase 3C]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filtrar por departamento (opcional)
 */
router.get('/approval-rate', authMiddleware, analyticsController.getApprovalRate);

/**
 * @swagger
 * /api/analytics/by-department:
 *   get:
 *     summary: Obter métricas de aprovação separadas por departamento
 *     tags: [Analytics - Fase 3C]
 *     security:
 *       - bearerAuth: []
 */
router.get('/by-department', authMiddleware, analyticsController.getByDepartment);

/**
 * @swagger
 * /api/analytics/blocklist:
 *   get:
 *     summary: Obter métricas de fornecedores bloqueados
 *     tags: [Analytics - Fase 3C]
 *     security:
 *       - bearerAuth: []
 */
router.get('/blocklist', authMiddleware, analyticsController.getBlocklistMetrics);

/**
 * @swagger
 * /api/analytics/high-value:
 *   get:
 *     summary: Obter métricas de transações de alto valor
 *     tags: [Analytics - Fase 3C]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: number
 *         description: Valor limiar para considerar "alto valor" (padrão 50000)
 */
router.get('/high-value', authMiddleware, analyticsController.getHighValueTransactions);

export default router;
