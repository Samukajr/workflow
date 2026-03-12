import { pool } from '../config/database';
import { 
  User, 
  PaymentRequest, 
  PaymentWorkflow, 
  AuditLog,
  ApprovalRule,
  PaymentApproval,
  ComplianceChecklistTemplate,
  PaymentComplianceChecklist,
  SupplierBlocklist
} from '../types';
import { v4 as uuidv4 } from 'uuid';

// ============= USERS QUERIES =============

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function createUser(email: string, name: string, department: string, passwordHash: string): Promise<User> {
  const id = uuidv4();
  const result = await pool.query(
    'INSERT INTO users (id, email, name, department, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [id, email, name, department, passwordHash],
  );
  return result.rows[0];
}

export async function updateLastLogin(userId: string): Promise<void> {
  await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [userId]);
}

export async function setUserTwoFactorSecret(userId: string, encryptedSecret: string): Promise<void> {
  await pool.query(
    `UPDATE users
     SET two_factor_secret_encrypted = $1,
         two_factor_enabled = false,
         two_factor_backup_codes = NULL,
         updated_at = NOW()
     WHERE id = $2`,
    [encryptedSecret, userId],
  );
}

export async function enableUserTwoFactor(userId: string, backupCodesHash: string[]): Promise<void> {
  await pool.query(
    `UPDATE users
     SET two_factor_enabled = true,
         two_factor_backup_codes = $1,
         updated_at = NOW()
     WHERE id = $2`,
    [backupCodesHash, userId],
  );
}

export async function disableUserTwoFactor(userId: string): Promise<void> {
  await pool.query(
    `UPDATE users
     SET two_factor_enabled = false,
         two_factor_secret_encrypted = NULL,
         two_factor_backup_codes = NULL,
         updated_at = NOW()
     WHERE id = $1`,
    [userId],
  );
}

export async function updateUserPassword(userId: string, passwordHash: string): Promise<void> {
  await pool.query(
    `UPDATE users
     SET password_hash = $1,
         updated_at = NOW()
     WHERE id = $2`,
    [passwordHash, userId],
  );
}

export async function updateUserTwoFactorBackupCodes(userId: string, backupCodesHash: string[]): Promise<void> {
  await pool.query(
    `UPDATE users
     SET two_factor_backup_codes = $1,
         updated_at = NOW()
     WHERE id = $2`,
    [backupCodesHash, userId],
  );
}

export async function getUsersByDepartment(department: string): Promise<User[]> {
  const result = await pool.query('SELECT * FROM users WHERE department = $1 AND is_active = true', [department]);
  return result.rows;
}

// ============= PAYMENT REQUESTS QUERIES =============

export async function createPaymentRequest(
  userId: string,
  documentType: string,
  amount: number,
  supplierName: string,
  supplierDocument: string,
  dueDate: Date,
  documentUrl: string,
  notes?: string,
): Promise<PaymentRequest> {
  const id = uuidv4();
  const requestNumber = `REQ-${Date.now()}`;

  const result = await pool.query(
    `INSERT INTO payment_requests 
    (id, request_number, user_id, document_type, amount, supplier_name, supplier_document, due_date, document_url, notes, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pendente_validacao')
    RETURNING *`,
    [id, requestNumber, userId, documentType, amount, supplierName, supplierDocument, dueDate, documentUrl, notes],
  );

  return result.rows[0];
}

export async function getPaymentRequestById(id: string): Promise<PaymentRequest | null> {
  const result = await pool.query('SELECT * FROM payment_requests WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function getPaymentRequestByIdentifier(identifier: string): Promise<PaymentRequest | null> {
  const trimmedIdentifier = identifier.trim();

  if (!trimmedIdentifier) {
    return null;
  }

  const requestNumberCandidates = new Set<string>([trimmedIdentifier]);
  if (!trimmedIdentifier.startsWith('REQ-')) {
    requestNumberCandidates.add(`REQ-${trimmedIdentifier}`);
  }

  const requestNumberList = Array.from(requestNumberCandidates);
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  const result = await pool.query(
    `SELECT *
     FROM payment_requests
      WHERE (CASE WHEN $1::text ~* $2 THEN id = $1::uuid ELSE FALSE END)
        OR request_number = ANY($3::text[])
     ORDER BY created_at DESC
     LIMIT 1`,
    [trimmedIdentifier, uuidPattern.source, requestNumberList],
  );

  return result.rows[0] || null;
}

export async function getPaymentRequestsByStatus(status: string, limit = 50, offset = 0): Promise<PaymentRequest[]> {
  const result = await pool.query(
    'SELECT * FROM payment_requests WHERE status = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
    [status, limit, offset],
  );
  return result.rows;
}

export async function getPaymentRequestsByUser(userId: string): Promise<PaymentRequest[]> {
  const result = await pool.query('SELECT * FROM payment_requests WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
  return result.rows;
}

export async function getAllPaymentRequests(limit = 50, offset = 0): Promise<PaymentRequest[]> {
  const result = await pool.query(
    'SELECT * FROM payment_requests ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset],
  );
  return result.rows;
}

export async function getPaymentRequestsReadyForPayment(limit = 50, offset = 0): Promise<Array<PaymentRequest & {
  bank_name: string | null;
  bank_branch: string | null;
  bank_account: string | null;
  supplier_status: string | null;
}>> {
  const result = await pool.query(
    `SELECT
       pr.*,
       s.bank_name,
       s.bank_branch,
       s.bank_account,
       s.status AS supplier_status
     FROM payment_requests pr
     LEFT JOIN suppliers s
       ON COALESCE(
            NULLIF(regexp_replace(pr.supplier_document, '\\D', '', 'g'), ''),
            UPPER(regexp_replace(pr.supplier_document, '[^0-9A-Za-z]', '', 'g'))
          ) = s.document_normalized
     WHERE pr.status = 'validado'
     ORDER BY pr.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset],
  );
  return result.rows;
}

export async function updatePaymentRequestStatus(id: string, status: string): Promise<PaymentRequest> {
  const result = await pool.query(
    'UPDATE payment_requests SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [status, id],
  );
  return result.rows[0];
}

export async function getPaymentRequestsCountByStatus(status: string): Promise<number> {
  const result = await pool.query('SELECT COUNT(*) as count FROM payment_requests WHERE status = $1', [status]);
  return parseInt(result.rows[0].count, 10);
}

// ============= PAYMENT WORKFLOW QUERIES =============

export async function createWorkflowEntry(
  paymentRequestId: string,
  action: string,
  performedBy: string,
  statusFrom: string | null,
  statusTo: string,
  comments?: string,
): Promise<PaymentWorkflow> {
  const id = uuidv4();

  const result = await pool.query(
    `INSERT INTO payment_workflows 
    (id, payment_request_id, action, performed_by, status_from, status_to, comments)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [id, paymentRequestId, action, performedBy, statusFrom, statusTo, comments],
  );

  return result.rows[0];
}

export async function getWorkflowHistory(paymentRequestId: string): Promise<PaymentWorkflow[]> {
  const result = await pool.query(
    'SELECT * FROM payment_workflows WHERE payment_request_id = $1 ORDER BY created_at ASC',
    [paymentRequestId],
  );
  return result.rows;
}

// ============= AUDIT LOG QUERIES =============

export async function createAuditLog(
  userId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  changes?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string,
): Promise<AuditLog> {
  const id = uuidv4();

  const result = await pool.query(
    `INSERT INTO audit_logs 
    (id, user_id, action, entity_type, entity_id, changes, ip_address, user_agent)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [id, userId, action, entityType, entityId, JSON.stringify(changes), ipAddress, userAgent],
  );

  return result.rows[0];
}

export async function getAuditLogs(limit = 100, offset = 0): Promise<AuditLog[]> {
  const result = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
  return result.rows;
}

export async function getAuditLogsByUser(userId: string, limit = 100): Promise<AuditLog[]> {
  const result = await pool.query('SELECT * FROM audit_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2', [
    userId,
    limit,
  ]);
  return result.rows;
}

// ============= FASE 2: APPROVAL RULES QUERIES =============

export async function getApprovalRuleByAmount(amount: number): Promise<ApprovalRule | null> {
  const result = await pool.query(
    'SELECT * FROM approval_rules WHERE $1 BETWEEN min_amount AND max_amount AND is_active = true LIMIT 1',
    [amount]
  );
  return result.rows[0] || null;
}

export async function getAllApprovalRules(): Promise<ApprovalRule[]> {
  const result = await pool.query(
    'SELECT * FROM approval_rules WHERE is_active = true ORDER BY min_amount ASC'
  );
  return result.rows;
}

// ============= FASE 2: PAYMENT APPROVALS QUERIES =============

export async function createPaymentApproval(
  paymentRequestId: string,
  approverId: string,
  approvalOrder: number,
  decision: 'aprovado' | 'rejeitado',
  comments?: string
): Promise<PaymentApproval> {
  const id = uuidv4();
  const result = await pool.query(
    `INSERT INTO payment_approvals 
    (id, payment_request_id, approver_id, approval_order, decision, comments)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [id, paymentRequestId, approverId, approvalOrder, decision, comments]
  );
  return result.rows[0];
}

export async function getPaymentApprovals(paymentRequestId: string): Promise<PaymentApproval[]> {
  const result = await pool.query(
    'SELECT * FROM payment_approvals WHERE payment_request_id = $1 ORDER BY approval_order ASC',
    [paymentRequestId]
  );
  return result.rows;
}

export async function getApprovalByOrder(paymentRequestId: string, order: number): Promise<PaymentApproval | null> {
  const result = await pool.query(
    'SELECT * FROM payment_approvals WHERE payment_request_id = $1 AND approval_order = $2',
    [paymentRequestId, order]
  );
  return result.rows[0] || null;
}

export async function updatePaymentRequestApprovers(
  id: string,
  firstApproverId?: string,
  secondApproverId?: string,
  requiresDouble?: boolean
): Promise<void> {
  let query = 'UPDATE payment_requests SET updated_at = NOW()';
  const params: Array<string | boolean | undefined> = [];
  let paramCount = 0;

  if (firstApproverId !== undefined) {
    paramCount++;
    query += `, first_approver_id = $${paramCount}`;
    params.push(firstApproverId);
  }

  if (secondApproverId !== undefined) {
    paramCount++;
    query += `, second_approver_id = $${paramCount}`;
    params.push(secondApproverId);
  }

  if (requiresDouble !== undefined) {
    paramCount++;
    query += `, requires_double_approval = $${paramCount}`;
    params.push(requiresDouble);
  }

  paramCount++;
  query += ` WHERE id = $${paramCount}`;
  params.push(id);

  await pool.query(query, params);
}

export async function markApprovalCompleted(id: string): Promise<void> {
  await pool.query(
    'UPDATE payment_requests SET approval_completed_at = NOW() WHERE id = $1',
    [id]
  );
}

// ============= FASE 2: COMPLIANCE CHECKLIST QUERIES =============

export async function getDefaultChecklistTemplate(): Promise<ComplianceChecklistTemplate | null> {
  const result = await pool.query(
    'SELECT * FROM compliance_checklist_templates WHERE is_active = true ORDER BY created_at ASC LIMIT 1'
  );
  return result.rows[0] || null;
}

export async function createPaymentChecklist(
  paymentRequestId: string,
  templateId: string
): Promise<PaymentComplianceChecklist> {
  const id = uuidv4();
  const result = await pool.query(
    `INSERT INTO payment_compliance_checklists 
    (id, payment_request_id, template_id, checked_items)
    VALUES ($1, $2, $3, '[]'::jsonb)
    RETURNING *`,
    [id, paymentRequestId, templateId]
  );
  return result.rows[0];
}

export async function getPaymentChecklist(paymentRequestId: string): Promise<PaymentComplianceChecklist | null> {
  const result = await pool.query(
    'SELECT * FROM payment_compliance_checklists WHERE payment_request_id = $1',
    [paymentRequestId]
  );
  return result.rows[0] || null;
}

export async function updateChecklistItems(
  paymentRequestId: string,
  checkedItems: string[],
  checkedBy: string
): Promise<void> {
  await pool.query(
    `UPDATE payment_compliance_checklists 
    SET checked_items = $1, checked_by = $2, updated_at = NOW()
    WHERE payment_request_id = $3`,
    [JSON.stringify(checkedItems), checkedBy, paymentRequestId]
  );
}

export async function completeChecklist(paymentRequestId: string): Promise<void> {
  await pool.query(
    `UPDATE payment_compliance_checklists 
    SET completed_at = NOW() 
    WHERE payment_request_id = $1`,
    [paymentRequestId]
  );
}

// ============= FASE 2: SUPPLIER BLOCKLIST QUERIES =============

export async function checkSupplierBlocklist(supplierDocument: string): Promise<SupplierBlocklist | null> {
  const result = await pool.query(
    'SELECT * FROM supplier_blocklist WHERE supplier_document = $1 AND is_active = true',
    [supplierDocument]
  );
  return result.rows[0] || null;
}

export async function addToBlocklist(
  supplierDocument: string,
  supplierName: string,
  reason: string,
  blockedBy: string
): Promise<SupplierBlocklist> {
  const id = uuidv4();
  const result = await pool.query(
    `INSERT INTO supplier_blocklist 
    (id, supplier_document, supplier_name, reason, blocked_by)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
    [id, supplierDocument, supplierName, reason, blockedBy]
  );
  return result.rows[0];
}

export async function listSupplierBlocklist(): Promise<SupplierBlocklist[]> {
  const result = await pool.query(
    `SELECT id, supplier_document, supplier_name, reason, blocked_by, is_active, created_at, removed_at
     FROM supplier_blocklist
     ORDER BY created_at DESC`,
  );

  return result.rows;
}

export async function markPaymentAsBlocklisted(
  id: string,
  reason: string
): Promise<void> {
  await pool.query(
    'UPDATE payment_requests SET supplier_blocklisted = true, blocklist_reason = $1 WHERE id = $2',
    [reason, id]
  );
}

export async function updatePaymentClosureInfo(
  id: string,
  closedBy: string,
  closeReason?: string,
  closeEvidenceUrl?: string
): Promise<void> {
  await pool.query(
    `UPDATE payment_requests 
    SET closed_by = $1, closed_at = NOW(), close_reason = $2, close_evidence_url = $3
    WHERE id = $4`,
    [closedBy, closeReason, closeEvidenceUrl, id]
  );
}

// ============= DATA GOVERNANCE QUERIES =============

export interface RetentionDocumentCandidate {
  id: string;
  document_url: string;
  request_number: string;
  status: string;
  created_at: Date;
}

export interface UploadReference {
  id: string;
  request_number: string;
  document_url: string;
  created_at: Date;
}

export async function getRetentionDocumentCandidates(
  cutoffDate: Date,
  statuses: string[],
  limit: number,
): Promise<RetentionDocumentCandidate[]> {
  const result = await pool.query(
    `SELECT id, request_number, document_url, status, created_at
     FROM payment_requests
     WHERE created_at < $1
       AND status = ANY($2)
       AND document_url LIKE '/uploads/%'
       AND document_url <> '/uploads/retention-removed'
     ORDER BY created_at ASC
     LIMIT $3`,
    [cutoffDate, statuses, limit],
  );

  return result.rows;
}

export async function markDocumentAsRetentionRemoved(paymentRequestId: string): Promise<void> {
  await pool.query(
    `UPDATE payment_requests
     SET document_url = '/uploads/retention-removed',
         notes = CASE
           WHEN notes IS NULL OR notes = '' THEN '[RETENTION] Documento removido por política de retenção.'
           WHEN notes LIKE '%[RETENTION] Documento removido por política de retenção.%' THEN notes
           ELSE notes || E'\n[RETENTION] Documento removido por política de retenção.'
         END,
         updated_at = NOW()
     WHERE id = $1`,
    [paymentRequestId],
  );
}

export async function getRecentUploadReferences(sinceDate: Date, limit: number): Promise<UploadReference[]> {
  const result = await pool.query(
    `SELECT id, request_number, document_url, created_at
     FROM payment_requests
     WHERE created_at >= $1
       AND document_url LIKE '/uploads/%'
       AND document_url <> '/uploads/retention-removed'
     ORDER BY created_at DESC
     LIMIT $2`,
    [sinceDate, limit],
  );

  return result.rows;
}

export async function deleteExpiredPersonalDataExports(limit: number): Promise<number> {
  const result = await pool.query(
    `WITH target AS (
       SELECT id
       FROM personal_data_exports
       WHERE expires_at IS NOT NULL
         AND expires_at < NOW()
       ORDER BY expires_at ASC
       LIMIT $1
     )
     DELETE FROM personal_data_exports pde
     USING target
     WHERE pde.id = target.id
     RETURNING pde.id`,
    [limit],
  );

  return result.rowCount || 0;
}

