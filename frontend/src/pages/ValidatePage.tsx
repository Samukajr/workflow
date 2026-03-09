import { useEffect, useState } from 'react';
import { paymentService } from '@/services/paymentService';
import { PaymentRequest } from '@/types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export function ValidatePage() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [comments, setComments] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const response = await paymentService.listPaymentRequests('pendente_validacao');
      if (response.data) {
        setRequests(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar requisições pendentes');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (request: PaymentRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
    setComments('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
    setComments('');
  };

  const handleValidation = async () => {
    if (!selectedRequest) return;

    setProcessing(true);
    try {
      await paymentService.validatePaymentRequest({
        payment_request_id: selectedRequest.id,
        approved: actionType === 'approve',
        comments: comments || undefined,
      });

      toast.success(
        actionType === 'approve' 
          ? 'Requisição aprovada com sucesso!' 
          : 'Requisição rejeitada com sucesso!'
      );

      closeModal();
      fetchPendingRequests();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Erro ao processar validação');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
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
        <h1 className="text-3xl font-bold">Validar Requisições</h1>
        <button
          onClick={fetchPendingRequests}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
        >
          🔄 Atualizar
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-xl font-semibold mb-2">Nenhuma requisição pendente</h2>
          <p className="text-gray-600">Todas as requisições foram validadas!</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Nº Requisição</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Tipo</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Fornecedor</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Valor</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Vencimento</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Data Submissão</th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    <span className="font-mono text-sm font-semibold">{request.request_number}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      request.document_type === 'nf' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {request.document_type === 'nf' ? '📄 Nota Fiscal' : '📋 Boleto'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium">{request.supplier_name}</p>
                      <p className="text-sm text-gray-500">{request.supplier_document}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-semibold text-lg">{formatCurrency(request.amount)}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm">
                      {format(new Date(request.due_date), 'dd/MM/yyyy')}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-gray-500">
                      {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm')}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => openModal(request, 'approve')}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors"
                      >
                        ✓ Aprovar
                      </button>
                      <button
                        onClick={() => openModal(request, 'reject')}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
                      >
                        ✗ Rejeitar
                      </button>
                      <a
                        href={`${import.meta.env.VITE_API_URL}${request.document_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
                      >
                        📎 Ver Doc
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Confirmação */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-8">
            <h2 className="text-2xl font-bold mb-6">
              {actionType === 'approve' ? '✅ Aprovar Requisição' : '❌ Rejeitar Requisição'}
            </h2>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nº Requisição</p>
                  <p className="font-semibold">{selectedRequest.request_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fornecedor</p>
                  <p className="font-semibold">{selectedRequest.supplier_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Valor</p>
                  <p className="font-semibold text-lg">{formatCurrency(selectedRequest.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vencimento</p>
                  <p className="font-semibold">{format(new Date(selectedRequest.due_date), 'dd/MM/yyyy')}</p>
                </div>
              </div>
              {selectedRequest.notes && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">Observações</p>
                  <p className="text-sm">{selectedRequest.notes}</p>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comentários {actionType === 'reject' && '(Obrigatório para rejeição)'}
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                rows={4}
                placeholder={
                  actionType === 'approve'
                    ? 'Adicione comentários sobre a aprovação (opcional)'
                    : 'Explique o motivo da rejeição (obrigatório)'
                }
              />
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={closeModal}
                disabled={processing}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleValidation}
                disabled={processing || (actionType === 'reject' && !comments.trim())}
                className={`px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 ${
                  actionType === 'approve'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {processing ? 'Processando...' : `Confirmar ${actionType === 'approve' ? 'Aprovação' : 'Rejeição'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
