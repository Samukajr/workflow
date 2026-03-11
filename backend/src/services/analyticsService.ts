import { pool } from '../config/database';
import logger from '../utils/logger';

type SqlParam = string | number | boolean | Date | null;

function getErrorInfo(err: unknown): { code?: string; message: string } {
  if (err instanceof Error) {
    const errorWithCode = err as Error & { code?: string };
    return { code: errorWithCode.code, message: err.message };
  }
  return { message: 'Erro desconhecido' };
}

function isSchemaError(err: unknown): boolean {
  const { code } = getErrorInfo(err);
  return code === '22P02' || code === '42P01' || code === '42703' || code === '42883';
}

async function getDepartmentsWithRequests(): Promise<string[]> {
  try {
    const result = await pool.query(
      `SELECT DISTINCT u.department::text AS department
       FROM users u
       INNER JOIN payment_requests pr ON pr.user_id = u.id
       WHERE u.department IS NOT NULL`,
    );

    return result.rows
      .map((row: { department: string | null }) => row.department)
      .filter((department): department is string => Boolean(department));
  } catch (error: unknown) {
    if (isSchemaError(error)) {
      const errorInfo = getErrorInfo(error);
      logger.warn('Não foi possível listar departamentos para analytics; retornando vazio', {
        code: errorInfo.code,
        message: errorInfo.message,
      });
      return [];
    }

    throw error;
  }
}

// ============= ANALYTICS TYPES =============

export interface ApprovalMetrics {
  total_requests: number;
  approved: number;
  rejected: number;
  pending: number;
  approval_rate: number; // percentual
  rejection_rate: number; // percentual
  average_approval_time_hours: number; // horas
}

export interface ApprovalMetricsByDepartment {
  [department: string]: ApprovalMetrics;
}

export interface BlocklistMetrics {
  total_blocked_suppliers: number;
  blocks_this_month: number;
  blocks_this_quarter: number;
  most_common_reasons: Array<{ reason: string; count: number }>;
}

export interface HighValueTransactionMetrics {
  total_high_value: number;
  average_amount: number;
  max_amount: number;
  requires_superadmin_approval: number;
}

export interface AnalyticsSummary {
  period: string;
  from_date: Date;
  to_date: Date;
  approval_metrics: ApprovalMetrics;
  approval_by_department: ApprovalMetricsByDepartment;
  blocklist_metrics: BlocklistMetrics;
  high_value_metrics: HighValueTransactionMetrics;
  total_payments_processed: number;
  volume_processed: number; // somatório de valores
}

// ============= ANALYTICS SERVICE =============

export async function getApprovalMetrics(
  fromDate?: Date,
  toDate?: Date,
  department?: string,
): Promise<ApprovalMetrics> {
  try {
    const where: string[] = [];
    const params: SqlParam[] = [];
    let paramCount = 0;

    if (fromDate) {
      paramCount++;
      where.push(`pr.created_at >= $${paramCount}`);
      params.push(fromDate);
    }

    if (toDate) {
      paramCount++;
      where.push(`pr.created_at <= $${paramCount}`);
      params.push(toDate);
    }

    if (department) {
      paramCount++;
      where.push(`u.department = $${paramCount}`);
      params.push(department);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const result = await pool.query(
      `SELECT
        COUNT(DISTINCT pr.id) as total_requests,
        COUNT(DISTINCT CASE WHEN pr.status = 'validado' THEN pr.id END) as approved,
        COUNT(DISTINCT CASE WHEN pr.status = 'rejeitado' THEN pr.id END) as rejected,
        COUNT(DISTINCT CASE WHEN pr.status = 'pendente_validacao' THEN pr.id END) as pending,
        EXTRACT(EPOCH FROM (AVG(CASE 
          WHEN pr.approval_completed_at IS NOT NULL 
          THEN pr.approval_completed_at - pr.created_at 
          ELSE NULL 
        END))) / 3600 as avg_approval_hours
      FROM payment_requests pr
      LEFT JOIN users u ON pr.user_id = u.id
      ${whereClause}`,
      params,
    );

    const row = result.rows[0];
    const total = parseInt(row.total_requests, 10);
    const approved = parseInt(row.approved, 10);
    const rejected = parseInt(row.rejected, 10);

    return {
      total_requests: total,
      approved,
      rejected,
      pending: parseInt(row.pending, 10),
      approval_rate: total > 0 ? (approved / total) * 100 : 0,
      rejection_rate: total > 0 ? (rejected / total) * 100 : 0,
      average_approval_time_hours: row.avg_approval_hours ? parseFloat(row.avg_approval_hours) : 0,
    };
  } catch (error: unknown) {
    if (isSchemaError(error)) {
      const errorInfo = getErrorInfo(error);
      logger.warn('Estrutura de analytics incompleta no banco; retornando métricas zeradas', {
        code: errorInfo.code,
        message: errorInfo.message,
      });
      return {
        total_requests: 0,
        approved: 0,
        rejected: 0,
        pending: 0,
        approval_rate: 0,
        rejection_rate: 0,
        average_approval_time_hours: 0,
      };
    }
    throw error;
  }
}

export async function getApprovalMetricsByDepartment(
  fromDate?: Date,
  toDate?: Date,
): Promise<ApprovalMetricsByDepartment> {
  const departments = await getDepartmentsWithRequests();
  const result: ApprovalMetricsByDepartment = {};

  for (const dept of departments) {
    const metrics = await getApprovalMetrics(fromDate, toDate, dept);
    if (metrics.total_requests > 0) {
      result[dept] = metrics;
    }
  }

  return result;
}

export async function getBlocklistMetrics(
  fromDate?: Date,
  toDate?: Date,
): Promise<BlocklistMetrics> {
  try {
    const where: string[] = [];
    const params: SqlParam[] = [];
    let paramCount = 0;

    if (fromDate) {
      paramCount++;
      where.push(`created_at >= $${paramCount}`);
      params.push(fromDate);
    }

    if (toDate) {
      paramCount++;
      where.push(`created_at <= $${paramCount}`);
      params.push(toDate);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    // Total bloqueados
    const totalResult = await pool.query(
      `SELECT COUNT(*) as count FROM supplier_blocklist WHERE is_active = true`,
    );
    const totalBlocked = parseInt(totalResult.rows[0].count, 10);

    // Bloqueados este mês
    const thisMonthResult = await pool.query(
      `SELECT COUNT(*) as count FROM supplier_blocklist 
       WHERE is_active = true AND created_at >= DATE_TRUNC('month', NOW())`,
    );
    const thisMonth = parseInt(thisMonthResult.rows[0].count, 10);

    // Bloqueados este trimestre
    const thisQuarterResult = await pool.query(
      `SELECT COUNT(*) as count FROM supplier_blocklist 
       WHERE is_active = true AND created_at >= DATE_TRUNC('quarter', NOW())`,
    );
    const thisQuarter = parseInt(thisQuarterResult.rows[0].count, 10);

    // Motivos mais comuns
    const reasonsResult = await pool.query(
      `SELECT reason, COUNT(*) as count FROM supplier_blocklist 
       WHERE is_active = true ${whereClause} 
       GROUP BY reason ORDER BY count DESC LIMIT 5`,
      params,
    );

    return {
      total_blocked_suppliers: totalBlocked,
      blocks_this_month: thisMonth,
      blocks_this_quarter: thisQuarter,
      most_common_reasons: reasonsResult.rows.map((row: { reason: string; count: string }) => ({
        reason: row.reason,
        count: parseInt(row.count, 10),
      })),
    };
  } catch (error: unknown) {
    if (isSchemaError(error)) {
      const errorInfo = getErrorInfo(error);
      logger.warn('Tabela de blocklist ausente/incompleta; retornando métricas zeradas', {
        code: errorInfo.code,
        message: errorInfo.message,
      });
      return {
        total_blocked_suppliers: 0,
        blocks_this_month: 0,
        blocks_this_quarter: 0,
        most_common_reasons: [],
      };
    }
    throw error;
  }
}

export async function getHighValueTransactionMetrics(
  threshold = 50000,
  fromDate?: Date,
  toDate?: Date,
): Promise<HighValueTransactionMetrics> {
  try {
    const where = ['amount >= $1'];
    const params: SqlParam[] = [threshold];
    let paramCount = 1;

    if (fromDate) {
      paramCount++;
      where.push(`created_at >= $${paramCount}`);
      params.push(fromDate);
    }

    if (toDate) {
      paramCount++;
      where.push(`created_at <= $${paramCount}`);
      params.push(toDate);
    }

    const result = await pool.query(
      `SELECT
        COUNT(*) as total,
        AVG(amount) as avg_amount,
        MAX(amount) as max_amount,
        COUNT(DISTINCT CASE WHEN requires_double_approval = true THEN id END) as requires_admin
      FROM payment_requests
      WHERE ${where.join(' AND ')}`,
      params,
    );

    const row = result.rows[0];

    return {
      total_high_value: parseInt(row.total, 10),
      average_amount: row.avg_amount ? parseFloat(row.avg_amount) : 0,
      max_amount: row.max_amount ? parseFloat(row.max_amount) : 0,
      requires_superadmin_approval: parseInt(row.requires_admin, 10),
    };
  } catch (error: unknown) {
    if (isSchemaError(error)) {
      const errorInfo = getErrorInfo(error);
      logger.warn('Colunas de aprovação não disponíveis; retornando métricas de alto valor zeradas', {
        code: errorInfo.code,
        message: errorInfo.message,
      });
      return {
        total_high_value: 0,
        average_amount: 0,
        max_amount: 0,
        requires_superadmin_approval: 0,
      };
    }
    throw error;
  }
}

export async function getAnalyticsSummary(
  period: 'today' | 'week' | 'month' | 'quarter' | 'year' = 'month',
): Promise<AnalyticsSummary> {
  const now = new Date();
  let fromDate: Date;

  switch (period) {
    case 'today':
      fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarter': {
      const quarter = Math.floor(now.getMonth() / 3);
      fromDate = new Date(now.getFullYear(), quarter * 3, 1);
      break;
    }
    case 'year':
      fromDate = new Date(now.getFullYear(), 0, 1);
      break;
  }

  const approvalMetrics = await getApprovalMetrics(fromDate, now);
  const approvalByDept = await getApprovalMetricsByDepartment(fromDate, now);
  const blocklistMetrics = await getBlocklistMetrics(fromDate, now);
  const highValueMetrics = await getHighValueTransactionMetrics(50000, fromDate, now);

  // Total de pagamentos processados
  let volumeRow: { total: string; volume: string | null } = { total: '0', volume: null };
  try {
    const volumeResult = await pool.query(
      `SELECT 
        COUNT(*) as total,
        SUM(amount) as volume
      FROM payment_requests 
      WHERE status = 'pago' AND created_at >= $1 AND created_at <= $2`,
      [fromDate, now],
    );
    volumeRow = volumeResult.rows[0];
  } catch (error: unknown) {
    if (!isSchemaError(error)) {
      throw error;
    }
    const errorInfo = getErrorInfo(error);
    logger.warn('Falha ao calcular volume de pagamentos; retornando zero', {
      code: errorInfo.code,
      message: errorInfo.message,
    });
  }

  logger.info(`Analytics summary gerado para período: ${period}`);

  return {
    period,
    from_date: fromDate,
    to_date: now,
    approval_metrics: approvalMetrics,
    approval_by_department: approvalByDept,
    blocklist_metrics: blocklistMetrics,
    high_value_metrics: highValueMetrics,
    total_payments_processed: parseInt(volumeRow.total, 10),
    volume_processed: volumeRow.volume ? parseFloat(volumeRow.volume) : 0,
  };
}
