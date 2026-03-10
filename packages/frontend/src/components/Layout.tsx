import { useAuthStore } from '@/store/authStore'
import { NavLink, useNavigate } from 'react-router-dom'

type MenuItem = {
  label: string
  path: string
}

function normalizeRole(role?: string): string {
  return (role || '').toUpperCase().trim()
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const role = normalizeRole(user?.tipo || user?.departamento)

  const menuByRole: Record<string, MenuItem[]> = {
    SUBMISSAO: [
      { label: 'Submeter Requisicao', path: '/submit' },
      { label: 'Minhas Requisicoes', path: '/payments' },
      { label: 'Regras de Alçadas', path: '/alcadas' },
    ],
    VALIDACAO: [
      { label: 'Validar Requisicoes', path: '/validate' },
      { label: 'Todas Requisicoes', path: '/payments' },
      { label: 'Regras de Alçadas', path: '/alcadas' },
      { label: 'Fornecedores Bloqueados', path: '/blocklist' },
    ],
    FINANCEIRO: [
      { label: 'Processar Pagamentos', path: '/process' },
      { label: 'Todas Requisicoes', path: '/payments' },
      { label: 'Regras de Alçadas', path: '/alcadas' },
    ],
    ADMIN: [
      { label: 'Submeter Requisicao', path: '/submit' },
      { label: 'Validar Requisicoes', path: '/validate' },
      { label: 'Processar Pagamentos', path: '/process' },
      { label: 'Todas Requisicoes', path: '/payments' },
      { label: 'Relatorios', path: '/relatorios' },
      { label: 'Analytics', path: '/analytics' },
      { label: 'Integrações Bancárias', path: '/banking' },
      { label: 'Regras de Alçadas', path: '/alcadas' },
      { label: 'Fornecedores Bloqueados', path: '/blocklist' },
    ],
    SUPER_ADMIN: [
      { label: 'Submeter Requisicao', path: '/submit' },
      { label: 'Validar Requisicoes', path: '/validate' },
      { label: 'Processar Pagamentos', path: '/process' },
      { label: 'Todas Requisicoes', path: '/payments' },
      { label: 'Relatorios', path: '/relatorios' },
      { label: 'Analytics', path: '/analytics' },
      { label: 'Integrações Bancárias', path: '/banking' },
      { label: 'Regras de Alçadas', path: '/alcadas' },
      { label: 'Fornecedores Bloqueados', path: '/blocklist' },
    ],
    SUPERADMIN: [
      { label: 'Submeter Requisicao', path: '/submit' },
      { label: 'Validar Requisicoes', path: '/validate' },
      { label: 'Processar Pagamentos', path: '/process' },
      { label: 'Todas Requisicoes', path: '/payments' },
      { label: 'Relatorios', path: '/relatorios' },
      { label: 'Analytics', path: '/analytics' },
      { label: 'Integrações Bancárias', path: '/banking' },
      { label: 'Regras de Alçadas', path: '/alcadas' },
      { label: 'Fornecedores Bloqueados', path: '/blocklist' },
    ],
  }

  const links = menuByRole[role] || [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Todas Requisicoes', path: '/payments' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center gap-3">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-indigo-700">Workflow Pagamentos</h1>
          </div>
          <div className="flex items-center space-x-4 flex-wrap justify-end">
            <span className="text-slate-700">{user?.nome}</span>
            <span className="text-sm bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">
              {role || 'USUARIO'}
            </span>
            <button
              onClick={handleLogout}
              className="bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <div className="flex">
        <nav className="w-72 bg-white border-r border-slate-200 min-h-[calc(100vh-73px)]">
          <ul className="space-y-1 p-4">
            <li>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `block px-4 py-2 rounded-lg ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-indigo-50'}`
                }
              >
                Dashboard
              </NavLink>
            </li>

            {links.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded-lg ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-indigo-50'}`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
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
