import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

export interface LGPDConsent {
  id: string;
  user_id: string;
  consent_type: string;
  given_at: string;
  revoked_at: string | null;
}

export interface DataDeletionRequest {
  id: string;
  user_id: string;
  status: string;
  request_date: string;
  completed_at: string | null;
}

/**
 * Registrar consentimento LGPD
 */
export async function recordConsent(
  userId: string,
  consentType: string,
  ipAddress: string,
  userAgent: string,
): Promise<LGPDConsent> {
  const id = uuidv4();

  const result = await pool.query(
    `INSERT INTO lgpd_consents (id, user_id, consent_type, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id, consent_type, given_at, revoked_at`,
    [id, userId, consentType, ipAddress, userAgent],
  );

  logger.info(`Consentimento LGPD registrado: ${consentType} para usuário ${userId}`);
  return result.rows[0];
}

/**
 * Revogar consentimento LGPD
 */
export async function revokeConsent(userId: string, consentType: string): Promise<void> {
  await pool.query(
    `UPDATE lgpd_consents 
     SET revoked_at = NOW() 
     WHERE user_id = $1 AND consent_type = $2 AND revoked_at IS NULL`,
    [userId, consentType],
  );

  logger.info(`Consentimento LGPD revogado: ${consentType} para usuário ${userId}`);
}

/**
 * Solicitar direito ao esquecimento (deleção de dados)
 */
export async function requestDataDeletion(userId: string, reason: string): Promise<DataDeletionRequest> {
  const id = uuidv4();

  const result = await pool.query(
    `INSERT INTO data_deletion_requests (id, user_id, status, reason)
     VALUES ($1, $2, 'pending', $3)
     RETURNING id, user_id, status, request_date, completed_at`,
    [id, userId, reason],
  );

  logger.info(`Requisição de deleção criada para usuário ${userId}`);
  return result.rows[0];
}

/**
 * Obter todas as requisições de deleção (para admin aprovar)
 */
export async function getPendingDeletionRequests(): Promise<DataDeletionRequest[]> {
  const result = await pool.query(
    `SELECT id, user_id, status, request_date, completed_at
     FROM data_deletion_requests
     WHERE status = 'pending'
     ORDER BY request_date DESC`,
  );

  return result.rows;
}

/**
 * Aprovar requisição de deleção (só admin)
 */
export async function approveDeletionRequest(requestId: string, authorizedBy: string): Promise<void> {
  await pool.query(
    `UPDATE data_deletion_requests 
     SET status = 'approved', authorized_by = $1, updated_at = NOW()
     WHERE id = $2`,
    [authorizedBy, requestId],
  );

  logger.info(`Requisição de deleção ${requestId} aprovada por ${authorizedBy}`);
}

/**
 * Exportar dados pessoais do usuário (direito de portabilidade LGPD)
 */
export async function exportPersonalData(userId: string): Promise<string> {
  try {
    // Buscar todos os dados pessoais do usuário
    const userData = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

    const paymentData = await pool.query(
      `SELECT id, request_number, document_type, amount, supplier_name, status, created_at
       FROM payment_requests WHERE user_id = $1`,
      [userId],
    );

    const workflowData = await pool.query(
      `SELECT id, action, status_from, status_to, created_at
       FROM payment_workflows WHERE performed_by = $1`,
      [userId],
    );

    const consentData = await pool.query(`SELECT consent_type, given_at, revoked_at FROM lgpd_consents WHERE user_id = $1`, [userId]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: userData.rows[0],
      paymentRequests: paymentData.rows,
      workflows: workflowData.rows,
      consents: consentData.rows,
    };

    // Registrar export
    const id = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Disponível por 7 dias

    await pool.query(
      `INSERT INTO personal_data_exports (id, user_id, file_path, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [id, userId, `exports/${id}.json`, expiresAt],
    );

    logger.info(`Dados pessoais exportados para usuário ${userId}`);
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    logger.error('Erro ao exportar dados pessoais:', error);
    throw error;
  }
}

/**
 * Obter histórico de processamento de dados (auditoria LGPD)
 */
export async function getPersonalDataAudit(userId: string): Promise<any[]> {
  const result = await pool.query(
    `SELECT action, data_type, old_value, new_value, reason, performed_by, created_at
     FROM personal_data_audit
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 100`,
    [userId],
  );

  return result.rows;
}

/**
 * Registrar auditoria de processamento de dados pessoais
 */
export async function recordDataAudit(
  userId: string,
  action: string,
  dataType: string,
  oldValue: string,
  newValue: string,
  reason: string,
  ipAddress: string,
  userAgent: string,
  performedBy?: string,
): Promise<void> {
  const id = uuidv4();

  await pool.query(
    `INSERT INTO personal_data_audit (
      id, user_id, action, data_type, old_value, new_value, reason, ip_address, user_agent, performed_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [id, userId, action, dataType, oldValue, newValue, reason, ipAddress, userAgent, performedBy || null],
  );
}
