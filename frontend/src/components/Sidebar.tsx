import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function Sidebar() {
  const { user } = useAuth();

  const navigationLinks = {
    submissao: [{ label: 'Submeter Requisição', path: '/submit' }],
    validacao: [
      { label: 'Validar Requisições', path: '/validate' },
      { label: 'Minhas Validações', path: '/my-validations' },
    ],
    financeiro: [
      { label: 'Processar Pagamentos', path: '/process' },
      { label: 'Histórico', path: '/history' },
    ],
  };

  const links = user ? navigationLinks[user.department] || [] : [];

  return (
    <aside className="bg-gray-800 text-white w-64 min-h-screen">
      <nav className="p-4">
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
    </aside>
  );
}
