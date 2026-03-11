import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { paymentService, PaymentRequest } from '../services/paymentService'

const labels: Record<PaymentRequest['status'], string> = {
  pendente_validacao: 'Pendente Validacao',
  validado: 'Validado',
  em_pagamento: 'Em Pagamento',
  pago: 'Pago',
  rejeitado: 'Rejeitado',
  cancelado: 'Cancelado',
}

export default function PaymentListPage() {
  const [rows, setRows] = useState<PaymentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'todos' | PaymentRequest['status']>('todos')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const loadPayments = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await paymentService.list()
        setRows(response.data)
      } catch (err) {
        console.error('Erro ao carregar requisições:', err)
        setError('Não foi possível carregar as requisições.')
      } finally {
        setLoading(false)
      }
    }

    void loadPayments()
  }, [])

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const statusOk = status === 'todos' || row.status === status
      const searchOk =
        row.request_number.toLowerCase().includes(search.toLowerCase()) ||
        row.supplier_name.toLowerCase().includes(search.toLowerCase())
      return statusOk && searchOk
    })
  }, [rows, search, status])

  const badgeClass = (value: PaymentRequest['status']) => {
    if (value === 'pago') return 'bg-emerald-100 text-emerald-700'
    if (value === 'validado') return 'bg-indigo-100 text-indigo-700'
    if (value === 'em_pagamento') return 'bg-amber-100 text-amber-800'
    if (value === 'rejeitado') return 'bg-rose-100 text-rose-700'
    return 'bg-slate-100 text-slate-700'
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Todas Requisicoes</h1>
        <p className="text-slate-300 mt-1">Visualize e acompanhe o andamento completo do fluxo.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-slate-300 rounded-lg px-3 py-2"
          placeholder="Buscar por numero ou fornecedor"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as 'todos' | PaymentRequest['status'])}
          className="border border-slate-300 rounded-lg px-3 py-2"
        >
          <option value="todos">Todos os status</option>
          <option value="pendente_validacao">Pendente Validacao</option>
          <option value="validado">Validado</option>
          <option value="em_pagamento">Em Pagamento</option>
          <option value="pago">Pago</option>
          <option value="rejeitado">Rejeitado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="px-4 py-8 text-center text-slate-600">Carregando requisições...</div>
        ) : error ? (
          <div className="px-4 py-8 text-center text-red-600">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-slate-600">Nenhuma requisição encontrada.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-indigo-600 text-white">
              <tr>
                <th className="text-left px-4 py-3">Numero</th>
                <th className="text-left px-4 py-3">Fornecedor</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Valor</th>
                <th className="text-left px-4 py-3">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">{row.request_number}</td>
                  <td className="px-4 py-3">{row.supplier_name}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${badgeClass(row.status)}`}>
                      {labels[row.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatCurrency(row.amount)}</td>
                  <td className="px-4 py-3">
                    <Link to={`/payments/${row.id}`} className="text-indigo-700 hover:text-indigo-900 font-medium">
                      Ver detalhes
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
