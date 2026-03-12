import { Request, Response } from 'express';
import * as authService from '../services/authService';
import { asyncHandler, ErrorHandler } from '../middleware/errorHandler';
import logger from '../utils/logger';
import Joi from 'joi';

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().required(),
  department: Joi.string().valid('financeiro', 'validacao', 'submissao', 'admin', 'superadmin').required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const twoFactorCodeSchema = Joi.object({
  code: Joi.string().trim().min(6).max(20).required(),
});

const twoFactorLoginSchema = Joi.object({
  challenge_token: Joi.string().required(),
  code: Joi.string().trim().min(6).max(20).required(),
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = registerSchema.validate(req.body);

  if (error) {
    throw new ErrorHandler(400, error.details[0].message);
  }

  try {
    const user = await authService.registerUser(value.email, value.password, value.name, value.department);

    logger.info(`Novo usuário registrado: ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'Usuário registrado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        department: user.department,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao registrar usuário';
    throw new ErrorHandler(400, message);
  }
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = loginSchema.validate(req.body);

  if (error) {
    throw new ErrorHandler(400, error.details[0].message);
  }

  try {
    const loginResult = await authService.loginUser(value.email, value.password);

    if (loginResult.requires_2fa) {
      logger.info(`Usuário autenticado (pendente 2FA): ${loginResult.user.email}`);

      res.status(200).json({
        success: true,
        message: '2FA necessário para concluir o login',
        requires_2fa: true,
        challenge_token: loginResult.challenge_token,
        user: {
          id: loginResult.user.id,
          email: loginResult.user.email,
          name: loginResult.user.name,
          department: loginResult.user.department,
        },
      });
      return;
    }

    logger.info(`Usuário autenticado: ${loginResult.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso',
      token: loginResult.token,
      user: {
        id: loginResult.user.id,
        email: loginResult.user.email,
        name: loginResult.user.name,
        department: loginResult.user.department,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha no login';
    throw new ErrorHandler(401, message);
  }
});

export const loginWithTwoFactor = asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = twoFactorLoginSchema.validate(req.body);

  if (error) {
    throw new ErrorHandler(400, error.details[0].message);
  }

  try {
    const { user, token } = await authService.completeTwoFactorLogin(value.challenge_token, value.code);

    logger.info(`Usuário autenticado com 2FA: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        department: user.department,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha na verificação 2FA';
    throw new ErrorHandler(401, message);
  }
});

export const getTwoFactorStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ErrorHandler(401, 'Não autenticado');
  }

  const status = await authService.getTwoFactorStatus(req.user.id);

  res.status(200).json({
    success: true,
    data: status,
  });
});

export const setupTwoFactor = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ErrorHandler(401, 'Não autenticado');
  }

  try {
    const data = await authService.setupTwoFactor(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Configuração 2FA iniciada. Confirme com um código do app autenticador.',
      data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao iniciar configuração 2FA';
    throw new ErrorHandler(400, message);
  }
});

export const verifyTwoFactorSetup = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ErrorHandler(401, 'Não autenticado');
  }

  const { error, value } = twoFactorCodeSchema.validate(req.body);

  if (error) {
    throw new ErrorHandler(400, error.details[0].message);
  }

  try {
    const result = await authService.verifyTwoFactorSetup(req.user.id, value.code);

    res.status(200).json({
      success: true,
      message: '2FA habilitado com sucesso',
      data: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao habilitar 2FA';
    throw new ErrorHandler(400, message);
  }
});

export const disableTwoFactor = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ErrorHandler(401, 'Não autenticado');
  }

  const { error, value } = twoFactorCodeSchema.validate(req.body);

  if (error) {
    throw new ErrorHandler(400, error.details[0].message);
  }

  try {
    await authService.disableTwoFactor(req.user.id, value.code);

    res.status(200).json({
      success: true,
      message: '2FA desabilitado com sucesso',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Falha ao desabilitar 2FA';
    throw new ErrorHandler(400, message);
  }
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ErrorHandler(401, 'Não autenticado');
  }

  const user = await authService.getUserInfo(req.user.id);

  if (!user) {
    throw new ErrorHandler(404, 'Usuário não encontrado');
  }

  res.status(200).json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      department: user.department,
      created_at: user.created_at,
    },
  });
});
