import { useEffect, useMemo, useState } from 'react'
import { paymentService, type PaymentReadyForPayment } from '../services/paymentService'

export default function ProcessPaymentPage() {
  const [items, setItems] = useState<PaymentReadyForPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    void loadReadyPayments()
  }, [])

  const totalPending = useMemo(
    () => items.reduce((acc, item) => acc + Number(item.amount || 0), 0),
    [items],
  )

  const loadReadyPayments = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await paymentService.listReadyForPayment({ limit: 200 })
      setItems(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erro ao carregar pagamentos prontos')
    } finally {
      setLoading(false)
    }
  }

  const process = async (item: PaymentReadyForPayment) => {
    try {
      setProcessingId(item.id)
      setError('')

      await paymentService.process({
        payment_request_id: item.id,
        transaction_id: `MANUAL-${Date.now()}`,
        payment_date: new Date().toISOString(),
        notes: `Pagamento processado com dados bancários do cadastro mestre (${item.bank_name || 'banco não informado'})`,
      })

      setItems((current) => current.filter((entry) => entry.id !== item.id))
      window.alert(`Pagamento ${item.request_number} processado com sucesso.`)
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erro ao processar pagamento')
    } finally {
      setProcessingId(null)
    }
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
        <h1 className="text-3xl font-bold text-white">Processar Pagamentos</h1>
        <p className="text-slate-300 mt-1">Confirme pagamentos validados com dados bancários vindos automaticamente do cadastro de fornecedores.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-red-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-indigo-300/30 bg-indigo-500/10 p-4">
          <p className="text-indigo-200 text-sm">Aguardando processamento</p>
          <p className="text-3xl font-bold text-white">{items.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 p-4">
          <p className="text-emerald-200 text-sm">Valor total pendente</p>
          <p className="text-3xl font-bold text-white">{formatCurrency(totalPending)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900/80 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-300">Carregando pagamentos validados...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-slate-400">Nenhum pagamento validado pendente no momento.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-800 text-slate-200">
              <tr>
                <th className="text-left px-4 py-3">Numero</th>
                <th className="text-left px-4 py-3">Fornecedor</th>
                <th className="text-left px-4 py-3">Valor</th>
                <th className="text-left px-4 py-3">Dados Bancarios</th>
                <th className="text-left px-4 py-3">Acao</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-slate-800 align-top">
                  <td className="px-4 py-3 text-slate-200">{item.request_number}</td>
                  <td className="px-4 py-3 text-slate-200">
                    <div className="font-medium text-white">{item.supplier_name}</div>
                    <div className="text-xs text-slate-400">{item.supplier_document}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-200">{formatCurrency(Number(item.amount || 0))}</td>
                  <td className="px-4 py-3 text-slate-200">
                    <div>{item.bank_name || 'Banco nao informado'}</div>
                    <div className="text-xs text-slate-400">
                      Agencia: {item.bank_branch || '-'} | Conta: {item.bank_account || '-'}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">Status fornecedor: {item.supplier_status || 'Nao informado'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => void process(item)}
                      disabled={processingId === item.id}
                      className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {processingId === item.id ? 'Processando...' : 'Confirmar Pagamento'}
                    </button>
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
