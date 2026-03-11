import { useState } from 'react'

type RequestForm = {
  supplier: string
  documentType: 'NF' | 'BOLETO'
  amount: string
  dueDate: string
  notes: string
}

export default function SubmitPaymentPage() {
  const [form, setForm] = useState<RequestForm>({
    supplier: '',
    documentType: 'NF',
    amount: '',
    dueDate: '',
    notes: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Submeter Requisicao</h1>
        <p className="text-slate-300 mt-1">Envie uma nova solicitacao para o fluxo de aprovacao e pagamento.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fornecedor</label>
            <input
              value={form.supplier}
              onChange={(e) => setForm((prev) => ({ ...prev, supplier: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Nome do fornecedor"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Documento</label>
            <select
              value={form.documentType}
              onChange={(e) => setForm((prev) => ({ ...prev, documentType: e.target.value as 'NF' | 'BOLETO' }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="NF">Nota Fiscal</option>
              <option value="BOLETO">Boleto</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Valor</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0,00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Data de Vencimento</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Observacoes</label>
            <textarea
              rows={4}
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Informacoes complementares"
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700">
              Enviar Requisicao
            </button>
          </div>
        </form>
      </div>

      {submitted && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-emerald-800">
          Requisicao enviada com sucesso para validacao.
        </div>
      )}
    </div>
  )
}
