import { useState } from 'react'

type Item = {
  id: string
  requestNumber: string
  supplier: string
  amount: string
}

const approvedItems: Item[] = [
  { id: '3', requestNumber: 'REQ-1008', supplier: 'Fornecedor Atlas', amount: 'R$ 6.410,00' },
  { id: '4', requestNumber: 'REQ-1009', supplier: 'Fornecedor Prisma', amount: 'R$ 1.760,40' },
]

export default function ProcessPaymentPage() {
  const [items, setItems] = useState<Item[]>(approvedItems)

  const process = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
    window.alert('Pagamento processado com sucesso.')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Processar Pagamentos</h1>
        <p className="text-slate-600 mt-1">Confirme os pagamentos das requisicoes aprovadas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <p className="text-indigo-700 text-sm">Aguardando processamento</p>
          <p className="text-3xl font-bold text-indigo-900">{items.length}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-emerald-700 text-sm">Valor total pendente</p>
          <p className="text-3xl font-bold text-emerald-900">R$ 8.170,40</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-indigo-600 text-white">
            <tr>
              <th className="text-left px-4 py-3">Numero</th>
              <th className="text-left px-4 py-3">Fornecedor</th>
              <th className="text-left px-4 py-3">Valor</th>
              <th className="text-left px-4 py-3">Acao</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-slate-100">
                <td className="px-4 py-3">{item.requestNumber}</td>
                <td className="px-4 py-3">{item.supplier}</td>
                <td className="px-4 py-3">{item.amount}</td>
                <td className="px-4 py-3">
                  <button onClick={() => process(item.id)} className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700">
                    Confirmar Pagamento
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
