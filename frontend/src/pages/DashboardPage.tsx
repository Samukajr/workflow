import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { paymentService } from '@/services/paymentService';
import { DashboardStats } from '@/types';
import toast from 'react-hot-toast';

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await paymentService.getDashboardStats();
        if (response.data) {
          setStats(response.data);
        }
      } catch (error) {
        toast.error('Erro ao carregar estatísticas');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Pendente de Validação</h3>
          <p className="text-3xl font-bold text-warning">{stats?.pendingValidation || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Validados</h3>
          <p className="text-3xl font-bold text-info">{stats?.validated || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Pagos</h3>
          <p className="text-3xl font-bold text-success">{stats?.paid || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm font-semibold mb-2">Rejeitados</h3>
          <p className="text-3xl font-bold text-error">{stats?.rejected || 0}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Bem-vindo,  {user?.name}</h2>
        <p className="text-gray-600">
          Você está logado como <strong>{user?.department}</strong>
        </p>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">Próximos passos:</h3>
          {user?.department === 'submissao' && (
            <p className="text-gray-700">Navegue para "Submeter Requisição" para enviar uma nota fiscal ou boleto para pagamento.</p>
          )}
          {user?.department === 'validacao' && (
            <p className="text-gray-700">
              Navegue para "Validar Requisições" para revisar e aprovar/rejeitar requisições de pagamento.
            </p>
          )}
          {user?.department === 'financeiro' && (
            <p className="text-gray-700">Navegue para "Processar Pagamentos" para confirmar pagamentos validados.</p>
          )}
        </div>
      </div>
    </div>
  );
}
