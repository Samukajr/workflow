import { useState } from 'react'
import { apiClient } from '@/services/api'
import { useAuthStore } from '@/store/authStore'

type ReportType = 'payments' | 'validations' | 'audit'
type ReportFormat = 'pdf' | 'excel'

function normalizeRole(role?: string): string {
  return (role || '').toUpperCase().trim()
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.URL.revokeObjectURL(url)
}

export default function RelatoriosPage() {
  const { user } = useAuthStore()
  const role = normalizeRole(user?.tipo || user?.departamento)
  const isSuperadmin = role === 'SUPERADMIN' || role === 'SUPER_ADMIN'

  const [loading, setLoading] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const exportReport = async (type: ReportType, format: ReportFormat) => {
    if (!isSuperadmin) {
      setMessage('Apenas superadmin pode exportar relatórios em PDF ou Excel.')
      return
    }

    const loadingKey = `${type}-${format}`
    setLoading(loadingKey)
    setMessage('')

    try {
      const response = await apiClient.download('/payments/reports/export', {
        type,
        format,
        limit: 1000,
      })

      const date = new Date().toISOString().slice(0, 10)
      const extension = format === 'excel' ? 'xlsx' : 'pdf'
      const fileName = `relatorio-${type}-${date}.${extension}`

      triggerDownload(response.data as Blob, fileName)
      setMessage('Relatório gerado com sucesso.')
    } catch {
      setMessage('Erro ao gerar relatório. Tente novamente em instantes.')
    } finally {
      setLoading(null)
    }
  }

  const cards: Array<{ title: string; type: ReportType }> = [
    { title: 'Relatório de Pagamentos', type: 'payments' },
    { title: 'Relatório de Validações', type: 'validations' },
    { title: 'Relatório de Auditoria', type: 'audit' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Relatórios</h1>

      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-sm text-indigo-900">
        {isSuperadmin
          ? 'Perfil superadmin habilitado para exportar relatórios em PDF e Excel.'
          : 'Seu perfil não possui permissão para exportação. Faça login com superadmin.'}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.type} className="bg-white rounded-lg shadow p-6 space-y-4">
            <h3 className="font-bold">{card.title}</h3>
            <div className="flex gap-2">
              <button
                onClick={() => exportReport(card.type, 'pdf')}
                disabled={loading !== null}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-60"
              >
                {loading === `${card.type}-pdf` ? 'Gerando...' : 'Exportar PDF'}
              </button>
              <button
                onClick={() => exportReport(card.type, 'excel')}
                disabled={loading !== null}
                className="bg-emerald-600 text-white px-4 py-2 rounded text-sm hover:bg-emerald-700 disabled:opacity-60"
              >
                {loading === `${card.type}-excel` ? 'Gerando...' : 'Exportar Excel'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {message && <p className="text-center text-gray-700">{message}</p>}
    </div>
  )
}
