import crypto from 'crypto';
import { pool } from '../config/database';
import logger from '../utils/logger';
import { hashPassword } from '../utils/password';
import { sendPasswordResetEmail } from './emailService';

interface CreateResetTokenParams {
  email: string;
  ipAddress: string;
  userAgent: string;
}

interface ResetPasswordParams {
  token: string;
  newPassword: string;
  ipAddress: string;
  userAgent: string;
}

/**
 * Gerar token aleatório de 32 bytes
 */
function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash do token para armazenar no banco
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Solicitar reset de senha - Envia email com token
 */
export async function requestPasswordReset({
  email,
  ipAddress,
  userAgent,
}: CreateResetTokenParams): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Buscar usuário pelo email
    const userResult = await pool.query(
      'SELECT id, name, email FROM users WHERE email = $1 AND is_active = TRUE',
      [email.toLowerCase()]
    );

    // Sempre retornar sucesso (evitar enumeração de emails)
    if (userResult.rows.length === 0) {
      logger.warn(`⚠️ Tentativa de reset para email não cadastrado: ${email} (IP: ${ipAddress})`);
      return {
        success: true,
        message: 'Se o email existir, um link de recuperação será enviado.',
      };
    }

    const user = userResult.rows[0];

    // 2. Verificar se já existe token válido recente (últimos 5 minutos)
    const recentTokenResult = await pool.query(
      `SELECT id FROM password_reset_tokens 
       WHERE user_id = $1 
       AND created_at > NOW() - INTERVAL '5 minutes'
       AND used = FALSE
       LIMIT 1`,
      [user.id]
    );

    if (recentTokenResult.rows.length > 0) {
      logger.warn(`⚠️ Token já enviado recentemente para: ${email} (IP: ${ipAddress})`);
      return {
        success: true,
        message: 'Se o email existir, um link de recuperação será enviado.',
      };
    }

    // 3. Gerar token
    const resetToken = generateResetToken();
    const tokenHash = hashToken(resetToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // 4. Salvar token no banco
    await pool.query(
      `INSERT INTO password_reset_tokens 
       (user_id, token_hash, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, tokenHash, expiresAt, ipAddress, userAgent.substring(0, 500)]
    );

    // 5. Enviar email
    await sendPasswordResetEmail({
      to: user.email,
      userName: user.name,
      resetToken: resetToken,
    });

    logger.info(`✅ Token de reset gerado para: ${email} (IP: ${ipAddress})`);

    return {
      success: true,
      message: 'Se o email existir, um link de recuperação será enviado.',
    };
  } catch (error) {
    logger.error('Erro ao solicitar reset de senha:', error);
    throw new Error('Erro ao processar solicitação de reset');
  }
}

/**
 * Verificar se token é válido
 */
export async function validateResetToken(token: string): Promise<{
  valid: boolean;
  userId?: string;
  message?: string;
}> {
  try {
    const tokenHash = hashToken(token);

    const result = await pool.query(
      `SELECT user_id, expires_at, used 
       FROM password_reset_tokens 
       WHERE token_hash = $1`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return { valid: false, message: 'Token inválido ou não encontrado' };
    }

    const tokenData = result.rows[0];

    if (tokenData.used) {
      return { valid: false, message: 'Este token já foi utilizado' };
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      return { valid: false, message: 'Token expirado. Solicite um novo link.' };
    }

    return { valid: true, userId: tokenData.user_id };
  } catch (error) {
    logger.error('Erro ao validar token:', error);
    return { valid: false, message: 'Erro ao validar token' };
  }
}

/**
 * Redefinir senha usando token
 */
export async function resetPassword({
  token,
  newPassword,
  ipAddress,
  userAgent,
}: ResetPasswordParams): Promise<{ success: boolean; message: string }> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Validar token
    const validation = await validateResetToken(token);
    if (!validation.valid) {
      return { success: false, message: validation.message || 'Token inválido' };
    }

    if (!validation.userId) {
      return { success: false, message: 'Token inválido' };
    }

    const userId = validation.userId;

    // 2. Hash da nova senha
    const passwordHash = await hashPassword(newPassword);

    // 3. Atualizar senha do usuário
    await client.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, userId]
    );

    // 4. Marcar token como usado
    const tokenHash = hashToken(token);
    await client.query(
      `UPDATE password_reset_tokens 
       SET used = TRUE, used_at = NOW() 
       WHERE token_hash = $1`,
      [tokenHash]
    );

    // 5. Registrar auditoria (LGPD)
    await client.query(
      `INSERT INTO personal_data_audit 
       (user_id, action, description, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        userId,
        'password_reset',
        'Senha redefinida via token de recuperação',
        ipAddress,
        userAgent.substring(0, 500),
      ]
    );

    await client.query('COMMIT');

    logger.info(`✅ Senha redefinida com sucesso para user_id: ${userId} (IP: ${ipAddress})`);

    return {
      success: true,
      message: 'Senha redefinida com sucesso! Você já pode fazer login.',
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Erro ao redefinir senha:', error);
    throw new Error('Erro ao redefinir senha');
  } finally {
    client.release();
  }
}

/**
 * Invalidar todos os tokens de um usuário
 */
export async function invalidateUserTokens(userId: string): Promise<void> {
  try {
    await pool.query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE user_id = $1 AND used = FALSE',
      [userId]
    );
    logger.info(`🔒 Tokens invalidados para user_id: ${userId}`);
  } catch (error) {
    logger.error('Erro ao invalidar tokens:', error);
  }
}
