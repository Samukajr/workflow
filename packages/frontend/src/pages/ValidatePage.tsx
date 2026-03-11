import { useState, useEffect } from 'react';
import { paymentService, PaymentRequest, ChecklistItem, ChecklistTemplate } from '../services/paymentService';

export default function ValidatePage() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<{ template: ChecklistTemplate; checked: string[] } | null>(null);
  const [comments, setComments] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const loadPendingRequests = async () => {
    setLoading(true);
    try {
      const response = await paymentService.list({ status: 'pendente_validacao' });
      setRequests(response.data);
    } catch (error) {
      console.error('Erro ao carregar requisições:', error);
    } finally {
      setLoading(false);
    }
  };

  const openValidationModal = async (requestId: string) => {
    setSelectedRequest(requestId);
    setComments('');
    setShowModal(true);

    // Carregar checklist
    try {
      const checklistData = await paymentService.getChecklist(requestId);
      if (checklistData.data) {
        setChecklist({
          template: checklistData.data.template,
          checked: checklistData.data.checklist.checked_items || [],
        });
      }
    } catch (error) {
      console.error('Erro ao carregar checklist:', error);
      setChecklist(null);
    }
  };

  const toggleChecklistItem = (itemId: string) => {
    if (!checklist) return;
    const newChecked = checklist.checked.includes(itemId)
      ? checklist.checked.filter((id) => id !== itemId)
      : [...checklist.checked, itemId];
    setChecklist({ ...checklist, checked: newChecked });
  };

  const handleValidate = async (approved: boolean) => {
    if (!selectedRequest) return;

    // Verificar itens obrigatórios do checklist
    if (checklist && approved) {
      const requiredItems = checklist.template.items.filter((item) => item.required);
      const allRequiredChecked = requiredItems.every((item) => checklist.checked.includes(item.id));

      if (!allRequiredChecked) {
        alert('Todos os itens obrigatórios do checklist devem ser marcados para aprovar.');
        return;
      }
    }

    setLoading(true);
    try {
      await paymentService.validate({
        payment_request_id: selectedRequest,
        approved,
        comments: comments || undefined,
        checklist_items: checklist?.checked,
      });

      alert(approved ? 'Requisição aprovada com sucesso!' : 'Requisição rejeitada.');
      setShowModal(false);
      setSelectedRequest(null);
      setChecklist(null);
      loadPendingRequests();
    } catch (error: any) {
      console.error('Erro ao validar:', error);
      alert(error.response?.data?.message || 'Erro ao validar requisição');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Validar Requisições</h1>
        <p className="text-slate-300 mt-1">Aprove ou rejeite as requisições pendentes de validação.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading && requests.length === 0 ? (
          <div className="p-8 text-center text-slate-600">Carregando...</div>
        ) : requests.length === 0 ? (
          <div className="text-center text-slate-600 bg-white rounded-xl border border-slate-200 p-8">
            Nenhuma requisição pendente de validação.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-indigo-600 text-white">
              <tr>
                <th className="text-left px-4 py-3">Número</th>
                <th className="text-left px-4 py-3">Fornecedor</th>
                <th className="text-left px-4 py-3">Valor</th>
                <th className="text-left px-4 py-3">Vencimento</th>
                <th className="text-left px-4 py-3">Tipo Aprovação</th>
                <th className="text-left px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{request.request_number}</td>
                  <td className="px-4 py-3">{request.supplier_name}</td>
                  <td className="px-4 py-3">{formatCurrency(request.amount)}</td>
                  <td className="px-4 py-3">{formatDate(request.due_date)}</td>
                  <td className="px-4 py-3">
                    {request.requires_double_approval ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Dupla
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Única
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    <button
                      onClick={() => openValidationModal(request.id)}
                      className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition-colors"
                    >
                      Validar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Validação */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Validar Requisição</h2>

              {/* Checklist de Conformidade */}
              {checklist && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Checklist de Conformidade</h3>
                  <div className="space-y-2 border border-gray-200 rounded-lg p-4">
                    {checklist.template.items.map((item: ChecklistItem) => (
                      <label key={item.id} className="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={checklist.checked.includes(item.id)}
                          onChange={() => toggleChecklistItem(item.id)}
                          className="mt-1 h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {item.label}
                            {item.required && <span className="text-red-600 ml-1">*</span>}
                          </div>
                          <div className="text-xs text-gray-500">{item.category}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">* Campos obrigatórios para aprovação</p>
                </div>
              )}

              {/* Comentários */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comentários (opcional)
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Adicione observações sobre a validação..."
                />
              </div>

              {/* Botões de ação */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedRequest(null);
                    setChecklist(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleValidate(false)}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Processando...' : 'Rejeitar'}
                </button>
                <button
                  onClick={() => handleValidate(true)}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Processando...' : 'Aprovar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
