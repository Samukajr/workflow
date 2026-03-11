import { pool } from '../config/database';
import logger from '../utils/logger';

/**
 * Criar tabela de tokens de reset de senha
 * 
 * Tokens são:
 * - SHA-256 hasheados no banco
 * - Válidos por 1 hora
 * - De uso único (invalidados após uso)
 */
export async function createPasswordResetTable(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(64) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        used_at TIMESTAMP,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
    `);

    logger.info('✅ Tabela password_reset_tokens criada com sucesso');
  } catch (error: unknown) {
    if ((error as { code?: string }).code === '42P07') {
      logger.info('Tabela password_reset_tokens já existe');
    } else {
      logger.error('Erro ao criar tabela password_reset_tokens:', error);
      throw error;
    }
  }
}

/**
 * Limpar tokens expirados (executar periodicamente)
 */
export async function cleanExpiredTokens(): Promise<void> {
  try {
    const result = await pool.query(`
      DELETE FROM password_reset_tokens
      WHERE expires_at < NOW() OR used = TRUE
    `);

    logger.info(`🧹 Limpeza de tokens: ${result.rowCount} tokens removidos`);
  } catch (error) {
    logger.error('Erro ao limpar tokens expirados:', error);
  }
}
