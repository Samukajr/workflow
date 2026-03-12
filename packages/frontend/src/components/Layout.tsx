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
      { label: 'Cadastro Fornecedores', path: '/suppliers' },
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
      { label: 'Cadastro Fornecedores', path: '/suppliers' },
      { label: 'Relatorios', path: '/relatorios' },
      { label: 'Analytics', path: '/analytics' },
      { label: 'Integrações Bancárias', path: '/banking' },
      { label: 'Regras de Alçadas', path: '/alcadas' },
      { label: 'Fornecedores Bloqueados', path: '/blocklist' },
      { label: 'Gerenciar Usuários', path: '/users' },
    ],
    SUPERADMIN: [
      { label: 'Submeter Requisicao', path: '/submit' },
      { label: 'Validar Requisicoes', path: '/validate' },
      { label: 'Processar Pagamentos', path: '/process' },
      { label: 'Todas Requisicoes', path: '/payments' },
      { label: 'Cadastro Fornecedores', path: '/suppliers' },
      { label: 'Relatorios', path: '/relatorios' },
      { label: 'Analytics', path: '/analytics' },
      { label: 'Integrações Bancárias', path: '/banking' },
      { label: 'Regras de Alçadas', path: '/alcadas' },
      { label: 'Fornecedores Bloqueados', path: '/blocklist' },
      { label: 'Gerenciar Usuários', path: '/users' },
    ],
  }

  const links = menuByRole[role] || [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Todas Requisicoes', path: '/payments' },
  ]

  const hasPrivacyLink = links.some((item) => item.path === '/lgpd')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="market-bg min-h-screen">
      {/* Header */}
      <header className="header-glass sticky top-0 z-30">
        <div className="max-w-full px-6 py-3 flex justify-between items-center gap-3">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-white tracking-wide">
              Workflow Pagamentos
            </h1>
          </div>
          <div className="flex items-center space-x-4 flex-wrap justify-end">
            <span className="text-slate-200 text-sm">{user?.nome}</span>
            <span className="text-xs bg-indigo-600/90 text-white px-3 py-1 rounded-full font-semibold tracking-wide border border-indigo-500/50">
              {role || 'USUARIO'}
            </span>
            <button
              onClick={handleLogout}
              className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <div className="flex relative z-10">
        <nav className="sidebar-glass w-64 min-h-[calc(100vh-53px)] flex-shrink-0">
          {/* Logo / branding strip */}
          <div className="px-4 pt-4 pb-2 border-b border-white/10">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Menu</p>
          </div>
          <ul className="space-y-0.5 p-3">
            <li>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white'
                  }`
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
                    `flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                        : 'text-slate-200 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}

            {!hasPrivacyLink && (
              <li>
                <NavLink
                  to="/lgpd"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                        : 'text-slate-200 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  Privacidade e Segurança
                </NavLink>
              </li>
            )}

            <li>
              <NavLink
                to="/2fa"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                Autenticação 2-Fatores
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/account"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                Configurações da Conta
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6 main-glass min-h-[calc(100vh-53px)]">
          {children}
        </main>
      </div>
    </div>
  )
}
