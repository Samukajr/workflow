import { apiClient } from './api';

// ===== TIPOS =====

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
  due_date: string;
  notes: string;
  requires_double_approval?: boolean;
  first_approver_id?: string;
  second_approver_id?: string;
  approval_completed_at?: string;
  supplier_blocklisted?: boolean;
  blocklist_reason?: string;
  close_reason?: string;
  close_evidence_url?: string;
  closed_by?: string;
  closed_at?: string;
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

export interface ApprovalRule {
  id: string;
  min_amount: number;
  max_amount: number;
  requires_double_approval: boolean;
  requires_superadmin: boolean;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentApproval {
  id: string;
  payment_request_id: string;
  approver_id: string;
  approval_order: number;
  decision: 'aprovado' | 'rejeitado';
  comments?: string;
  created_at: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
  category: string;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description?: string;
  items: ChecklistItem[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentChecklist {
  id: string;
  payment_request_id: string;
  template_id: string;
  checked_items: string[];
  checked_by?: string;
  completed_at?: string;
  created_at: string;
}

export interface SupplierBlocklist {
  id: string;
  supplier_document: string;
  supplier_name?: string;
  reason: string;
  blocked_by: string;
  is_active: boolean;
  created_at: string;
  removed_at?: string;
}

// ===== SERVIÇOS =====

export const paymentService = {
  // Submeter requisição
  async submit(formData: FormData) {
    return apiClient.uploadFile<{ success: boolean; payment_request: PaymentRequest }>('/payments/submit', formData);
  },

  // Validar requisição
  async validate(data: {
    payment_request_id: string;
    approved: boolean;
    comments?: string;
    checklist_items?: string[];
  }) {
    return apiClient.post<{ success: boolean; message: string; payment_request: PaymentRequest }>('/payments/validate', data);
  },

  // Processar pagamento
  async process(data: {
    payment_request_id: string;
    transaction_id: string;
    payment_date: string;
    notes?: string;
  }) {
    return apiClient.post<{ success: boolean; message: string; payment_request: PaymentRequest }>('/payments/process', data);
  },

  // Encerrar requisição
  async close(data: {
    payment_request_id: string;
    close_reason?: string;
    close_evidence_url?: string;
    comments?: string;
  }) {
    return apiClient.post<{ success: boolean; message: string; payment_request: PaymentRequest }>('/payments/close', data);
  },

  // Listar requisições
  async list(params?: { status?: string; limit?: number; offset?: number }) {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiClient.get<{ success: boolean; data: PaymentRequest[] }>(`/payments${queryString}`);
  },

  // Obter detalhes
  async getDetails(id: string) {
    return apiClient.get<{ success: boolean; data: { request: PaymentRequest; workflow: PaymentWorkflow[] } }>(`/payments/${id}`);
  },

  // Dashboard stats
  async getDashboard() {
    return apiClient.get<{ success: boolean; data: any }>('/payments/dashboard/stats');
  },

  // ===== FASE 2: NOVOS ENDPOINTS =====

  // Obter checklist
  async getChecklist(paymentRequestId: string) {
    return apiClient.get<{
      success: boolean;
      data: {
        checklist: PaymentChecklist;
        template: ChecklistTemplate;
      };
    }>(`/payments/checklist/${paymentRequestId}`);
  },

  // Listar regras de alçada
  async getApprovalRules() {
    return apiClient.get<{ success: boolean; data: ApprovalRule[] }>('/payments/approval-rules');
  },

  // Histórico de aprovações
  async getApprovals(paymentRequestId: string) {
    return apiClient.get<{ success: boolean; data: PaymentApproval[] }>(`/payments/approvals/${paymentRequestId}`);
  },

  // Adicionar à blocklist
  async addToBlocklist(data: {
    supplier_document: string;
    supplier_name: string;
    reason: string;
  }) {
    return apiClient.post<{ success: boolean; message: string }>('/payments/blocklist', data);
  },

  // FASE 3C: Analytics
  async getAnalytics(period: 'today' | 'week' | 'month' | 'quarter' | 'year' = 'month') {
    return apiClient.get<{ success: boolean; data: any }>(`/analytics/metrics?period=${period}`);
  },

  // ===== FASE 3D: BANKING/ERP INTEGRATION =====

  // Criar integração bancária
  async createBankingIntegration(data: {
    bank_type: string;
    name: string;
    api_key?: string;
    api_secret?: string;
    supported_methods: string[];
  }) {
    return apiClient.post<{ success: boolean; message: string; data: any }>('/banking/integrations', data);
  },

  // Listar integrações bancárias
  async getBankingIntegrations() {
    return apiClient.get<{ success: boolean; data: any[] }>('/banking/integrations');
  },

  // Testar conexão com banco
  async testBankingConnection(integrationId: string) {
    return apiClient.post<{ success: boolean; message: string; data: any }>(
      `/banking/integrations/${integrationId}/test`,
      {}
    );
  },

  // Iniciar pagamento via banco
  async initiateBankPayment(data: {
    payment_request_id: string;
    bank_integration_id: string;
    payment_method: string;
  }) {
    return apiClient.post<{ success: boolean; message: string; data: any }>(
      '/banking/payments/initiate',
      data
    );
  },

  // Obter reconciliações pendentes
  async getPendingReconciliations() {
    return apiClient.get<{ success: boolean; data: any }>('/banking/reconciliation/pending');
  },

  // Obter status de reconciliação
  async getReconciliationStatus(paymentRequestId: string) {
    return apiClient.get<{ success: boolean; data: any }>(
      `/banking/reconciliation/${paymentRequestId}`
    );
  },
};
