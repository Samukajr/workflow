
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function Sidebar() {
  const { user } = useAuth();

  const navigationLinks = {
    submissao: [
      { label: '📝 Submeter Requisição', path: '/submit' },
      { label: '📋 Minhas Requisições', path: '/payments' },
    ],
    validacao: [
      { label: '✓ Validar Requisições', path: '/validate' },
      { label: '📋 Todas Requisições', path: '/payments' },
    ],
    financeiro: [
      { label: '💳 Processar Pagamentos', path: '/process' },
      { label: '📋 Todas Requisições', path: '/payments' },
    ],
    admin: [
      { label: '📝 Submeter Requisição', path: '/submit' },
      { label: '✓ Validar Requisições', path: '/validate' },
      { label: '💳 Processar Pagamentos', path: '/process' },
      { label: '📋 Todas Requisições', path: '/payments' },
    ],
    superadmin: [
      { label: '📝 Submeter Requisição', path: '/submit' },
      { label: '✓ Validar Requisições', path: '/validate' },
      { label: '💳 Processar Pagamentos', path: '/process' },
      { label: '📋 Todas Requisições', path: '/payments' },
    ],
  };

  const links = user ? navigationLinks[user.department] || [] : [];

  return (
    <aside className="bg-gray-800 text-white w-64 min-h-screen flex flex-col">
      <nav className="p-4 flex-1">
        <ul className="space-y-2">
          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `block px-4 py-2 rounded ${isActive ? 'bg-primary text-white' : 'hover:bg-gray-700'}`
              }
            >
              Dashboard
            </NavLink>
          </li>

          {links.map((link) => (
            <li key={link.path}>
              <NavLink
                to={link.path}
                className={({ isActive }) =>
                  `block px-4 py-2 rounded ${isActive ? 'bg-primary text-white' : 'hover:bg-gray-700'}`
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <nav className="p-4 border-t border-gray-700">
        <ul className="space-y-2">
          <li>
            <NavLink
              to="/lgpd"
              className={({ isActive }) =>
                `block px-4 py-2 rounded text-sm ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`
              }
            >
              🔒 Privacidade (LGPD)
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
