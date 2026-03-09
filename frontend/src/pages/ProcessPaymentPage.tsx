import { useEffect, useState } from 'react';
import { paymentService } from '@/services/paymentService';
import { PaymentRequest } from '@/types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export function ProcessPaymentPage() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    transaction_id: '',
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchValidatedRequests();
  }, []);

  const fetchValidatedRequests = async () => {
    setLoading(true);
    try {
      const response = await paymentService.listPaymentRequests('validado');
      if (response.data) {
        setRequests(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar requisições validadas');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (request: PaymentRequest) => {
    setSelectedRequest(request);
    setFormData({
      transaction_id: '',
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
    setFormData({
      transaction_id: '',
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProcessPayment = async () => {
    if (!selectedRequest) return;

    if (!formData.transaction_id.trim()) {
      toast.error('ID da transação é obrigatório');
      return;
    }

    setProcessing(true);
    try {
      await paymentService.processPayment({
        payment_request_id: selectedRequest.id,
        transaction_id: formData.transaction_id,
        payment_date: formData.payment_date,
        notes: formData.notes || undefined,
      });

      toast.success('Pagamento processado com sucesso!');
      closeModal();
      fetchValidatedRequests();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Erro ao processar pagamento');
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
        <h1 className="text-3xl font-bold">Processar Pagamentos</h1>
        <button
          onClick={fetchValidatedRequests}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
        >
          🔄 Atualizar
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <div className="text-6xl mb-4">💰</div>
          <h2 className="text-xl font-semibold mb-2">Nenhuma requisição para pagamento</h2>
          <p className="text-gray-600">Não há requisições validadas aguardando pagamento no momento.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  <strong>{requests.length}</strong> requisição(ões) validada(s) aguardando processamento de pagamento.
                </p>
              </div>
            </div>
          </div>

          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Nº Requisição</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Tipo</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Fornecedor</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Valor</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Vencimento</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Validado em</th>
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
                    <span className="font-semibold text-lg text-green-600">{formatCurrency(request.amount)}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm">
                      {format(new Date(request.due_date), 'dd/MM/yyyy')}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-gray-500">
                      {format(new Date(request.updated_at), 'dd/MM/yyyy HH:mm')}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => openModal(request)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors"
                      >
                        💳 Processar Pagamento
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

      {/* Modal de Processamento */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-8">
            <h2 className="text-2xl font-bold mb-6">💳 Processar Pagamento</h2>

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
                  <p className="text-sm text-gray-600">CNPJ/CPF</p>
                  <p className="font-semibold">{selectedRequest.supplier_document}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Valor a Pagar</p>
                  <p className="font-semibold text-lg text-green-600">{formatCurrency(selectedRequest.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vencimento</p>
                  <p className="font-semibold">{format(new Date(selectedRequest.due_date), 'dd/MM/yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tipo de Documento</p>
                  <p className="font-semibold">
                    {selectedRequest.document_type === 'nf' ? 'Nota Fiscal' : 'Boleto'}
                  </p>
                </div>
              </div>
              {selectedRequest.notes && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">Observações da Submissão</p>
                  <p className="text-sm">{selectedRequest.notes}</p>
                </div>
              )}
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID da Transação / Comprovante *
                </label>
                <input
                  type="text"
                  name="transaction_id"
                  value={formData.transaction_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ex: TRX-123456789 ou número do comprovante"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Identificador único da transação bancária ou número do comprovante
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data do Pagamento *
                </label>
                <input
                  type="date"
                  name="payment_date"
                  value={formData.payment_date}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações (opcional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  placeholder="Adicione observações sobre o pagamento..."
                />
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Atenção:</strong> Certifique-se de que o pagamento foi realmente efetuado antes de confirmar.
                    Esta ação não pode ser desfeita.
                  </p>
                </div>
              </div>
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
                onClick={handleProcessPayment}
                disabled={processing || !formData.transaction_id.trim()}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {processing ? 'Processando...' : '✓ Confirmar Pagamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
