import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { paymentService } from '@/services/paymentService';
import { PaymentRequest } from '@/types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

type StatusFilter = 'all' | 'pendente_validacao' | 'validado' | 'rejeitado' | 'em_pagamento' | 'pago';

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  pendente_validacao: { label: 'Pendente', color: 'text-yellow-800', bgColor: 'bg-yellow-100', icon: '⏳' },
  validado: { label: 'Validado', color: 'text-blue-800', bgColor: 'bg-blue-100', icon: '✓' },
  rejeitado: { label: 'Rejeitado', color: 'text-red-800', bgColor: 'bg-red-100', icon: '✗' },
  em_pagamento: { label: 'Em Pagamento', color: 'text-purple-800', bgColor: 'bg-purple-100', icon: '💳' },
  pago: { label: 'Pago', color: 'text-green-800', bgColor: 'bg-green-100', icon: '✓' },
};

export function PaymentListPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filterRequests = useCallback(() => {
    let filtered = [...requests];

    // Filtrar por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

    // Filtrar por busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.request_number.toLowerCase().includes(term) ||
          req.supplier_name.toLowerCase().includes(term) ||
          req.supplier_document.toLowerCase().includes(term)
      );
    }

    setFilteredRequests(filtered);
  }, [requests, statusFilter, searchTerm]);

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [filterRequests]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await paymentService.listPaymentRequests();
      if (response.data) {
        setRequests(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar requisições');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || {
      label: status,
      color: 'text-gray-800',
      bgColor: 'bg-gray-100',
      icon: '•',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.color}`}>
        {config.icon} {config.label}
      </span>
    );
  };

  const getStatusCount = (status: StatusFilter) => {
    if (status === 'all') return requests.length;
    return requests.filter((req) => req.status === status).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Carregando requisições...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Requisições de Pagamento</h1>
        <button
          onClick={fetchRequests}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
        >
          🔄 Atualizar
        </button>
      </div>

      {/* Filtros por Status */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              statusFilter === 'all'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todas ({getStatusCount('all')})
          </button>
          <button
            onClick={() => setStatusFilter('pendente_validacao')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              statusFilter === 'pendente_validacao'
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ⏳ Pendente ({getStatusCount('pendente_validacao')})
          </button>
          <button
            onClick={() => setStatusFilter('validado')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              statusFilter === 'validado'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ✓ Validado ({getStatusCount('validado')})
          </button>
          <button
            onClick={() => setStatusFilter('em_pagamento')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              statusFilter === 'em_pagamento'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            💳 Em Pagamento ({getStatusCount('em_pagamento')})
          </button>
          <button
            onClick={() => setStatusFilter('pago')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              statusFilter === 'pago'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ✓ Pago ({getStatusCount('pago')})
          </button>
          <button
            onClick={() => setStatusFilter('rejeitado')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              statusFilter === 'rejeitado'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ✗ Rejeitado ({getStatusCount('rejeitado')})
          </button>
        </div>
      </div>

      {/* Busca */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por número de requisição, fornecedor ou documento..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Tabela de Requisições */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-xl font-semibold mb-2">Nenhuma requisição encontrada</h2>
          <p className="text-gray-600">
            {searchTerm.trim()
              ? 'Tente ajustar os filtros ou termo de busca.'
              : 'Não há requisições com os filtros selecionados.'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden mb-4">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Nº Requisição</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Tipo</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Fornecedor</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Valor</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Vencimento</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Criado em</th>
                  <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr
                    key={request.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/payments/${request.id}`)}
                  >
                    <td className="py-4 px-6">
                      <span className="font-mono text-sm font-semibold">{request.request_number}</span>
                    </td>
                    <td className="py-4 px-6">{getStatusBadge(request.status)}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        request.document_type === 'nf' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {request.document_type === 'nf' ? '📄 NF' : '📋 Boleto'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium">{request.supplier_name}</p>
                        <p className="text-sm text-gray-500">{request.supplier_document}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold">{formatCurrency(request.amount)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm">{format(new Date(request.due_date), 'dd/MM/yyyy')}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-500">
                        {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm')}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/payments/${request.id}`);
                          }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold transition-colors"
                        >
                          👁️ Ver
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-sm text-gray-600 text-center">
            Mostrando <strong>{filteredRequests.length}</strong> de <strong>{requests.length}</strong> requisições
          </div>
        </>
      )}
    </div>
  );
}
