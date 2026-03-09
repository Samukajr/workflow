export interface User {
  id: string;
  email: string;
  name: string;
  department: 'financeiro' | 'validacao' | 'submissao' | 'admin' | 'superadmin';
}

export interface PaymentRequest {
  id: string;
  request_number: string;
  status: 'pendente_validacao' | 'validado' | 'rejeitado' | 'em_pagamento' | 'pago' | 'cancelado';
  amount: number;
  supplier_name: string;
  supplier_document: string;
  due_date: string;
  document_type: 'nf' | 'boleto';
  document_url: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentWorkflow {
  id: string;
  payment_request_id: string;
  action: string;
  performed_by: string;
  status_from: string | null;
  status_to: string;
  comments: string;
  created_at: string;
}

export interface DashboardStats {
  pendingValidation: number;
  validated: number;
  paid: number;
  rejected: number;
  userDepartment: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
