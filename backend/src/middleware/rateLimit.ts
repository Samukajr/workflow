import rateLimit from 'express-rate-limit';
import { env } from '../config/environment';

/**
 * Rate limiter para endpoints de autenticação
 * Máximo 5 tentativas a cada 10 minutos por IP
 */
export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 5, // 5 requisições
  message: {
    success: false,
    message: 'Muitas tentativas de acesso. Tente novamente em 10 minutos.',
    retryAfter: 10 * 60,
  },
  standardHeaders: true, // Retorna info em `RateLimit-*` headers
  legacyHeaders: false,
  skip: (req) => env.NODE_ENV === 'development', // Desabilitar em development
  keyGenerator: (req) => {
    // Usar IP real (considerando proxies como Render)
    return req.ip || req.socket.remoteAddress || 'unknown';
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
  skip: (req) => env.NODE_ENV === 'development',
  keyGenerator: (req) => {
    // Se autenticado, usar ID do usuário. Se não, usar IP
    return req.user?.id || req.ip || req.socket.remoteAddress || 'unknown';
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
  skip: (req) => env.NODE_ENV === 'development',
  keyGenerator: (req) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
});
