import { pool } from '../config/database';
import logger from '../utils/logger';

export async function runBankingMigrations(): Promise<void> {
  try {
    logger.info('🏦 Iniciando migrações de integração bancária...');

    // 1. Tabela de integrações bancárias
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bank_integrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        bank_type VARCHAR(50) NOT NULL CHECK (bank_type IN ('inter', 'bankaool', 'b20', 'open_banking', 'manual')),
        name VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        api_key_encrypted VARCHAR(1024),
        api_secret_encrypted VARCHAR(1024),
        client_id VARCHAR(255),
        client_secret_encrypted VARCHAR(1024),
        account_id VARCHAR(255),
        webhook_url VARCHAR(500),
        webhook_token_encrypted VARCHAR(1024),
        webhook_secret_encrypted VARCHAR(1024),
        supported_methods TEXT[], -- ARRAY of payment methods: ted, pix, boleto, transferencia
        last_sync_at TIMESTAMP WITH TIME ZONE,
        error_log TEXT,
        created_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 2. Tabela de eventos de webhook
    await pool.query(`
      CREATE TABLE IF NOT EXISTS webhook_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        bank_integration_id UUID NOT NULL REFERENCES bank_integrations(id) ON DELETE CASCADE,
        event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('payment_confirmed', 'payment_rejected', 'payment_cancelled', 'payment_pending', 'reconciliation_required')),
        payment_request_id UUID REFERENCES payment_requests(id),
        external_payment_id VARCHAR(255),
        event_data JSONB NOT NULL,
        signature_verified BOOLEAN DEFAULT false,
        processed BOOLEAN DEFAULT false,
        processed_at TIMESTAMP WITH TIME ZONE,
        error TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 3. Tabela de reconciliação de pagamentos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_reconciliations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        payment_request_id UUID NOT NULL REFERENCES payment_requests(id),
        bank_integration_id UUID NOT NULL REFERENCES bank_integrations(id),
        external_payment_id VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL CHECK (status IN ('pendente', 'confirmado', 'divergencia', 'falha')),
        local_amount DECIMAL(15, 2) NOT NULL,
        bank_amount DECIMAL(15, 2),
        local_date TIMESTAMP WITH TIME ZONE NOT NULL,
        bank_date TIMESTAMP WITH TIME ZONE,
        bank_status VARCHAR(100),
        divergence_reason TEXT,
        resolved_at TIMESTAMP WITH TIME ZONE,
        resolved_by UUID REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(payment_request_id, external_payment_id)
      );
    `);

    // 4. Estender payment_requests com referência de integração bancária
    await pool.query(`
      ALTER TABLE payment_requests
      ADD COLUMN IF NOT EXISTS bank_integration_id UUID REFERENCES bank_integrations(id),
      ADD COLUMN IF NOT EXISTS external_payment_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
      ADD COLUMN IF NOT EXISTS payment_initiated_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMP WITH TIME ZONE;
    `);

    // 5. Criar índices para performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_webhook_events_bank_integration ON webhook_events(bank_integration_id);
      CREATE INDEX IF NOT EXISTS idx_webhook_events_payment_request ON webhook_events(payment_request_id);
      CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
      CREATE INDEX IF NOT EXISTS idx_reconciliation_status ON payment_reconciliations(status);
      CREATE INDEX IF NOT EXISTS idx_reconciliation_payment_request ON payment_reconciliations(payment_request_id);
      CREATE INDEX IF NOT EXISTS idx_payment_requests_bank_integration ON payment_requests(bank_integration_id);
      CREATE INDEX IF NOT EXISTS idx_payment_requests_external_payment_id ON payment_requests(external_payment_id);
    `);

    logger.info('✅ Migrações bancárias concluídas com sucesso');
  } catch (error) {
    logger.error('❌ Erro ao executar migrações bancárias:', error);
    throw error;
  }
}

export async function rollbackBankingMigrations(): Promise<void> {
  try {
    logger.info('🔄 Revertendo migrações de integração bancária...');

    await pool.query(`
      ALTER TABLE payment_requests
      DROP COLUMN IF EXISTS bank_integration_id,
      DROP COLUMN IF EXISTS external_payment_id,
      DROP COLUMN IF EXISTS payment_method,
      DROP COLUMN IF EXISTS payment_initiated_at,
      DROP COLUMN IF EXISTS payment_confirmed_at;
    `);

    await pool.query(`DROP TABLE IF EXISTS payment_reconciliations;`);
    await pool.query(`DROP TABLE IF EXISTS webhook_events;`);
    await pool.query(`DROP TABLE IF EXISTS bank_integrations;`);

    logger.info('✅ Reversão de migrações bancárias concluída');
  } catch (error) {
    logger.error('❌ Erro ao reverter migrações bancárias:', error);
    throw error;
  }
}
