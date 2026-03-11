import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'

type Row = {
  id: string
  requestNumber: string
  supplier: string
  status: 'pendente_validacao' | 'validado' | 'em_pagamento' | 'pago' | 'rejeitado'
  amount: string
}

const rows: Row[] = [
  { id: '1001', requestNumber: 'REQ-1001', supplier: 'Fornecedor Delta', status: 'pendente_validacao', amount: 'R$ 1.250,00' },
  { id: '1002', requestNumber: 'REQ-1002', supplier: 'Fornecedor Atlas', status: 'validado', amount: 'R$ 4.900,00' },
  { id: '1003', requestNumber: 'REQ-1003', supplier: 'Fornecedor Orion', status: 'em_pagamento', amount: 'R$ 799,90' },
  { id: '1004', requestNumber: 'REQ-1004', supplier: 'Fornecedor Prisma', status: 'pago', amount: 'R$ 2.340,75' },
]

const labels: Record<Row['status'], string> = {
  pendente_validacao: 'Pendente Validacao',
  validado: 'Validado',
  em_pagamento: 'Em Pagamento',
  pago: 'Pago',
  rejeitado: 'Rejeitado',
}

export default function PaymentListPage() {
  const [status, setStatus] = useState<'todos' | Row['status']>('todos')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      const statusOk = status === 'todos' || row.status === status
      const searchOk =
        row.requestNumber.toLowerCase().includes(search.toLowerCase()) ||
        row.supplier.toLowerCase().includes(search.toLowerCase())
      return statusOk && searchOk
    })
  }, [search, status])

  const badgeClass = (value: Row['status']) => {
    if (value === 'pago') return 'bg-emerald-100 text-emerald-700'
    if (value === 'validado') return 'bg-indigo-100 text-indigo-700'
    if (value === 'em_pagamento') return 'bg-amber-100 text-amber-800'
    if (value === 'rejeitado') return 'bg-rose-100 text-rose-700'
    return 'bg-slate-100 text-slate-700'
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
          onChange={(e) => setStatus(e.target.value as 'todos' | Row['status'])}
          className="border border-slate-300 rounded-lg px-3 py-2"
        >
          <option value="todos">Todos os status</option>
          <option value="pendente_validacao">Pendente Validacao</option>
          <option value="validado">Validado</option>
          <option value="em_pagamento">Em Pagamento</option>
          <option value="pago">Pago</option>
          <option value="rejeitado">Rejeitado</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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
                <td className="px-4 py-3">{row.requestNumber}</td>
                <td className="px-4 py-3">{row.supplier}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${badgeClass(row.status)}`}>
                    {labels[row.status]}
                  </span>
                </td>
                <td className="px-4 py-3">{row.amount}</td>
                <td className="px-4 py-3">
                  <Link to={`/payments/${row.id}`} className="text-indigo-700 hover:text-indigo-900 font-medium">
                    Ver detalhes
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
