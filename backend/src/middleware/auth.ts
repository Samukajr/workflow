import { Response, NextFunction, Request } from 'express';
import { verifyToken } from '../utils/jwt';
import { UserToken } from '../types';
import logger from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      user?: UserToken;
    }
  }
}

const PRIVILEGED_DEPARTMENTS = new Set(['admin', 'superadmin']);

export function hasDepartmentAccess(userDepartment: string, allowedDepartments: string[]): boolean {
  if (PRIVILEGED_DEPARTMENTS.has(userDepartment)) {
    return true;
  }

  return allowedDepartments.includes(userDepartment);
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.get('user-agent') || 'unknown';

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn(
      {
        path: req.path,
        clientIp,
        userAgent: userAgent.substring(0, 100),
        timestamp: new Date().toISOString(),
      },
      '⚠️ Tentativa sem token',
    );
    res.status(401).json({
      success: false,
      message: 'Token de autenticação não fornecido',
    });
    return;
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    logger.warn(
      {
        path: req.path,
        clientIp,
        timestamp: new Date().toISOString(),
      },
      '⚠️ Token inválido ou expirado',
    );
    res.status(401).json({
      success: false,
      message: 'Token inválido ou expirado',
    });
    return;
  }

  req.user = decoded;
  next();
}

export function requireDepartment(...departments: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Não autenticado',
      });
      return;
    }

    if (!hasDepartmentAccess(req.user.department, departments)) {
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      logger.warn(
        {
          userId: req.user.id,
          userDepartment: req.user.department,
          requiredDepartment: departments.join(', '),
          path: req.path,
          clientIp,
          timestamp: new Date().toISOString(),
        },
        '❌ ACESSO NEGADO: Departamento sem permissão',
      );
      res.status(403).json({
        success: false,
        message: 'Acesso negado: departamento sem permissão',
      });
      return;
    }

    next();
  };
}

export function requireSuperadmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Não autenticado',
    });
    return;
  }

  if (req.user.department !== 'superadmin') {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    logger.warn(
      {
        userId: req.user.id,
        userDepartment: req.user.department,
        path: req.path,
        clientIp,
        timestamp: new Date().toISOString(),
      },
      '❌ ACESSO NEGADO: operação exclusiva para superadmin',
    );

    res.status(403).json({
      success: false,
      message: 'Acesso negado: operação exclusiva para superadmin',
    });
    return;
  }

  next();
}
