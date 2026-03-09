import dotenv from 'dotenv';

dotenv.config();

export const env = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  API_URL: process.env.API_URL || 'http://localhost:3000',

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

  // LGPD & Security
  SESSION_TIMEOUT: parseInt(process.env.SESSION_TIMEOUT || '3600', 10),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  ENABLE_AUDIT_LOG: process.env.ENABLE_AUDIT_LOG === 'true',
};

// Validação de variáveis críticas
const requiredEnvVars = ['JWT_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar] && process.env.NODE_ENV === 'production') {
    throw new Error(`Variável de ambiente obrigatória não configurada: ${envVar}`);
  }
}
