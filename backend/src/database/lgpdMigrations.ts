import { pool } from '../config/database';
import logger from '../utils/logger';

/**
 * Migrações para suporte LGPD (Lei Geral de Proteção de Dados)
 */
export async function createLGPDTables(): Promise<void> {
  try {
    // Tabela de consentimento LGPD
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lgpd_consents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        consent_type VARCHAR(100) NOT NULL, -- 'data_processing', 'marketing', 'analytics'
        given_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(50),
        user_agent TEXT,
        revoked_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT unique_active_consent UNIQUE (user_id, consent_type)
      );

      CREATE INDEX IF NOT EXISTS idx_lgpd_consents_user_id ON lgpd_consents(user_id);
      CREATE INDEX IF NOT EXISTS idx_lgpd_consents_type ON lgpd_consents(consent_type);
    `);

    // Tabela de requisições de exclusão de dados (direito ao esquecimento)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS data_deletion_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'pending', -- pending, approved, completed, rejected
        reason TEXT,
        request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        authorized_by UUID REFERENCES users(id),
        completed_at TIMESTAMP,
        data_deleted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_deletion_requests_user ON data_deletion_requests(user_id);
      CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON data_deletion_requests(status);
    `);

    // Tabela de relatório de dados pessoais (LGPD)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS personal_data_exports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        exported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        file_path VARCHAR(500),
        expires_at TIMESTAMP,
        downloaded BOOLEAN DEFAULT false,
        downloaded_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_exports_user ON personal_data_exports(user_id);
      CREATE INDEX IF NOT EXISTS idx_exports_expires ON personal_data_exports(expires_at);
    `);

    // Tabela de histórico de alterações de dados pessoais (auditoria LGPD)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS personal_data_audit (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(100) NOT NULL, -- 'created', 'updated', 'deleted', 'exported', 'shared'
        data_type VARCHAR(100) NOT NULL, -- 'email', 'phone', 'cpf', 'address', etc
        old_value TEXT,
        new_value TEXT,
        reason TEXT,
        ip_address VARCHAR(50),
        user_agent TEXT,
        performed_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_personal_audit_user ON personal_data_audit(user_id);
      CREATE INDEX IF NOT EXISTS idx_personal_audit_action ON personal_data_audit(action);
    `);

    logger.info('Tabelas LGPD criadas com sucesso');
  } catch (error) {
    logger.error('Erro ao criar tabelas LGPD:', error);
    throw error;
  }
}

/**
 * Auto-cleanup: Deletar dados de usuários marcados para deleção após 30 dias
 */
export async function processDataDeletionQueue(): Promise<void> {
  try {
    const result = await pool.query(`
      SELECT id, user_id FROM data_deletion_requests
      WHERE status = 'approved'
      AND request_date < NOW() - INTERVAL '30 days'
      AND data_deleted_at IS NULL
      LIMIT 10
    `);

    for (const request of result.rows) {
      await deleteUserPersonalData(request.user_id);

      await pool.query(
        `UPDATE data_deletion_requests 
         SET status = 'completed', data_deleted_at = NOW()
         WHERE id = $1`,
        [request.id],
      );

      logger.info(`Dados do usuário ${request.user_id} deletados conforme LGPD`);
    }
  } catch (error) {
    logger.error('Erro ao processar fila de deleção:', error);
  }
}

/**
 * Função auxiliar para deletar dados pessoais de um usuário
 */
async function deleteUserPersonalData(userId: string): Promise<void> {
  try {
    // Manter registro anônimo do usuário para auditoria, mas remover dados pessoais
    await pool.query(
      `UPDATE users 
       SET 
         email = 'deleted_' || id,
         password_hash = 'deleted',
         is_active = false,
         updated_at = NOW()
       WHERE id = $1`,
      [userId],
    );

    // Limpar consentimentos
    await pool.query('DELETE FROM lgpd_consents WHERE user_id = $1', [userId]);

    logger.info(`Dados pessoais do usuário ${userId} foram anônimos e deletados`);
  } catch (error) {
    logger.error('Erro ao deletar dados pessoais:', error);
    throw error;
  }
}
