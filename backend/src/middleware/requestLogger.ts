import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Middleware para logar requisições com IP, User-Agent e detalhes
 * Importante para auditoria e detecção de atividades suspeitas
 */
export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.get('user-agent') || 'unknown';
  const userId = req.user?.id || 'anonymous';

  // Interceptar o envio da resposta
  const originalSend = res.send;

  res.send = function (data: unknown) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Logar requisição completada
    const logData = {
      method: req.method,
      path: req.path,
      statusCode,
      duration: `${duration}ms`,
      clientIp,
      userAgent: userAgent.substring(0, 100), // Limitar tamanho
      userId,
      timestamp: new Date().toISOString(),
    };

    // Logar requisições de sucesso
    if (statusCode < 400) {
      logger.info(logData, `${req.method} ${req.path} - ${statusCode}`);
    }
    // Logar erros 4xx/5xx com prioridade
    else if (statusCode >= 400) {
      logger.warn(logData, `${req.method} ${req.path} - ${statusCode}`);
    }

    // Alertar sobre padrões suspeitos
    if (statusCode === 401 || statusCode === 403) {
      logger.warn(
        {
          ...logData,
          reason: 'Tentativa de acesso não autorizado',
        },
        `SEGURANÇA: Acesso negado - ${req.method} ${req.path}`,
      );
    }

    return originalSend.call(this, data);
  };

  next();
}
