import dotenv from 'dotenv';

dotenv.config();

const dataGovernanceEnabledRaw = process.env.DATA_GOVERNANCE_ENABLED;
const dataGovernanceDefault = (process.env.NODE_ENV || 'development') === 'production';

export const env = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  API_URL: process.env.API_URL || 'http://localhost:3000',
  TRUST_PROXY: process.env.TRUST_PROXY === 'true',
  CORS_ALLOWED_ORIGINS: (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
  DB_NAME: process.env.DB_NAME || 'workflow_pagamentos',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'password',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'seu_jwt_secret_muito_seguro_aqui',
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || '24h',

  // File Upload
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),

  // Email Configuration
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || '',
  APP_NAME: process.env.APP_NAME || 'Sistema de Workflow',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

  // SMS Configuration
  SMS_ENABLED: process.env.SMS_ENABLED === 'true',
  SMS_PROVIDER: process.env.SMS_PROVIDER || 'webhook',
  SMS_WEBHOOK_URL: process.env.SMS_WEBHOOK_URL || '',
  SMS_WEBHOOK_TOKEN: process.env.SMS_WEBHOOK_TOKEN || '',
  SMS_FALLBACK_PHONE: process.env.SMS_FALLBACK_PHONE || '',

  // LGPD & Security
  SESSION_TIMEOUT: parseInt(process.env.SESSION_TIMEOUT || '3600', 10),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  ENABLE_AUDIT_LOG: process.env.ENABLE_AUDIT_LOG === 'true',
  HEALTHCHECK_DB_TIMEOUT_MS: parseInt(process.env.HEALTHCHECK_DB_TIMEOUT_MS || '3000', 10),

  // Data Governance & Retention
  DATA_GOVERNANCE_ENABLED:
    dataGovernanceEnabledRaw !== undefined ? dataGovernanceEnabledRaw === 'true' : dataGovernanceDefault,
  DATA_GOVERNANCE_INTERVAL_HOURS: parseInt(process.env.DATA_GOVERNANCE_INTERVAL_HOURS || '24', 10),
  PAYMENT_DOCUMENT_RETENTION_YEARS: parseInt(process.env.PAYMENT_DOCUMENT_RETENTION_YEARS || '10', 10),
  DATA_RETENTION_BATCH_SIZE: parseInt(process.env.DATA_RETENTION_BATCH_SIZE || '200', 10),
  INTEGRITY_SCAN_DAYS: parseInt(process.env.INTEGRITY_SCAN_DAYS || '30', 10),
};

// Validação de variáveis críticas
const requiredEnvVars = ['JWT_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar] && process.env.NODE_ENV === 'production') {
    throw new Error(`Variável de ambiente obrigatória não configurada: ${envVar}`);
  }
}

if (process.env.NODE_ENV === 'production') {
  const jwtSecret = process.env.JWT_SECRET || '';
  const isDefaultSecret = jwtSecret.includes('seu_jwt_secret_muito_seguro_aqui');

  if (jwtSecret.length < 32 || isDefaultSecret) {
    throw new Error('JWT_SECRET inseguro para produção. Use um segredo forte com pelo menos 32 caracteres.');
  }
}
