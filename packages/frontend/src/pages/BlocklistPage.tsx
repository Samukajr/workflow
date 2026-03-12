import { useState, useEffect } from 'react';
import { paymentService } from '../services/paymentService';

interface BlocklistEntry {
  id: string;
  supplier_document: string;
  supplier_name?: string;
  reason: string;
  blocked_by: string;
  is_active: boolean;
  created_at: string;
  removed_at?: string;
}

export default function BlocklistPage() {
  const [blocklist, setBlocklist] = useState<BlocklistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    supplier_document: '',
    supplier_name: '',
    reason: '',
  });

  const loadBlocklist = async () => {
    setLoading(true);
    try {
      const response = await paymentService.listBlocklist();
      setBlocklist(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar blocklist:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlocklist();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedDocument = formData.supplier_document.replace(/\D/g, '');

    if (!normalizedDocument || !formData.supplier_name || !formData.reason) {
      alert('Preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      await paymentService.addToBlocklist({
        ...formData,
        supplier_document: normalizedDocument,
      });
      alert('Fornecedor adicionado à blocklist com sucesso!');
      setFormData({ supplier_document: '', supplier_name: '', reason: '' });
      setShowForm(false);
      await loadBlocklist();
    } catch (error: any) {
      console.error('Erro ao adicionar à blocklist:', error);
      alert(error.response?.data?.message || 'Erro ao adicionar à blocklist');
    } finally {
      setLoading(false);
    }
  };

  const formatDocument = (doc: string) => {
    // CNPJ: XX.XXX.XXX/XXXX-XX
    if (doc.length === 14) {
      return doc.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    }
    return doc;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Blocklist de Fornecedores</h1>
          <p className="mt-2 text-sm text-slate-300">
            Gerencie fornecedores bloqueados para prevenir fraudes
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {showForm ? 'Cancelar' : 'Adicionar à Blocklist'}
        </button>
      </div>

      {/* Formulário de adição */}
      {showForm && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Adicionar Fornecedor à Blocklist</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CNPJ do Fornecedor
              </label>
              <input
                type="text"
                value={formData.supplier_document}
                onChange={(e) => setFormData({ ...formData, supplier_document: e.target.value })}
                placeholder="00.000.000/0000-00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                maxLength={18}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Fornecedor
              </label>
              <input
                type="text"
                value={formData.supplier_name}
                onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                placeholder="Nome da empresa"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo do Bloqueio
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Descreva o motivo do bloqueio (fraude, inadimplência, etc.)"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 transition-colors"
              >
                {loading ? 'Adicionando...' : 'Adicionar à Blocklist'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de fornecedores bloqueados */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading && blocklist.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : blocklist.length === 0 ? (
          <div className="p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum fornecedor bloqueado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Adicione fornecedores à blocklist para prevenir fraudes
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fornecedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CNPJ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Motivo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data de Bloqueio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {blocklist.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{entry.supplier_name || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDocument(entry.supplier_document)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate" title={entry.reason}>
                      {entry.reason}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(entry.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {entry.is_active ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Bloqueado
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        Removido
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
