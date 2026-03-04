import { pool } from '../config/database';
import { User, PaymentRequest, PaymentWorkflow, AuditLog } from '../types';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

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

export async function getPaymentRequestsByStatus(status: string, limit: number = 50, offset: number = 0): Promise<PaymentRequest[]> {
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

export async function getAllPaymentRequests(limit: number = 50, offset: number = 0): Promise<PaymentRequest[]> {
  const result = await pool.query(
    'SELECT * FROM payment_requests ORDER BY created_at DESC LIMIT $1 OFFSET $2',
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

export async function getAuditLogs(limit: number = 100, offset: number = 0): Promise<AuditLog[]> {
  const result = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
  return result.rows;
}

export async function getAuditLogsByUser(userId: string, limit: number = 100): Promise<AuditLog[]> {
  const result = await pool.query('SELECT * FROM audit_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2', [
    userId,
    limit,
  ]);
  return result.rows;
}
