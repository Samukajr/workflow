// Usuários e Autenticação
export interface User {
  id: string;
  email: string;
  name: string;
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
