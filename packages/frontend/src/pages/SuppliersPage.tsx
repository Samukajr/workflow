import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { supplierService, type Supplier, type SupplierImportResult } from '../services/supplierService'

function normalizeRole(role?: string): string {
  return (role || '').toUpperCase().trim()
}

export default function SuppliersPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { user } = useAuthStore()
  const role = normalizeRole(user?.tipo || user?.departamento)
  const canManageSuppliers = role === 'ADMIN' || role === 'SUPERADMIN' || role === 'SUPER_ADMIN'

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [updatingSupplierId, setUpdatingSupplierId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [importResult, setImportResult] = useState<SupplierImportResult | null>(null)

  useEffect(() => {
    void loadSuppliers()
  }, [])

  const loadSuppliers = async (nextSearch = search) => {
    try {
      setLoading(true)
      setError('')
      const response = await supplierService.list(nextSearch)
      setSuppliers(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erro ao carregar fornecedores')
    } finally {
      setLoading(false)
    }
  }

  const handleImportClick = () => {
    if (!canManageSuppliers) {
      setError('Apenas admin e superadmin podem importar fornecedores')
      return
    }

    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setImporting(true)
      setError('')
      setMessage('')
      const response = await supplierService.importSpreadsheet(file)
      setImportResult(response.data)
      setMessage(`Importação concluída para ${file.name}`)
      await loadSuppliers()
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erro ao importar planilha')
    } finally {
      setImporting(false)
      event.target.value = ''
    }
  }

  const handleToggleSupplier = async (supplier: Supplier) => {
    try {
      setUpdatingSupplierId(supplier.id)
      setError('')
      setMessage('')
      const nextStatus = !supplier.is_active
      const response = await supplierService.updateStatus(supplier.id, nextStatus)
      setMessage(response.message)
      setSuppliers((current) =>
        current.map((entry) => (entry.id === supplier.id ? response.data : entry)),
      )
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erro ao atualizar status do fornecedor')
    } finally {
      setUpdatingSupplierId(null)
    }
  }

  if (!canManageSuppliers) {
    return (
      <div className="rounded-xl border border-red-400/40 bg-red-500/10 p-6 text-red-100">
        <h1 className="text-2xl font-bold">Acesso restrito</h1>
        <p className="mt-2 text-sm text-red-200">Somente perfis admin e superadmin podem gerenciar o cadastro mestre de fornecedores.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Cadastro de Fornecedores</h1>
          <p className="mt-2 text-slate-300">Importe sua planilha Excel e mantenha um catálogo centralizado para consulta e reaproveitamento.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => void loadSuppliers()}
            className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
          >
            Atualizar Lista
          </button>
          <button
            onClick={handleImportClick}
            disabled={importing}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {importing ? 'Importando...' : 'Importar Excel'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xls,.xlsx"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
          <p className="text-sm text-slate-400">Fornecedores carregados</p>
          <p className="mt-2 text-3xl font-bold text-white">{suppliers.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
          <p className="text-sm text-slate-400">Formato aceito</p>
          <p className="mt-2 text-lg font-semibold text-white">.xls e .xlsx</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
          <p className="text-sm text-slate-400">Colunas reconhecidas</p>
          <p className="mt-2 text-sm text-slate-200">Fornecedor, CPF/CNPJ, contato, empresa, status e banco</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
          <p className="text-sm text-slate-400">Uso recomendado</p>
          <p className="mt-2 text-sm text-slate-200">Use esta área para carga inicial e atualizações em lote.</p>
        </div>
      </div>

      {message && <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-emerald-100">{message}</div>}
      {error && <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-red-100">{error}</div>}

      {importResult && (
        <div className="rounded-xl border border-indigo-400/20 bg-slate-900/70 p-6">
          <h2 className="text-xl font-bold text-white">Resumo da última importação</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Aba</p>
              <p className="mt-1 text-white">{importResult.sheet_name}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Linhas lidas</p>
              <p className="mt-1 text-white">{importResult.total_rows}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Inseridos</p>
              <p className="mt-1 text-emerald-300">{importResult.imported}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Atualizados</p>
              <p className="mt-1 text-sky-300">{importResult.updated}</p>
            </div>
          </div>

          {importResult.skipped.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Linhas ignoradas</h3>
              <div className="mt-3 space-y-2 text-sm text-slate-200">
                {importResult.skipped.map((row) => (
                  <div key={`${row.row}-${row.document || row.supplier_name || row.reason}`} className="rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-2">
                    Linha {row.row}: {row.reason}
                    {row.supplier_name ? ` | ${row.supplier_name}` : ''}
                    {row.document ? ` | ${row.document}` : ''}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-slate-900/70 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-bold text-white">Catálogo atual</h2>
          <div className="flex gap-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por fornecedor, empresa ou documento"
              className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-sm text-white outline-none placeholder:text-slate-500 md:w-96"
            />
            <button
              onClick={() => void loadSuppliers(search)}
              className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
            >
              Buscar
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center text-slate-300">Carregando fornecedores...</div>
        ) : suppliers.length === 0 ? (
          <div className="py-10 text-center text-slate-400">Nenhum fornecedor cadastrado ainda. Importe sua planilha para iniciar.</div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-sm text-slate-200">
              <thead>
                <tr className="border-b border-white/10 text-left text-slate-400">
                  <th className="px-3 py-3">Fornecedor</th>
                  <th className="px-3 py-3">Documento</th>
                  <th className="px-3 py-3">Contato</th>
                  <th className="px-3 py-3">Empresa</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Banco</th>
                  <th className="px-3 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="border-b border-white/5 align-top">
                    <td className="px-3 py-3">
                      <div className="font-semibold text-white">{supplier.supplier_name}</div>
                      {supplier.trade_name && <div className="text-xs text-slate-400">{supplier.trade_name}</div>}
                      {supplier.supplier_type && <div className="text-xs text-slate-500">{supplier.supplier_type}</div>}
                    </td>
                    <td className="px-3 py-3">
                      <div>{supplier.document_raw}</div>
                      <div className="text-xs text-slate-500">{supplier.city_state || 'Sem localidade'}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div>{supplier.contact_name || 'Sem contato'}</div>
                      <div className="text-xs text-slate-500">{supplier.contact_phone || 'Sem telefone'}</div>
                    </td>
                    <td className="px-3 py-3">{supplier.company || 'Não informado'}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${supplier.is_active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-500/15 text-slate-300'}`}>
                        {supplier.status || (supplier.is_active ? 'Ativo' : 'Inativo')}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div>{supplier.bank_name || 'Não informado'}</div>
                      <div className="text-xs text-slate-500">
                        {supplier.bank_branch || '-'} / {supplier.bank_account || '-'}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => void handleToggleSupplier(supplier)}
                        disabled={updatingSupplierId === supplier.id}
                        className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${supplier.is_active ? 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25' : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'} disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        {updatingSupplierId === supplier.id
                          ? 'Salvando...'
                          : supplier.is_active
                            ? 'Bloquear no Sistema'
                            : 'Reativar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}