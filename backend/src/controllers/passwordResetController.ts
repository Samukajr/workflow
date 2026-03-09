import { Request, Response } from 'express';
import { requestPasswordReset, resetPassword, validateResetToken } from '../services/passwordResetService';
import logger from '../utils/logger';

/**
 * POST /api/auth/forgot-password
 * Solicitar email de recuperação de senha
 */
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Email é obrigatório',
      });
      return;
    }

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const result = await requestPasswordReset({
      email: email.trim(),
      ipAddress: clientIp,
      userAgent: userAgent,
    });

    // Sempre retorna 200 (evitar enumeração de emails)
    res.status(200).json(result);
  } catch (error) {
    logger.error('Erro no endpoint forgot-password:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar solicitação. Tente novamente.',
    });
  }
}

/**
 * POST /api/auth/validate-reset-token
 * Validar se token de reset é válido
 */
export async function validateToken(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.body;

    if (!token || typeof token !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Token é obrigatório',
      });
      return;
    }

    const validation = await validateResetToken(token);

    if (!validation.valid) {
      res.status(400).json({
        success: false,
        message: validation.message || 'Token inválido',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Token válido',
    });
  } catch (error) {
    logger.error('Erro ao validar token:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao validar token',
    });
  }
}

/**
 * POST /api/auth/reset-password
 * Redefinir senha com token válido
 */
export async function resetPasswordController(req: Request, res: Response): Promise<void> {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    // Validações
    if (!token || typeof token !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Token é obrigatório',
      });
      return;
    }

    if (!newPassword || typeof newPassword !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Nova senha é obrigatória',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'As senhas não coincidem',
      });
      return;
    }

    // Validar força da senha
    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'A senha deve ter no mínimo 6 caracteres',
      });
      return;
    }

    const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const result = await resetPassword({
      token: token.trim(),
      newPassword: newPassword,
      ipAddress: clientIp,
      userAgent: userAgent,
    });

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    logger.error('Erro no endpoint reset-password:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao redefinir senha. Tente novamente.',
    });
  }
}
