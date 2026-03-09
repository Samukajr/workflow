// Usuários e Autenticação
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  department: 'financeiro' | 'validacao' | 'submissao' | 'admin' | 'superadmin';
  password_hash: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserToken {
  id: string;
  email: string;
  name: string;
  department: 'financeiro' | 'validacao' | 'submissao' | 'admin' | 'superadmin';
}

// Requisições de Pagamento
export interface PaymentRequest {
  id: string;
  request_number: string;
  user_id: string;
  document_url: string;
  document_type: 'nf' | 'boleto';
  status: 'pendente_validacao' | 'validado' | 'rejeitado' | 'em_pagamento' | 'pago' | 'cancelado';
  amount: number;
  supplier_name: string;
  supplier_document: string;
  due_date: Date;
  notes: string;
  // Fase 2: Aprovação dupla
  requires_double_approval?: boolean;
  first_approver_id?: string;
  second_approver_id?: string;
  approval_completed_at?: Date;
  // Fase 2: Anti-fraude
  supplier_blocklisted?: boolean;
  blocklist_reason?: string;
  // Fase 2: Encerramento formal
  close_reason?: string;
  close_evidence_url?: string;
  closed_by?: string;
  closed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// Histórico e Fluxo de Trabalho
export interface PaymentWorkflow {
  id: string;
  payment_request_id: string;
  action: 'submissao' | 'validacao' | 'rejeicao' | 'aprovacao' | 'pagamento' | 'confirmacao_pagamento' | 'encerramento' | 'cancelamento';
  performed_by: string;
  status_from: string | null;
  status_to: string;
  comments: string;
  created_at: Date;
}

// Validação (LGPD)
export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  changes: Record<string, unknown>;
  ip_address: string;
  user_agent: string;
  created_at: Date;
}

// Request/Response Types
export interface AuthRequest {
  email: string;
  password: string;
}

export interface CreatePaymentRequestDTO {
  document_type: 'nf' | 'boleto';
  amount: number;
  supplier_name: string;
  supplier_document: string;
  due_date: string;
  notes?: string;
  file: Express.Multer.File;
}

export interface ValidatePaymentRequestDTO {
  payment_request_id: string;
  approved: boolean;
  comments?: string;
}

export interface ProcessPaymentDTO {
  payment_request_id: string;
  payment_date: string;
  transaction_id: string;
  notes?: string;
}

// ===== FASE 2: GOVERNANÇA CORPORATIVA =====

// Alçadas de aprovação
export interface ApprovalRule {
  id: string;
  min_amount: number;
  max_amount: number;
  requires_double_approval: boolean;
  requires_superadmin: boolean;
  description?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Aprovações múltiplas
export interface PaymentApproval {
  id: string;
  payment_request_id: string;
  approver_id: string;
  approval_order: number; // 1 para primeira, 2 para segunda
  decision: 'aprovado' | 'rejeitado';
  comments?: string;
  created_at: Date;
}

// Checklist de conformidade
export interface ComplianceChecklistTemplate {
  id: string;
  name: string;
  description?: string;
  items: ChecklistItem[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
  category: string;
}

export interface PaymentComplianceChecklist {
  id: string;
  payment_request_id: string;
  template_id: string;
  checked_items: string[]; // Array de IDs dos items checados
  checked_by?: string;
  completed_at?: Date;
  created_at: Date;
}

// Blocklist de fornecedores
export interface SupplierBlocklist {
  id: string;
  supplier_document: string;
  supplier_name?: string;
  reason: string;
  blocked_by: string;
  is_active: boolean;
  created_at: Date;
  removed_at?: Date;
}

// DTOs Fase 2
export interface ValidatePaymentRequestDTOV2 {
  payment_request_id: string;
  approved: boolean;
  comments?: string;
  checklist_items?: string[]; // IDs dos items checados
}

export interface SecondApprovalDTO {
  payment_request_id: string;
  approved: boolean;
  comments?: string;
}

