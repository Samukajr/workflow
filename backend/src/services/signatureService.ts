import crypto from 'crypto';
import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

export interface DocumentSignature {
  id: string;
  document_id: string;
  hash: string;
  signature: string;
  signed_at: string;
  signed_by: string;
  is_valid: boolean;
}

/**
 * Gerar hash criptográfico de um documento (SHA-256)
 * Garante integridade do documento conforme Lei 8.934/1994
 */
export function generateDocumentHash(documentContent: string | Buffer): string {
  const hash = crypto.createHash('sha256');

  if (typeof documentContent === 'string') {
    hash.update(documentContent);
  } else {
    hash.update(documentContent);
  }

  return hash.digest('hex');
}

/**
 * Gerar assinatura digital de um documento (usando hash + timestamp)
 * Implementação simplificada. Para produção, usar certificado digital X.509
 */
export function generateDocumentSignature(documentHash: string, secretKey: string): string {
  const timestamp = new Date().toISOString();
  const dataToSign = `${documentHash}:${timestamp}`;

  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(dataToSign)
    .digest('hex');

  return signature;
}

/**
 * Registrar assinatura de documento no banco de dados
 */
export async function registerDocumentSignature(
  documentId: string,
  documentHash: string,
  signedBy: string,
  secretKey: string,
): Promise<DocumentSignature> {
  const id = uuidv4();
  const signature = generateDocumentSignature(documentHash, secretKey);

  const result = await pool.query(
    `INSERT INTO document_signatures (id, document_id, hash, signature, signed_by, is_valid)
     VALUES ($1, $2, $3, $4, $5, true)
     RETURNING id, document_id, hash, signature, signed_at, signed_by, is_valid`,
    [id, documentId, documentHash, signature, signedBy],
  );

  logger.info(`Documento ${documentId} assinado digitalmente por ${signedBy}`);
  return result.rows[0];
}

/**
 * Verificar integridade de um documento assinado
 */
export function verifyDocumentSignature(
  documentHash: string,
  signature: string,
  secretKey: string,
  signedAt: string,
): boolean {
  try {
    // Reconstruir a assinatura esperada
    const dataToSign = `${documentHash}:${signedAt}`;
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(dataToSign)
      .digest('hex');

    // Comparação segura (previne timing attacks)
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch (error) {
    logger.warn('Erro ao verificar assinatura:', error);
    return false;
  }
}

/**
 * Obter histórico de assinaturas de um documento
 */
export async function getDocumentSignatureHistory(documentId: string): Promise<DocumentSignature[]> {
  const result = await pool.query(
    `SELECT id, document_id, hash, signature, signed_at, signed_by, is_valid
     FROM document_signatures
     WHERE document_id = $1
     ORDER BY signed_at DESC`,
    [documentId],
  );

  return result.rows;
}

/**
 * Validar assinatura armazenada contra hash atual
 */
export async function validateDocumentSignature(documentId: string, currentDocumentHash: string): Promise<boolean> {
  try {
    const result = await pool.query(
      `SELECT * FROM document_signatures
       WHERE document_id = $1 AND is_valid = true
       ORDER BY signed_at DESC
       LIMIT 1`,
      [documentId],
    );

    if (result.rows.length === 0) {
      logger.warn(`Nenhuma assinatura válida encontrada para documento ${documentId}`);
      return false;
    }

    const storedHash = result.rows[0].hash;

    // Se o hash não bate, o documento foi alterado
    if (storedHash !== currentDocumentHash) {
      logger.warn(`Documento ${documentId} foi alterado após assinatura!`);

      // Marcar assinatura como inválida
      await pool.query(
        `UPDATE document_signatures
         SET is_valid = false
         WHERE document_id = $1`,
        [documentId],
      );

      return false;
    }

    return true;
  } catch (error) {
    logger.error('Erro ao validar assinatura:', error);
    return false;
  }
}

/**
 * Criar tabela de assinaturas digitais no banco
 */
export async function createDocumentSignatureTable(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS document_signatures (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id UUID NOT NULL REFERENCES payment_requests(id) ON DELETE CASCADE,
        hash VARCHAR(64) NOT NULL, -- SHA-256 hash do documento
        signature VARCHAR(64) NOT NULL, -- HMAC-SHA256 da assinatura
        signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        signed_by UUID NOT NULL REFERENCES users(id),
        is_valid BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_signatures_document ON document_signatures(document_id);
      CREATE INDEX IF NOT EXISTS idx_signatures_validity ON document_signatures(is_valid);
    `);

    logger.info('Tabela de assinaturas digitais criada');
  } catch (error) {
    logger.error('Erro ao criar tabela de assinaturas:', error);
    throw error;
  }
}
