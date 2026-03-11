import { Request, Response } from 'express';
import * as analyticsService from '../services/analyticsService';
import { asyncHandler, ErrorHandler } from '../middleware/errorHandler';

type AnalyticsPeriod = 'today' | 'week' | 'month' | 'quarter' | 'year';

function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

/**
 * GET /api/analytics/metrics
 * Obter métricas de aprovação e rejeição
 */
export const getMetrics = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ErrorHandler(401, 'Não autenticado');
  }

  const { period = 'month' } = req.query;

  if (!['today', 'week', 'month', 'quarter', 'year'].includes(String(period))) {
    throw new ErrorHandler(400, 'Período inválido. Use: today, week, month, quarter, year');
  }

  try {
    const summary = await analyticsService.getAnalyticsSummary(String(period) as AnalyticsPeriod);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (err: unknown) {
    throw new ErrorHandler(500, getErrorMessage(err, 'Falha ao obter métricas'));
  }
});

/**
 * GET /api/analytics/approval-rate
 * Obter taxa de aprovação/rejeição
 */
export const getApprovalRate = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ErrorHandler(401, 'Não autenticado');
  }

  const { department } = req.query;

  try {
    const metrics = await analyticsService.getApprovalMetrics(
      undefined,
      undefined,
      department ? String(department) : undefined,
    );

    res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (err: unknown) {
    throw new ErrorHandler(500, getErrorMessage(err, 'Falha ao obter taxa de aprovação'));
  }
});

/**
 * GET /api/analytics/by-department
 * Obter métricas específicas separadas por departamento
 */
export const getByDepartment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ErrorHandler(401, 'Não autenticado');
  }

  try {
    const metrics = await analyticsService.getApprovalMetricsByDepartment();

    res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (err: unknown) {
    throw new ErrorHandler(500, getErrorMessage(err, 'Falha ao obter métricas por departamento'));
  }
});

/**
 * GET /api/analytics/blocklist
 * Obter métricas de fornecedores bloqueados
 */
export const getBlocklistMetrics = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ErrorHandler(401, 'Não autenticado');
  }

  try {
    const metrics = await analyticsService.getBlocklistMetrics();

    res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (err: unknown) {
    throw new ErrorHandler(500, getErrorMessage(err, 'Falha ao obter métricas de blocklist'));
  }
});

/**
 * GET /api/analytics/high-value
 * Obter métricas de transações de alto valor
 */
export const getHighValueTransactions = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ErrorHandler(401, 'Não autenticado');
  }

  const { threshold = 50000 } = req.query;

  try {
    const metrics = await analyticsService.getHighValueTransactionMetrics(
      parseInt(String(threshold), 10),
    );

    res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (err: unknown) {
    throw new ErrorHandler(500, getErrorMessage(err, 'Falha ao obter métricas de alto valor'));
  }
});
