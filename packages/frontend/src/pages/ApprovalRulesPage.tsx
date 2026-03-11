import { useState, useEffect } from 'react';
import { paymentService, ApprovalRule } from '../services/paymentService';

export default function ApprovalRulesPage() {
  const [rules, setRules] = useState<ApprovalRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      const response = await paymentService.getApprovalRules();
      setRules(response.data);
    } catch (error) {
      console.error('Erro ao carregar regras de alçada:', error);
      alert('Erro ao carregar regras de alçada');
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Regras de Alçada de Aprovação</h1>
        <p className="mt-2 text-sm text-slate-300">
          Configurações de aprovação por valor da requisição
        </p>
      </div>

      {/* Informações sobre o sistema */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Como funciona</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>Aprovação única:</strong> Um validador aprova e a requisição segue para pagamento
                </li>
                <li>
                  <strong>Aprovação dupla:</strong> Necessita de dois validadores diferentes
                </li>
                <li>
                  <strong>Requer superadmin:</strong> Pelo menos um dos aprovadores deve ser superadmin
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de regras */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando regras...</div>
        ) : rules.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nenhuma regra configurada</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Faixa de Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo de Aprovação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requisitos Especiais
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(rule.min_amount)} até {formatCurrency(rule.max_amount)}
                    </div>
                    {rule.description && (
                      <div className="text-xs text-gray-500 mt-1">{rule.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {rule.requires_double_approval ? (
                      <div className="flex items-center">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Aprovação Dupla
                        </span>
                        <svg
                          className="ml-2 h-5 w-5 text-yellow-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Aprovação Única
                        </span>
                        <svg
                          className="ml-2 h-5 w-5 text-green-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {rule.requires_superadmin ? (
                      <div className="flex items-center text-sm text-red-700">
                        <svg
                          className="mr-2 h-5 w-5 text-red-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          />
                        </svg>
                        <span className="font-medium">Requer Superadmin</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {rule.is_active ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Ativa
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        Inativa
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Legenda */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Legenda</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 mt-0.5" />
            <div className="ml-3">
              <p className="font-medium text-gray-700">Aprovação Única</p>
              <p className="text-gray-500">Um validador aprova a requisição</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 h-5 w-5 rounded-full bg-yellow-100 mt-0.5" />
            <div className="ml-3">
              <p className="font-medium text-gray-700">Aprovação Dupla</p>
              <p className="text-gray-500">Necessita de dois validadores diferentes</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 h-5 w-5 rounded-full bg-red-100 mt-0.5" />
            <div className="ml-3">
              <p className="font-medium text-gray-700">Requer Superadmin</p>
              <p className="text-gray-500">Pelo menos um aprovador deve ser superadmin</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
