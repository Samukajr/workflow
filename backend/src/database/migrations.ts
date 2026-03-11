import { pool } from '../config/database';
import logger from '../utils/logger';
import { createDocumentSignatureTable } from '../services/signatureService';
import { createPasswordResetTable } from './passwordResetMigrations';
import { applyPhase2Migrations } from './phase2Migrations';
import bcrypt from 'bcryptjs';

export async function initializeDatabase(): Promise<void> {
  try {
    // Criar tabela de assinaturas digitais
    await createDocumentSignatureTable();

    // Criar tabela de tokens de reset de senha
    await createPasswordResetTable();

    await pool.query(`
      -- Criar enum para departamentos (IF NOT EXISTS)
      DO $$ BEGIN
        CREATE TYPE department_enum AS ENUM ('financeiro', 'validacao', 'submissao');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
      
      -- Criar enum para status de requisições (IF NOT EXISTS)
      DO $$ BEGIN
        CREATE TYPE request_status_enum AS ENUM (
          'pendente_validacao', 'validado', 'rejeitado', 'em_pagamento', 'pago', 'cancelado'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      -- Criar enum para tipo de documento (IF NOT EXISTS)
      DO $$ BEGIN
        CREATE TYPE document_type_enum AS ENUM ('nf', 'boleto');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      -- Tabela de Usuários (LGPD)
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        department department_enum NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);

      -- FASE 3B: Coluna opcional para contato SMS
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30);

      -- Cadastro mestre de fornecedores
      CREATE TABLE IF NOT EXISTS suppliers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        supplier_name VARCHAR(255) NOT NULL,
        trade_name VARCHAR(255),
        supplier_type VARCHAR(120),
        document_raw VARCHAR(50) NOT NULL,
        document_normalized VARCHAR(20) NOT NULL UNIQUE,
        contact_name VARCHAR(255),
        contact_phone VARCHAR(120),
        company VARCHAR(255),
        city_state VARCHAR(255),
        status VARCHAR(50),
        bank_name VARCHAR(100),
        bank_branch VARCHAR(50),
        bank_account VARCHAR(100),
        source_file_name VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(supplier_name);
      CREATE INDEX IF NOT EXISTS idx_suppliers_trade_name ON suppliers(trade_name);
      CREATE INDEX IF NOT EXISTS idx_suppliers_company ON suppliers(company);
      CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active);

      -- Tabela de Requisições de Pagamento
      CREATE TABLE IF NOT EXISTS payment_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        request_number VARCHAR(50) NOT NULL UNIQUE,
        user_id UUID NOT NULL REFERENCES users(id),
        document_url VARCHAR(500) NOT NULL,
        document_type document_type_enum NOT NULL,
        status request_status_enum DEFAULT 'pendente_validacao',
        amount NUMERIC(15, 2) NOT NULL,
        supplier_name VARCHAR(255) NOT NULL,
        supplier_document VARCHAR(20) NOT NULL,
        due_date DATE NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_payment_requests_user_id ON payment_requests(user_id);
      CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
      CREATE INDEX IF NOT EXISTS idx_payment_requests_created_at ON payment_requests(created_at DESC);

      -- Tabela de Fluxo de Trabalho (Auditoria)
      CREATE TABLE IF NOT EXISTS payment_workflows (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        payment_request_id UUID NOT NULL REFERENCES payment_requests(id),
        action VARCHAR(50) NOT NULL,
        performed_by UUID NOT NULL REFERENCES users(id),
        status_from request_status_enum,
        status_to request_status_enum NOT NULL,
        comments TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_payment_workflows_payment_request_id ON payment_workflows(payment_request_id);
      CREATE INDEX IF NOT EXISTS idx_payment_workflows_performed_by ON payment_workflows(performed_by);

      -- Tabela de Log de Auditoria (LGPD)
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID,
        changes JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

      -- Tabela de Consentimento LGPD
      CREATE TABLE IF NOT EXISTS gdpr_consents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        consent_type VARCHAR(100) NOT NULL,
        given BOOLEAN DEFAULT TRUE,
        version VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, consent_type)
      );

      CREATE INDEX IF NOT EXISTS idx_gdpr_consents_user_id ON gdpr_consents(user_id);
    `);

    logger.info('Tabelas do banco de dados criadas com sucesso');
    
    // Aplicar migrações da Fase 2 (governança corporativa)
    await applyPhase2Migrations();
    
  } catch (error) {
    if ((error as { code?: string }).code === '42P07' || (error instanceof Error && error.message.includes('already exists'))) {
      logger.info('Tabelas já existem, saltando criação');
    } else {
      logger.error('Erro ao criar tabelas:', error);
      throw error;
    }
  }
}

export async function seedDatabase(): Promise<void> {
  try {
    // Verificar se já existem usuários
    const result = await pool.query('SELECT COUNT(*) as count FROM users');

    if (result.rows[0].count > 0) {
      logger.info('Dados já existem, saltando seed');
      return;
    }

    const demoPassword = await bcrypt.hash('DemoPass@123', 10);

    await pool.query(`
      INSERT INTO users (email, name, department, password_hash) VALUES
      ('submissao@empresa.com', 'João Submissão', 'submissao', $1),
      ('validacao@empresa.com', 'Maria Validação', 'validacao', $1),
      ('financeiro@empresa.com', 'Carlos Financeiro', 'financeiro', $1);
    `, [demoPassword]);

    logger.info('Dados de exemplo inseridos com sucesso');
  } catch (error) {
    logger.error('Erro ao fazer seed do banco de dados:', error);
    throw error;
  }
}
