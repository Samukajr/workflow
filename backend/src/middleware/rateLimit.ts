import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import { env } from '../config/environment';

function getClientIdentifier(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function getAuthKey(req: Request): string {
  const client = getClientIdentifier(req);
  const body = req.body as Record<string, unknown> | undefined;
  const emailValue = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

  // Para login, evita que tentativas de um usuário bloqueiem todos no mesmo IP.
  if (req.path === '/login' && emailValue) {
    return `${client}:${emailValue}`;
  }

  return client;
}

/**
 * Rate limiter para endpoints de autenticação
 * Máximo 5 tentativas a cada 10 minutos por IP
 */
export const authLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  message: {
    success: false,
    message: 'Muitas tentativas de acesso. Aguarde antes de tentar novamente.',
    retryAfter: Math.ceil(env.AUTH_RATE_LIMIT_WINDOW_MS / 1000),
  },
  standardHeaders: true, // Retorna info em `RateLimit-*` headers
  legacyHeaders: false,
  skip: (_req) => env.NODE_ENV === 'development' || !env.AUTH_RATE_LIMIT_ENABLED,
  keyGenerator: (req) => getAuthKey(req),
});

/**
 * Rate limiter para recuperação de senha
 * Máximo 3 tentativas a cada hora por IP (evitar spam de emails)
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 requisições
  message: {
    success: false,
    message: 'Muitas solicitações de recuperação. Tente novamente em 1 hora.',
    retryAfter: 60 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req) => env.NODE_ENV === 'development',
  keyGenerator: (req) => {
    return getClientIdentifier(req);
  },
});

/**
 * Rate limiter para upload de arquivos
 * Máximo 10 uploads por minuto por usuário
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10,
  message: {
    success: false,
    message: 'Limite de upload excedido. Máximo 10 por minuto.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req) => env.NODE_ENV === 'development',
  keyGenerator: (req) => {
    // Se autenticado, usar ID do usuário. Se não, usar IP
    return req.user?.id || getClientIdentifier(req);
  },
});

/**
 * Rate limiter genérico para outras rotas
 * Máximo 100 requisições por 15 minutos por IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: {
    success: false,
    message: 'Muitas requisições. Tente novamente mais tarde.',
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (_req) => env.NODE_ENV === 'development',
  keyGenerator: (req) => {
    return getClientIdentifier(req);
  },
});
