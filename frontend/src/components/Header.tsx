import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-primary">Workflow Pagamentos</h1>
          {user && <span className="text-gray-600">|</span>}
          {user && <span className="text-sm text-gray-600">{user.department}</span>}
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.name}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-error text-white rounded hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}
