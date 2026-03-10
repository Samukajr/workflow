import { pool } from '../config/database';
import logger from '../utils/logger';

/**
 * Fase 2: Governança Corporativa
 * - Matriz de alçadas de aprovação por valor
 * - Aprovação dupla para valores altos
 * - Checklist de conformidade
 * - Encerramento formal com motivo e evidências
 */
export async function applyPhase2Migrations(): Promise<void> {
  try {
    await pool.query(`
      BEGIN;

      -- ===== 1. TABELA DE ALÇADAS DE APROVAÇÃO =====
      CREATE TABLE IF NOT EXISTS approval_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        min_amount NUMERIC(15, 2) NOT NULL,
        max_amount NUMERIC(15, 2) NOT NULL,
        requires_double_approval BOOLEAN DEFAULT FALSE,
        requires_superadmin BOOLEAN DEFAULT FALSE,
        description VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT check_amount_range CHECK (max_amount > min_amount)
      );

      CREATE INDEX IF NOT EXISTS idx_approval_rules_amount ON approval_rules(min_amount, max_amount);

      -- Inserir regras padrão se não existirem
      INSERT INTO approval_rules (min_amount, max_amount, requires_double_approval, requires_superadmin, description)
      SELECT 0.00, 5000.00, FALSE, FALSE, 'Até R$ 5.000 - Aprovação única'
      WHERE NOT EXISTS (SELECT 1 FROM approval_rules WHERE min_amount = 0.00 AND max_amount = 5000.00);

      INSERT INTO approval_rules (min_amount, max_amount, requires_double_approval, requires_superadmin, description)
      SELECT 5000.01, 50000.00, TRUE, FALSE, 'R$ 5.000 a R$ 50.000 - Aprovação dupla'
      WHERE NOT EXISTS (SELECT 1 FROM approval_rules WHERE min_amount = 5000.01 AND max_amount = 50000.00);

      INSERT INTO approval_rules (min_amount, max_amount, requires_double_approval, requires_superadmin, description)
      SELECT 50000.01, 999999999.99, TRUE, TRUE, 'Acima de R$ 50.000 - Requer superadmin'
      WHERE NOT EXISTS (SELECT 1 FROM approval_rules WHERE min_amount = 50000.01);

      -- ===== 2. TABELA DE APROVAÇÕES MÚLTIPLAS =====
      CREATE TABLE IF NOT EXISTS payment_approvals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        payment_request_id UUID NOT NULL REFERENCES payment_requests(id),
        approver_id UUID NOT NULL REFERENCES users(id),
        approval_order INTEGER NOT NULL, -- 1 para primeira aprovação, 2 para segunda
        decision VARCHAR(20) NOT NULL CHECK (decision IN ('aprovado', 'rejeitado')),
        comments TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(payment_request_id, approval_order)
      );

      CREATE INDEX IF NOT EXISTS idx_payment_approvals_request ON payment_approvals(payment_request_id);
      CREATE INDEX IF NOT EXISTS idx_payment_approvals_approver ON payment_approvals(approver_id);

      -- ===== 3. TEMPLATES DE CHECKLIST DE CONFORMIDADE =====
      CREATE TABLE IF NOT EXISTS compliance_checklist_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        items JSONB NOT NULL, -- Array de items: [{id, label, required, category}]
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Inserir checklist padrão de conformidade fiscal
      INSERT INTO compliance_checklist_templates (name, description, items)
      SELECT 
        'Conformidade Fiscal Padrão',
        'Checklist obrigatório para validação de documentos fiscais',
        '[
          {"id": "doc_legivel", "label": "Documento legível e sem rasuras", "required": true, "category": "documento"},
          {"id": "cnpj_valido", "label": "CNPJ do fornecedor válido", "required": true, "category": "fornecedor"},
          {"id": "valor_conferido", "label": "Valor conferido e sem divergências", "required": true, "category": "financeiro"},
          {"id": "vencimento_ok", "label": "Data de vencimento adequada", "required": true, "category": "prazo"},
          {"id": "rubrica_correta", "label": "Rubrica orçamentária correta", "required": false, "category": "orcamento"},
          {"id": "sem_duplicidade", "label": "Não há duplicidade no sistema", "required": true, "category": "controle"}
        ]'::JSONB
      WHERE NOT EXISTS (SELECT 1 FROM compliance_checklist_templates WHERE name = 'Conformidade Fiscal Padrão');

      -- ===== 4. CHECKLIST POR REQUISIÇÃO =====
      CREATE TABLE IF NOT EXISTS payment_compliance_checklists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        payment_request_id UUID NOT NULL REFERENCES payment_requests(id),
        template_id UUID NOT NULL REFERENCES compliance_checklist_templates(id),
        checked_items JSONB NOT NULL DEFAULT '[]', -- Array de IDs dos items checados
        checked_by UUID REFERENCES users(id),
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(payment_request_id)
      );

      CREATE INDEX IF NOT EXISTS idx_compliance_checklist_request ON payment_compliance_checklists(payment_request_id);

      -- ===== 5. ADICIONAR CAMPOS À TABELA PAYMENT_REQUESTS =====
      
      -- Campos de aprovação dupla
      ALTER TABLE payment_requests 
      ADD COLUMN IF NOT EXISTS requires_double_approval BOOLEAN DEFAULT FALSE;
      
      ALTER TABLE payment_requests 
      ADD COLUMN IF NOT EXISTS first_approver_id UUID REFERENCES users(id);
      
      ALTER TABLE payment_requests 
      ADD COLUMN IF NOT EXISTS second_approver_id UUID REFERENCES users(id);
      
      ALTER TABLE payment_requests 
      ADD COLUMN IF NOT EXISTS approval_completed_at TIMESTAMP;

      -- Campos de blocklist anti-fraude
      ALTER TABLE payment_requests 
      ADD COLUMN IF NOT EXISTS supplier_blocklisted BOOLEAN DEFAULT FALSE;
      
      ALTER TABLE payment_requests 
      ADD COLUMN IF NOT EXISTS blocklist_reason TEXT;

      -- Campos de encerramento formal
      ALTER TABLE payment_requests 
      ADD COLUMN IF NOT EXISTS close_reason TEXT;
      
      ALTER TABLE payment_requests 
      ADD COLUMN IF NOT EXISTS close_evidence_url VARCHAR(500);
      
      ALTER TABLE payment_requests 
      ADD COLUMN IF NOT EXISTS closed_by UUID REFERENCES users(id);
      
      ALTER TABLE payment_requests 
      ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP;

      -- ===== 6. TABELA DE BLOCKLIST DE FORNECEDORES =====
      CREATE TABLE IF NOT EXISTS supplier_blocklist (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        supplier_document VARCHAR(20) NOT NULL UNIQUE,
        supplier_name VARCHAR(255),
        reason TEXT NOT NULL,
        blocked_by UUID NOT NULL REFERENCES users(id),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        removed_at TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_supplier_blocklist_document ON supplier_blocklist(supplier_document);
      CREATE INDEX IF NOT EXISTS idx_supplier_blocklist_active ON supplier_blocklist(is_active);

      COMMIT;
    `);

    logger.info('✅ Migrações da Fase 2 aplicadas com sucesso');
  } catch (error) {
    await pool.query('ROLLBACK');
    logger.error('❌ Erro ao aplicar migrações da Fase 2:', error);
    throw error;
  }
}
