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
  } catch (err: any) {
    throw new ErrorHandler(400, err.message);
  }
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = loginSchema.validate(req.body);

  if (error) {
    throw new ErrorHandler(400, error.details[0].message);
  }

  try {
    const { user, token } = await authService.loginUser(value.email, value.password);

    logger.info(`Usuário autenticado: ${user.email}`);

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
  } catch (err: any) {
    throw new ErrorHandler(401, err.message);
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
