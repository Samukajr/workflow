import { apiClient } from './api';
import { PaymentRequest, PaymentWorkflow, DashboardStats, ApiResponse } from '@/types';

export interface SubmitPaymentRequest {
  document_type: 'nf' | 'boleto';
  amount: number;
  supplier_name: string;
  supplier_document: string;
  due_date: string;
  notes?: string;
  file: File;
}

export interface ValidatePaymentRequest {
  payment_request_id: string;
  approved: boolean;
  comments?: string;
}

export interface ProcessPaymentRequest {
  payment_request_id: string;
  transaction_id: string;
  payment_date: string;
  notes?: string;
}

export const paymentService = {
  async submitPaymentRequest(data: SubmitPaymentRequest): Promise<ApiResponse<{ payment_request: PaymentRequest }>> {
    const formData = new FormData();
    formData.append('document_type', data.document_type);
    formData.append('amount', data.amount.toString());
    formData.append('supplier_name', data.supplier_name);
    formData.append('supplier_document', data.supplier_document);
    formData.append('due_date', data.due_date);
    if (data.notes) {
      formData.append('notes', data.notes);
    }
    formData.append('file', data.file);

    return apiClient.uploadFile('/payments/submit', formData);
  },

  async validatePaymentRequest(data: ValidatePaymentRequest): Promise<ApiResponse<{ payment_request: PaymentRequest }>> {
    return apiClient.post('/payments/validate', data);
  },

  async processPayment(data: ProcessPaymentRequest): Promise<ApiResponse<{ payment_request: PaymentRequest }>> {
    return apiClient.post('/payments/process', data);
  },

  async getPaymentRequest(id: string): Promise<ApiResponse<{ request: PaymentRequest; workflow: PaymentWorkflow[] }>> {
    return apiClient.get(`/payments/${id}`);
  },

  async listPaymentRequests(
    status?: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ApiResponse<PaymentRequest[]>> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    return apiClient.get(`/payments?${params}`);
  },

  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return apiClient.get('/payments/dashboard/stats');
  },
};
