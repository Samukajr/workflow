import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { paymentService } from '@/services/paymentService';
import { PaymentRequest, PaymentWorkflow } from '@/types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  pendente_validacao: { label: 'Pendente de Validação', color: 'text-yellow-800', bgColor: 'bg-yellow-100', icon: '⏳' },
  validado: { label: 'Validado', color: 'text-blue-800', bgColor: 'bg-blue-100', icon: '✓' },
  rejeitado: { label: 'Rejeitado', color: 'text-red-800', bgColor: 'bg-red-100', icon: '✗' },
  em_pagamento: { label: 'Em Pagamento', color: 'text-purple-800', bgColor: 'bg-purple-100', icon: '💳' },
  pago: { label: 'Pago', color: 'text-green-800', bgColor: 'bg-green-100', icon: '✓' },
};

export function PaymentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<PaymentRequest | null>(null);
  const [workflow, setWorkflow] = useState<PaymentWorkflow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPaymentDetails = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    try {
      const response = await paymentService.getPaymentRequest(id);
      if (response.data) {
        setRequest(response.data.request);
        setWorkflow(response.data.workflow);
      }
    } catch (error) {
      toast.error('Erro ao carregar detalhes da requisição');
      navigate('/payments');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (id) {
      fetchPaymentDetails();
    }
  }, [id, fetchPaymentDetails]);

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
      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${config.bgColor} ${config.color}`}>
        {config.icon} {config.label}
      </span>
    );
  };

  const getActionIcon = (action: string) => {
    const icons: Record<string, string> = {
      submissao: '📝',
      validacao: '✓',
      pagamento: '💳',
      confirmacao_pagamento: '✅',
      rejeicao: '✗',
    };
    return icons[action] || '•';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Carregando detalhes...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold mb-2">Requisição não encontrada</h2>
          <button
            onClick={() => navigate('/payments')}
            className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            Voltar para listagem
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/payments')}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
        >
          ← Voltar
        </button>
        <h1 className="text-3xl font-bold">Detalhes da Requisição</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal - Informações */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card de Informações Gerais */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold mb-2">Informações Gerais</h2>
                <p className="text-gray-600 font-mono text-sm">{request.request_number}</p>
              </div>
              <div>{getStatusBadge(request.status)}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tipo de Documento</p>
                <p className="font-semibold">
                  {request.document_type === 'nf' ? '📄 Nota Fiscal' : '📋 Boleto'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Valor</p>
                <p className="font-semibold text-2xl text-green-600">{formatCurrency(request.amount)}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Fornecedor</p>
                <p className="font-semibold">{request.supplier_name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">CNPJ/CPF</p>
                <p className="font-semibold font-mono">{request.supplier_document}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Data de Vencimento</p>
                <p className="font-semibold">{format(new Date(request.due_date), 'dd/MM/yyyy')}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Data de Criação</p>
                <p className="font-semibold">{format(new Date(request.created_at), 'dd/MM/yyyy HH:mm')}</p>
              </div>

              {request.updated_at !== request.created_at && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Última Atualização</p>
                  <p className="font-semibold">{format(new Date(request.updated_at), 'dd/MM/yyyy HH:mm')}</p>
                </div>
              )}
            </div>

            {request.notes && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Observações</p>
                <p className="text-sm">{request.notes}</p>
              </div>
            )}

            {request.document_url && (
              <div className="mt-6">
                <a
                  href={`${import.meta.env.VITE_API_URL}${request.document_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  📎 Visualizar Documento
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Coluna Lateral - Timeline do Workflow */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-4">
            <h2 className="text-xl font-bold mb-6">Histórico do Workflow</h2>

            {workflow.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhuma ação registrada ainda</p>
            ) : (
              <div className="relative">
                {/* Linha vertical */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                <div className="space-y-6">
                  {workflow.map((item) => (
                    <div key={item.id} className="relative pl-10">
                      {/* Bolinha */}
                      <div className="absolute left-0 top-1 w-8 h-8 bg-white border-4 border-primary rounded-full flex items-center justify-center z-10">
                        <span className="text-xs">{getActionIcon(item.action)}</span>
                      </div>

                      {/* Conteúdo */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="font-semibold text-sm mb-1">{item.action}</p>
                        
                        {item.status_from && item.status_to && (
                          <div className="flex items-center gap-2 text-xs mb-2">
                            <span className="text-gray-500">{item.status_from}</span>
                            <span>→</span>
                            <span className="text-gray-700 font-semibold">{item.status_to}</span>
                          </div>
                        )}

                        {item.comments && (
                          <p className="text-sm text-gray-700 mb-2">{item.comments}</p>
                        )}

                        <p className="text-xs text-gray-500">
                          {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
