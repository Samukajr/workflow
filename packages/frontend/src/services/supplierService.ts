import { apiClient } from './api'

export interface Supplier {
  id: string
  supplier_name: string
  trade_name?: string
  supplier_type?: string
  document_raw: string
  document_normalized: string
  contact_name?: string
  contact_phone?: string
  company?: string
  city_state?: string
  status?: string
  bank_name?: string
  bank_branch?: string
  bank_account?: string
  source_file_name?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SupplierImportSkippedRow {
  row: number
  reason: string
  supplier_name?: string
  document?: string
}

export interface SupplierImportResult {
  sheet_name: string
  total_rows: number
  imported: number
  updated: number
  skipped: SupplierImportSkippedRow[]
}

export const supplierService = {
  async list(search?: string) {
    const queryString = search ? `?search=${encodeURIComponent(search)}` : ''
    return apiClient.get<{ success: boolean; data: Supplier[] }>(`/suppliers${queryString}`)
  },

  async updateStatus(id: string, isActive: boolean) {
    return apiClient.request<{ success: boolean; message: string; data: Supplier }>('PATCH', `/suppliers/${id}/status`, {
      is_active: isActive,
    })
  },

  async updateSupplier(id: string, data: {
    supplier_name?: string
    trade_name?: string
    supplier_type?: string
    contact_name?: string
    contact_phone?: string
    company?: string
    city_state?: string
    status?: string
    bank_name?: string
    bank_branch?: string
    bank_account?: string
  }) {
    return apiClient.request<{ success: boolean; message: string; data: Supplier }>('PATCH', `/suppliers/${id}`, data)
  },

  async importSpreadsheet(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.uploadFile<{ success: boolean; message: string; data: SupplierImportResult }>(
      '/suppliers/import',
      formData,
    )
  },

  async createSupplier(data: {
    supplier_name: string
    trade_name?: string
    supplier_type?: string
    document_raw: string
    contact_name?: string
    contact_phone?: string
    company?: string
    city_state?: string
    status?: string
    bank_name?: string
    bank_branch?: string
    bank_account?: string
  }) {
    return apiClient.request<{ success: boolean; message: string; data: Supplier }>('POST', '/suppliers', data)
  },
}