import { useState, useEffect } from 'react'
import { Plus, Trash2, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { paymentService } from '../services/paymentService'

interface BankIntegration {
  id: string
  bank_type: string
  name: string
  is_active: boolean
  supported_methods: string[]
  last_sync_at?: string
  error_log?: string
}

interface ReconcilationItem {
  id: string
  payment_request_id: string
  external_payment_id: string
  status: 'pendente' | 'confirmado' | 'divergencia' | 'falha'
  local_amount: number
  bank_amount?: number
  created_at: string
}

export default function BankingIntegrationPage() {
  const [integrations, setIntegrations] = useState<BankIntegration[]>([])
  const [reconciliations, setReconciliations] = useState<ReconcilationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    bank_type: 'inter',
    name: '',
    api_key: '',
    api_secret: '',
    supported_methods: ['ted', 'pix'] as string[],
  })

  useEffect(() => {
    loadIntegrations()
    loadReconciliations()
    // Atualizar a cada 30 segundos
    const interval = setInterval(() => {
      loadReconciliations()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadIntegrations = async () => {
    try {
      const response = await paymentService.getBankingIntegrations()
      setIntegrations(response.data || [])
    } catch (error: any) {
      console.error('Erro ao carregar integrações:', error)
    }
  }

  const loadReconciliations = async () => {
    try {
      const response = await paymentService.getPendingReconciliations()
      setReconciliations(response.data?.reconciliations || [])
    } catch (error: any) {
      console.error('Erro ao carregar reconciliações:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddIntegration = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await paymentService.createBankingIntegration(formData)
      setShowAddModal(false)
      setFormData({
        bank_type: 'inter',
        name: '',
        api_key: '',
        api_secret: '',
        supported_methods: ['ted', 'pix'],
      })
      loadIntegrations()
    } catch (error: any) {
      alert('Erro ao criar integração: ' + error.message)
    }
  }

  const handleTestConnection = async (integrationId: string) => {
    setTestingId(integrationId)
    try {
      const response = await paymentService.testBankingConnection(integrationId)
      alert(response.data.connected ? '✅ Conexão OK!' : '❌ Falha na conexão')
      loadIntegrations()
    } catch (error: any) {
      alert('Erro ao testar: ' + error.message)
    } finally {
      setTestingId(null)
    }
  }

  const getReconciliationBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; icon: JSX.Element }> = {
      confirmado: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <CheckCircle className="w-4 h-4" />,
      },
      pendente: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: <AlertCircle className="w-4 h-4" />,
      },
      divergencia: {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
        icon: <AlertCircle className="w-4 h-4" />,
      },
      falha: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: <AlertCircle className="w-4 h-4" />,
      },
    }
    const badge = badges[status] || badges.pendente
    return (
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${badge.bg} ${badge.text}`}>
        {badge.icon}
        <span className="text-sm font-medium">{status}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">🏦 Integrações Bancárias</h1>
          <p className="text-slate-300 mt-1">Gerenciar conexões com bancos e processar pagamentos</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Integração
        </button>
      </div>

      {/* Integrações */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Integrações Ativas</h2>
          
          {integrations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">Nenhuma integração configurada ainda</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {integrations.map((integration) => (
                <div
                  key={integration.id}
                  className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-slate-800">{integration.name}</h3>
                      <p className="text-sm text-slate-500 capitalize">{integration.bank_type}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        integration.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {integration.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs text-slate-600 mb-1">Métodos suportados:</p>
                    <div className="flex flex-wrap gap-2">
                      {integration.supported_methods.map((method) => (
                        <span
                          key={method}
                          className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded"
                        >
                          {method.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>

                  {integration.last_sync_at && (
                    <p className="text-xs text-slate-500 mb-3">
                      Última sincronização:{' '}
                      {new Date(integration.last_sync_at).toLocaleString('pt-BR')}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTestConnection(integration.id)}
                      disabled={testingId === integration.id}
                      className="flex-1 bg-slate-200 text-slate-800 px-3 py-2 rounded text-sm hover:bg-slate-300 flex items-center justify-center gap-2"
                    >
                      {testingId === integration.id ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Testando...
                        </>
                      ) : (
                        'Testar Conexão'
                      )}
                    </button>
                    <button className="text-red-600 hover:text-red-800 p-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reconciliações Pendentes */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            Reconciliações Pendentes ({reconciliations.filter((r) => r.status === 'pendente').length})
          </h2>

          {reconciliations.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-slate-600">Todos os pagamentos estão reconciliados!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b">
                    <th className="px-4 py-3 text-left font-semibold">Pagamento Externo</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Valor Local</th>
                    <th className="px-4 py-3 text-right font-semibold">Valor Banco</th>
                    <th className="px-4 py-3 text-left font-semibold">Criado em</th>
                  </tr>
                </thead>
                <tbody>
                  {reconciliations.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs">{item.external_payment_id}</td>
                      <td className="px-4 py-3">{getReconciliationBadge(item.status)}</td>
                      <td className="px-4 py-3 text-right">
                        R$ {item.local_amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.bank_amount ? `R$ ${item.bank_amount.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {new Date(item.created_at).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Nova Integração */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold">Nova Integração Bancária</h3>
            </div>

            <form onSubmit={handleAddIntegration} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tipo de Banco
                </label>
                <select
                  value={formData.bank_type}
                  onChange={(e) =>
                    setFormData({ ...formData, bank_type: e.target.value })
                  }
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                >
                  <option value="inter">Inter Bank</option>
                  <option value="bankaool">Bankaool</option>
                  <option value="manual">Manual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: Inter Produktion"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  required
                />
              </div>

              {formData.bank_type !== 'manual' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      API Key
                    </label>
                    <input
                      type="password"
                      value={formData.api_key}
                      onChange={(e) =>
                        setFormData({ ...formData, api_key: e.target.value })
                      }
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      API Secret
                    </label>
                    <input
                      type="password"
                      value={formData.api_secret}
                      onChange={(e) =>
                        setFormData({ ...formData, api_secret: e.target.value })
                      }
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
