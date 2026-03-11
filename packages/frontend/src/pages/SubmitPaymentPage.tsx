import { useEffect, useMemo, useState } from 'react'
import { paymentService } from '../services/paymentService'
import { supplierService, type Supplier } from '../services/supplierService'

type RequestForm = {
  supplierQuery: string
  selectedSupplier: Supplier | null
  documentType: 'nf' | 'boleto'
  amount: string
  dueDate: string
  notes: string
  file: File | null
}

function matchesSupplier(supplier: Supplier, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return true

  return [
    supplier.supplier_name,
    supplier.trade_name,
    supplier.company,
    supplier.document_raw,
    supplier.document_normalized,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedQuery))
}

export default function SubmitPaymentPage() {
  const [catalog, setCatalog] = useState<Supplier[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState<RequestForm>({
    supplierQuery: '',
    selectedSupplier: null,
    documentType: 'nf',
    amount: '',
    dueDate: '',
    notes: '',
    file: null,
  })

  useEffect(() => {
    void loadSuppliers()
  }, [])

  const filteredSuppliers = useMemo(() => {
    const results = catalog.filter((supplier) => matchesSupplier(supplier, form.supplierQuery))
    return results.slice(0, 8)
  }, [catalog, form.supplierQuery])

  const loadSuppliers = async () => {
    try {
      setCatalogLoading(true)
      const response = await supplierService.list()
      setCatalog(response.data.filter((supplier) => supplier.is_active))
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erro ao carregar catálogo de fornecedores')
    } finally {
      setCatalogLoading(false)
    }
  }

  const selectSupplier = (supplier: Supplier) => {
    setForm((prev) => ({
      ...prev,
      supplierQuery: supplier.supplier_name,
      selectedSupplier: supplier,
    }))
    setShowSuggestions(false)
    setError('')
  }

  const clearSelectedSupplier = () => {
    setForm((prev) => ({
      ...prev,
      supplierQuery: '',
      selectedSupplier: null,
    }))
    setShowSuggestions(false)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!form.selectedSupplier) {
      setError('Selecione um fornecedor já cadastrado no catálogo.')
      return
    }

    if (!form.file) {
      setError('Anexe o documento da requisição antes de enviar.')
      return
    }

    if (!form.amount || Number(form.amount) <= 0) {
      setError('Informe um valor válido para a requisição.')
      return
    }

    try {
      setSubmitting(true)

      const formData = new FormData()
      formData.append('document_type', form.documentType)
      formData.append('amount', form.amount)
      formData.append('supplier_name', form.selectedSupplier.supplier_name)
      formData.append('supplier_document', form.selectedSupplier.document_raw)
      formData.append('due_date', form.dueDate)
      formData.append('notes', form.notes)
      formData.append('file', form.file)

      const response = await paymentService.submit(formData)
      const requestNumber = response.payment_request?.request_number || 'gerada'

      setSuccess(`Requisição ${requestNumber} enviada com sucesso para validação.`)
      setForm({
        supplierQuery: '',
        selectedSupplier: null,
        documentType: 'nf',
        amount: '',
        dueDate: '',
        notes: '',
        file: null,
      })
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erro ao enviar requisição')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Submeter Requisição</h1>
        <p className="text-slate-300 mt-1">Escolha um fornecedor do cadastro interno e envie o documento para o fluxo de aprovação.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-red-100">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-emerald-100">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-200">Fornecedor</label>
              <div className="relative">
                <input
                  value={form.supplierQuery}
                  onChange={(event) => {
                    const value = event.target.value
                    setForm((prev) => ({
                      ...prev,
                      supplierQuery: value,
                      selectedSupplier:
                        prev.selectedSupplier && prev.selectedSupplier.supplier_name === value
                          ? prev.selectedSupplier
                          : null,
                    }))
                    setShowSuggestions(true)
                    setError('')
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                  placeholder={catalogLoading ? 'Carregando fornecedores...' : 'Digite nome, empresa ou CNPJ'}
                  required
                />

                {form.selectedSupplier && (
                  <button
                    type="button"
                    onClick={clearSelectedSupplier}
                    className="absolute right-3 top-2 text-sm text-slate-400 transition hover:text-white"
                  >
                    Limpar
                  </button>
                )}

                {showSuggestions && form.supplierQuery.trim() && !form.selectedSupplier && (
                  <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-lg border border-slate-700 bg-slate-950 shadow-2xl">
                    {filteredSuppliers.length > 0 ? (
                      filteredSuppliers.map((supplier) => (
                        <button
                          key={supplier.id}
                          type="button"
                          onClick={() => selectSupplier(supplier)}
                          className="block w-full border-b border-slate-800 px-4 py-3 text-left transition hover:bg-slate-800"
                        >
                          <div className="font-medium text-white">{supplier.supplier_name}</div>
                          <div className="mt-1 text-xs text-slate-400">
                            {supplier.document_raw}
                            {supplier.company ? ` | ${supplier.company}` : ''}
                            {supplier.city_state ? ` | ${supplier.city_state}` : ''}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-slate-400">
                        Nenhum fornecedor encontrado. Verifique o catálogo em Cadastro Fornecedores.
                      </div>
                    )}
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-slate-400">A seleção usa a base importada da sua planilha de fornecedores.</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">Tipo de Documento</label>
              <select
                value={form.documentType}
                onChange={(event) => setForm((prev) => ({ ...prev, documentType: event.target.value as 'nf' | 'boleto' }))}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
              >
                <option value="nf">Nota Fiscal</option>
                <option value="boleto">Boleto</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">Valor</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                placeholder="0,00"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">Data de Vencimento</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">Documento da Requisição</label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(event) => setForm((prev) => ({ ...prev, file: event.target.files?.[0] || null }))}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-200 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-indigo-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-200">Observações</label>
              <textarea
                rows={4}
                value={form.notes}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                placeholder="Informações complementares para validação e pagamento"
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting || catalogLoading}
                className="rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Enviando...' : 'Enviar Requisição'}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-white">Fornecedor Selecionado</h2>
            {form.selectedSupplier ? (
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Nome</p>
                  <p className="font-medium text-white">{form.selectedSupplier.supplier_name}</p>
                  {form.selectedSupplier.trade_name && <p className="text-slate-400">{form.selectedSupplier.trade_name}</p>}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Documento</p>
                  <p>{form.selectedSupplier.document_raw}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Empresa</p>
                  <p>{form.selectedSupplier.company || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Contato</p>
                  <p>{form.selectedSupplier.contact_name || 'Sem contato'}</p>
                  <p className="text-slate-400">{form.selectedSupplier.contact_phone || 'Sem telefone cadastrado'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Dados bancários</p>
                  <p>{form.selectedSupplier.bank_name || 'Banco não informado'}</p>
                  <p className="text-slate-400">Agência: {form.selectedSupplier.bank_branch || '-'} | Conta: {form.selectedSupplier.bank_account || '-'}</p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-400">Pesquise e selecione um fornecedor do catálogo para preencher a requisição com o cadastro interno.</p>
            )}
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-white">Como funciona</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p>1. Pesquise o fornecedor por nome, empresa ou CNPJ.</p>
              <p>2. Selecione o fornecedor cadastrado a partir da planilha importada.</p>
              <p>3. Anexe a nota fiscal ou boleto e envie a requisição.</p>
              <p>4. O sistema usa o documento do fornecedor selecionado no fluxo de validação e pagamento.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
