import { useEffect, useState } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { paymentService } from '../services/paymentService'
import { AlertCircle, TrendingUp, TrendingDown, Users, AlertTriangle, DollarSign } from 'lucide-react'

interface Analytics {
  period: string
  approval_metrics: {
    total_requests: number
    approved: number
    rejected: number
    pending: number
    approval_rate: number
    rejection_rate: number
    average_approval_time_hours: number
  }
  approval_by_department: Record<string, any>
  blocklist_metrics: {
    total_blocked_suppliers: number
    blocks_this_month: number
    blocks_this_quarter: number
    most_common_reasons: Array<{ reason: string; count: number }>
  }
  high_value_metrics: {
    total_high_value: number
    average_amount: number
    max_amount: number
    requires_superadmin_approval: number
  }
  total_payments_processed: number
  volume_processed: number
}

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6']

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'quarter' | 'year'>('month')
  const [error, setError] = useState('')

  useEffect(() => {
    loadAnalytics()
  }, [period])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await paymentService.getAnalytics(period)
      setAnalytics(response as any)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando análises...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-red-900">Erro ao carregar analytics</h3>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!analytics) return null

  const deptData = Object.entries(analytics.approval_by_department).map(([dept, metrics]: [string, any]) => ({
    name: dept.charAt(0).toUpperCase() + dept.slice(1),
    aprovadas: metrics.approved,
    rejeitadas: metrics.rejected,
    taxa_aprovacao: Math.round(metrics.approval_rate),
  }))

  const reasonsData = analytics.blocklist_metrics.most_common_reasons

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatHours = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}min`
    return `${Math.round(hours)}h`
  }

  const approvalStatusData = [
    { name: 'Aprovadas', value: analytics.approval_metrics.approved, color: '#10b981' },
    { name: 'Rejeitadas', value: analytics.approval_metrics.rejected, color: '#ef4444' },
    { name: 'Pendentes', value: analytics.approval_metrics.pending, color: '#f59e0b' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">📊 Analytics & Relatórios</h1>
        <p className="text-slate-300 mt-2">Período: <span className="font-semibold">{analytics.period}</span></p>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 flex-wrap">
        {(['today', 'week', 'month', 'quarter', 'year'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              period === p
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            {p === 'today' && 'Hoje'}
            {p === 'week' && 'Semana'}
            {p === 'month' && 'Mês'}
            {p === 'quarter' && 'Trimestre'}
            {p === 'year' && 'Ano'}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Taxa de Aprovação */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Taxa de Aprovação</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {analytics.approval_metrics.approval_rate.toFixed(1)}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        {/* Taxa de Rejeição */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Taxa de Rejeição</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {analytics.approval_metrics.rejection_rate.toFixed(1)}%
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-500" />
          </div>
        </div>

        {/* Tempo Médio */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Tempo Médio Aprovação</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {formatHours(analytics.approval_metrics.average_approval_time_hours)}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        {/* Volume Processado */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm font-medium">Volume Processado</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {formatCurrency(analytics.volume_processed).split(',')[0]}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status por Departamento */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Aprovações por Departamento</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={deptData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="aprovadas" fill="#10b981" name="Aprovadas" />
              <Bar dataKey="rejeitadas" fill="#ef4444" name="Rejeitadas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribuição de Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Distribuição de Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={approvalStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {approvalStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Requisições por Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Resumo de Requisições</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Total</span>
              <span className="font-bold text-lg">{analytics.approval_metrics.total_requests}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Aprovadas</span>
              <span className="font-bold text-lg text-green-600">{analytics.approval_metrics.approved}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Rejeitadas</span>
              <span className="font-bold text-lg text-red-600">{analytics.approval_metrics.rejected}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Pendentes</span>
              <span className="font-bold text-lg text-yellow-600">{analytics.approval_metrics.pending}</span>
            </div>
          </div>
        </div>

        {/* Fornecedores Bloqueados */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Blocklist de Fornecedores</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Total Bloqueados</span>
              <span className="font-bold text-lg">{analytics.blocklist_metrics.total_blocked_suppliers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Este Mês</span>
              <span className="font-bold text-lg text-orange-600">{analytics.blocklist_metrics.blocks_this_month}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Este Trimestre</span>
              <span className="font-bold text-lg text-red-600">{analytics.blocklist_metrics.blocks_this_quarter}</span>
            </div>
          </div>
        </div>

        {/* Transações de Alto Valor */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Transações de Alto Valor (&gt;50k)</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Total</span>
              <span className="font-bold text-lg">{analytics.high_value_metrics.total_high_value}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Valor Médio</span>
              <span className="font-bold text-lg">{formatCurrency(analytics.high_value_metrics.average_amount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Maior Valor</span>
              <span className="font-bold text-lg">{formatCurrency(analytics.high_value_metrics.max_amount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Requer Superadmin</span>
              <span className="font-bold text-lg text-purple-600">{analytics.high_value_metrics.requires_superadmin_approval}</span>
            </div>
          </div>
        </div>

        {/* Motivos de Blocklist */}
        {reasonsData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Motivos Mais Comuns de Bloqueia</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reasonsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="reason" width={120} />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" name="Bloqueios" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Pagamentos Processados */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Pagamentos Processados neste Período</h2>
        <p className="text-sm text-slate-600">
          {analytics.total_payments_processed} pagamentos processados com volume total de{' '}
          <span className="font-bold text-indigo-600">{formatCurrency(analytics.volume_processed)}</span>
        </p>
      </div>
    </div>
  )
}
