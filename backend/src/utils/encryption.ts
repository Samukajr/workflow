import crypto from 'crypto';
import logger from './logger';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-96-chars-minimum';
const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypt sensitive bank credentials
 */
export function encryptCredential(plaintext: string): string {
  try {
    const key = crypto
      .createHash('sha256')
      .update(ENCRYPTION_KEY)
      .digest();
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    logger.error('Erro ao criptografar credencial:', error);
    throw new Error('Falha na criptografia de credencial');
  }
}

/**
 * Decrypt sensitive bank credentials
 */
export function decryptCredential(encrypted: string): string {
  try {
    const [ivHex, authTagHex, encryptedData] = encrypted.split(':');
    
    const key = crypto
      .createHash('sha256')
      .update(ENCRYPTION_KEY)
      .digest();
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    logger.error('Erro ao descriptografar credencial:', error);
    throw new Error('Falha na descriptografia de credencial');
  }
}

/**
 * Generate webhook signature for verification
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expected = generateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected),
  );
}
