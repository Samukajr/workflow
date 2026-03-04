import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-blue-600">Workflow Pagamentos</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">{user?.nome}</span>
            <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded">
              {user?.departamento}
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <div className="flex">
        <nav className="w-64 bg-white shadow-lg">
          <ul className="space-y-1 p-4">
            <li>
              <a href="/" className="block px-4 py-2 rounded hover:bg-blue-50 text-gray-700">
                📊 Dashboard
              </a>
            </li>
            <li>
              <a href="/requisicoes" className="block px-4 py-2 rounded hover:bg-blue-50 text-gray-700">
                📋 Requisições
              </a>
            </li>
            {user?.tipo !== 'SUBMISSAO' && (
              <li>
                <a href="/validacoes" className="block px-4 py-2 rounded hover:bg-blue-50 text-gray-700">
                  ✓ Validações
                </a>
              </li>
            )}
            {user?.tipo === 'FINANCEIRO' && (
              <<li>
                <a href="/pagamentos" className="block px-4 py-2 rounded hover:bg-blue-50 text-gray-700">
                  💰 Pagamentos
                </a>
              </li>
            )}
            <li>
              <a href="/relatorios" className="block px-4 py-2 rounded hover:bg-blue-50 text-gray-700">
                📈 Relatórios
              </a>
            </li>
          </ul>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
