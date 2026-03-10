import helmet from 'helmet';

/**
 * Configuração avançada do Helmet para proteção HTTP
 * Implementa headers de segurança recomendados pela OWASP
 */
export const helmetConfig = helmet({
  // Content Security Policy - Previne XSS e injeção de scripts
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Swagger precisa de unsafe-inline
      styleSrc: ["'self'", "'unsafe-inline'"], // CSS inline do Swagger
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: ['upgrade-insecure-requests'],
    },
  },

  // X-Frame-Options - Previne clickjacking
  frameguard: {
    action: 'deny',
  },

  // X-Content-Type-Options - Previne MIME type sniffing
  noSniff: true,

  // X-XSS-Protection - Legacy proteção contra XSS (older browsers)
  xssFilter: true,

  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 ano em segundos
    includeSubDomains: true,
    preload: true, // Adiciona a HSTS Preload List
  },

  // Referrer-Policy - Controla informação de referência
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },

  // Desabilitar X-Powered-By header
  hidePoweredBy: true,

  // Expect-CT removed in newer helmet versions, use report-uri instead
  // Permissions-Policy is handled by CSP headers in helmet 7.x
});

