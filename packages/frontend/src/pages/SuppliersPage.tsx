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
  const canEditSupplier = role === 'SUPERADMIN' || role === 'SUPER_ADMIN'

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [updatingSupplierId, setUpdatingSupplierId] = useState<string | null>(null)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const [savingNew, setSavingNew] = useState(false)
  const [newForm, setNewForm] = useState({
    supplier_name: '',
    trade_name: '',
    supplier_type: '',
    document_raw: '',
    contact_name: '',
    contact_phone: '',
    company: '',
    city_state: '',
    status: 'Ativo',
    bank_name: '',
    bank_branch: '',
    bank_account: '',
  })
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

  const handleCreateSupplier = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      setSavingNew(true)
      setError('')
      setMessage('')

      const response = await supplierService.createSupplier({
        ...newForm,
        trade_name: newForm.trade_name || undefined,
        supplier_type: newForm.supplier_type || undefined,
        contact_name: newForm.contact_name || undefined,
        contact_phone: newForm.contact_phone || undefined,
        company: newForm.company || undefined,
        city_state: newForm.city_state || undefined,
        bank_name: newForm.bank_name || undefined,
        bank_branch: newForm.bank_branch || undefined,
        bank_account: newForm.bank_account || undefined,
      })

      setSuppliers((current) => [response.data, ...current])
      setMessage(response.message)
      setShowNewForm(false)
      setNewForm({
        supplier_name: '',
        trade_name: '',
        supplier_type: '',
        document_raw: '',
        contact_name: '',
        contact_phone: '',
        company: '',
        city_state: '',
        status: 'Ativo',
        bank_name: '',
        bank_branch: '',
        bank_account: '',
      })
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erro ao cadastrar fornecedor')
    } finally {
      setSavingNew(false)
    }
  }

  const handleSaveSupplierEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingSupplier) return

    try {
      setSavingEdit(true)
      setError('')
      setMessage('')

      const response = await supplierService.updateSupplier(editingSupplier.id, {
        supplier_name: editingSupplier.supplier_name,
        trade_name: editingSupplier.trade_name,
        supplier_type: editingSupplier.supplier_type,
        contact_name: editingSupplier.contact_name,
        contact_phone: editingSupplier.contact_phone,
        company: editingSupplier.company,
        city_state: editingSupplier.city_state,
        status: editingSupplier.status,
        bank_name: editingSupplier.bank_name,
        bank_branch: editingSupplier.bank_branch,
        bank_account: editingSupplier.bank_account,
      })

      setSuppliers((current) =>
        current.map((entry) => (entry.id === editingSupplier.id ? response.data : entry)),
      )
      setMessage(response.message)
      setEditingSupplier(null)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erro ao salvar cadastro do fornecedor')
    } finally {
      setSavingEdit(false)
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
          {canEditSupplier && (
            <button
              onClick={() => setShowNewForm(true)}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
            >
              + Novo Fornecedor
            </button>
          )}
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
                      <div className="flex flex-col gap-2">
                        {canEditSupplier && (
                          <button
                            type="button"
                            onClick={() => setEditingSupplier(supplier)}
                            className="rounded-lg bg-indigo-600/20 px-3 py-2 text-xs font-semibold text-indigo-300 ring-1 ring-indigo-500/40 transition hover:bg-indigo-600/40"
                          >
                            Editar Cadastro
                          </button>
                        )}
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showNewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-xl border border-slate-700 bg-slate-900 p-6 overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-bold text-white">Novo Fornecedor</h2>
            <p className="mt-1 text-sm text-slate-300">Preencha os dados para cadastrar manualmente um fornecedor. Acesso restrito a superadmin.</p>

            <form className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleCreateSupplier}>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm text-slate-300">Fornecedor <span className="text-rose-400">*</span></label>
                <input
                  value={newForm.supplier_name}
                  onChange={(e) => setNewForm({ ...newForm, supplier_name: e.target.value })}
                  placeholder="Razão social"
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Nome Fantasia</label>
                <input
                  value={newForm.trade_name}
                  onChange={(e) => setNewForm({ ...newForm, trade_name: e.target.value })}
                  placeholder="Nome fantasia"
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">CPF / CNPJ <span className="text-rose-400">*</span></label>
                <input
                  value={newForm.document_raw}
                  onChange={(e) => setNewForm({ ...newForm, document_raw: e.target.value })}
                  placeholder="00.000.000/0001-00"
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Tipo de Fornecedor</label>
                <input
                  value={newForm.supplier_type}
                  onChange={(e) => setNewForm({ ...newForm, supplier_type: e.target.value })}
                  placeholder="Ex: Materiais, Medicamentos"
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Empresa</label>
                <input
                  value={newForm.company}
                  onChange={(e) => setNewForm({ ...newForm, company: e.target.value })}
                  placeholder="Empresa vinculada"
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Nome de Contato</label>
                <input
                  value={newForm.contact_name}
                  onChange={(e) => setNewForm({ ...newForm, contact_name: e.target.value })}
                  placeholder="Nome do responsável"
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Telefone de Contato</label>
                <input
                  value={newForm.contact_phone}
                  onChange={(e) => setNewForm({ ...newForm, contact_phone: e.target.value })}
                  placeholder="+55 11 99999-9999"
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Cidade / Estado</label>
                <input
                  value={newForm.city_state}
                  onChange={(e) => setNewForm({ ...newForm, city_state: e.target.value })}
                  placeholder="São Paulo - SP"
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Banco</label>
                <input
                  value={newForm.bank_name}
                  onChange={(e) => setNewForm({ ...newForm, bank_name: e.target.value })}
                  placeholder="Nome do banco"
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Agência</label>
                <input
                  value={newForm.bank_branch}
                  onChange={(e) => setNewForm({ ...newForm, bank_branch: e.target.value })}
                  placeholder="0001"
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Conta Bancária</label>
                <input
                  value={newForm.bank_account}
                  onChange={(e) => setNewForm({ ...newForm, bank_account: e.target.value })}
                  placeholder="00000-0"
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Status inicial</label>
                <select
                  value={newForm.status}
                  onChange={(e) => setNewForm({ ...newForm, status: e.target.value })}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white"
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewForm(false)}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingNew}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                >
                  {savingNew ? 'Cadastrando...' : 'Cadastrar Fornecedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-xl border border-slate-700 bg-slate-900 p-6">
            <h2 className="text-2xl font-bold text-white">Editar Fornecedor (Superadmin)</h2>
            <p className="mt-1 text-sm text-slate-300">Atualize contato, nome e dados bancários do fornecedor selecionado.</p>

            <form className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSaveSupplierEdit}>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm text-slate-300">Fornecedor</label>
                <input
                  value={editingSupplier.supplier_name}
                  onChange={(event) => setEditingSupplier({ ...editingSupplier, supplier_name: event.target.value })}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Nome de Contato</label>
                <input
                  value={editingSupplier.contact_name || ''}
                  onChange={(event) => setEditingSupplier({ ...editingSupplier, contact_name: event.target.value })}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Telefone de Contato</label>
                <input
                  value={editingSupplier.contact_phone || ''}
                  onChange={(event) => setEditingSupplier({ ...editingSupplier, contact_phone: event.target.value })}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Banco</label>
                <input
                  value={editingSupplier.bank_name || ''}
                  onChange={(event) => setEditingSupplier({ ...editingSupplier, bank_name: event.target.value })}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">Agência</label>
                <input
                  value={editingSupplier.bank_branch || ''}
                  onChange={(event) => setEditingSupplier({ ...editingSupplier, bank_branch: event.target.value })}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm text-slate-300">Conta Bancária</label>
                <input
                  value={editingSupplier.bank_account || ''}
                  onChange={(event) => setEditingSupplier({ ...editingSupplier, bank_account: event.target.value })}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white"
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSupplier(null)}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
                >
                  {savingEdit ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}