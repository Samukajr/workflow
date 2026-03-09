import { useState } from 'react'

type Item = {
  id: string
  requestNumber: string
  supplier: string
  amount: string
  createdAt: string
}

const initialItems: Item[] = [
  { id: '1', requestNumber: 'REQ-1021', supplier: 'Fornecedor Delta', amount: 'R$ 2.450,00', createdAt: '09/03/2026' },
  { id: '2', requestNumber: 'REQ-1022', supplier: 'Fornecedor Orion', amount: 'R$ 980,30', createdAt: '09/03/2026' },
]

export default function ValidatePage() {
  const [items, setItems] = useState<Item[]>(initialItems)

  const validate = (id: string, approved: boolean) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
    window.alert(approved ? 'Requisicao aprovada.' : 'Requisicao rejeitada.')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Validar Requisicoes</h1>
        <p className="text-slate-600 mt-1">Aprove ou rejeite as requisicoes pendentes de validacao.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-indigo-600 text-white">
            <tr>
              <th className="text-left px-4 py-3">Numero</th>
              <th className="text-left px-4 py-3">Fornecedor</th>
              <th className="text-left px-4 py-3">Valor</th>
              <th className="text-left px-4 py-3">Criado em</th>
              <th className="text-left px-4 py-3">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-slate-100">
                <td className="px-4 py-3">{item.requestNumber}</td>
                <td className="px-4 py-3">{item.supplier}</td>
                <td className="px-4 py-3">{item.amount}</td>
                <td className="px-4 py-3">{item.createdAt}</td>
                <td className="px-4 py-3 space-x-2">
                  <button onClick={() => validate(item.id, true)} className="bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700">
                    Aprovar
                  </button>
                  <button onClick={() => validate(item.id, false)} className="bg-rose-600 text-white px-3 py-1 rounded hover:bg-rose-700">
                    Rejeitar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {items.length === 0 && (
        <div className="text-center text-slate-600 bg-white rounded-xl border border-slate-200 p-8">
          Nenhuma requisicao pendente de validacao.
        </div>
      )}
    </div>
  )
}
