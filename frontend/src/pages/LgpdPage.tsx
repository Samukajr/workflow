import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertCircle, Download, Trash2, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/services/api';

interface Consent {
  id: string;
  type: string;
  granted: boolean;
  grantedAt?: string;
  revokedAt?: string;
}

interface DeletionRequest {
  id: string;
  userId: string;
  reason: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'processing' | 'completed';
  approvedAt?: string;
  completedAt?: string;
}

interface AuditEntry {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
}

const CONSENT_TYPES = [
  { id: 'marketing', label: 'Marketing e Comunicações', description: 'Receber emails promocionais' },
  { id: 'analytics', label: 'Analytics', description: 'Análise de uso e comportamento' },
  { id: 'third_party', label: 'Terceiros', description: 'Compartilhar dados com parceiros' },
];

export function LgpdPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'consents' | 'deletion' | 'export' | 'audit'>('consents');
  const [consents, setConsents] = useState<Consent[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'consents') {
        // Mock data - em produção, buscar da API
        setConsents(
          CONSENT_TYPES.map((type) => ({
            id: type.id,
            type: type.label,
            granted: Math.random() > 0.5,
            grantedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          }))
        );
      } else if (activeTab === 'deletion') {
        // Mock data
        setDeletionRequests([
          {
            id: '1',
            userId: user?.id || '',
            reason: 'Não desejo mais usar a plataforma',
            requestedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'approved',
            approvedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ]);
      } else if (activeTab === 'audit') {
        // Mock data
        setAuditLog([
          {
            id: '1',
            action: 'data_access',
            description: 'Acesso ao perfil do usuário',
            timestamp: new Date().toISOString(),
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0',
          },
          {
            id: '2',
            action: 'consent_granted',
            description: 'Consentimento para marketing concedido',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0',
          },
        ]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados LGPD:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConsentToggle = async (consentId: string, grant: boolean) => {
    try {
      if (grant) {
        await apiClient.post('/lgpd/consent', { consent_type: consentId });
      } else {
        await apiClient.delete('/lgpd/consent', { data: { consent_type: consentId } });
      }

      setSuccessMessage(grant ? 'Consentimento concedido!' : 'Consentimento revogado!');
      setTimeout(() => setSuccessMessage(''), 3000);
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar consentimento:', error);
    }
  };

  const handleDeletionRequest = async () => {
    if (!deletionReason.trim()) {
      alert('Por favor, descreva o motivo da exclusão');
      return;
    }

    try {
      await apiClient.post('/lgpd/data-deletion', { reason: deletionReason });
      setSuccessMessage('Solicitação de exclusão enviada! Será processada em até 30 dias.');
      setDeletionReason('');
      setShowDeletionModal(false);
      setTimeout(() => setSuccessMessage(''), 4000);
      loadData();
    } catch (error) {
      console.error('Erro ao solicitar exclusão:', error);
    }
  };

  const handleExportData = async () => {
    try {
      const response = await apiClient.get('/lgpd/data-export', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `personal-data-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      setSuccessMessage('Dados exportados com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Privacidade e Proteção de Dados</h1>
        </div>
        <p className="text-gray-600">Gerenciar suas preferências de privacidade conforme a LGPD (Lei 13.709/2018)</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-8">
          {(['consents', 'deletion', 'export', 'audit'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSuccessMessage('');
              }}
              className={`pb-3 font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'consents' && 'Consentimentos'}
              {tab === 'deletion' && 'Exclusão de Dados'}
              {tab === 'export' && 'Exportar Dados'}
              {tab === 'audit' && 'Auditoria'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow">
        {activeTab === 'consents' && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Manage your consents</h2>
            <div className="space-y-4">
              {CONSENT_TYPES.map((consentType) => {
                const consent = consents.find((c) => c.id === consentType.id);
                return (
                  <div key={consentType.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{consentType.label}</h3>
                        <p className="text-sm text-gray-600 mt-1">{consentType.description}</p>
                        {consent?.grantedAt && (
                          <p className="text-xs text-gray-500 mt-2">
                            Concedido em {new Date(consent.grantedAt).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consent?.granted || false}
                          onChange={(e) => handleConsentToggle(consentType.id, e.target.checked)}
                          disabled={isLoading}
                          className="w-5 h-5 text-blue-600 rounded"
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'deletion' && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Solicitar Exclusão de Dados (Direito ao Esquecimento)</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                ℹ️ Ao solicitar a exclusão, seus dados pessoais serão anonimizados em até 30 dias.
                Alguns dados podem ser retidos por obrigação legal.
              </p>
            </div>

            {deletionRequests.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Histórico de Solicitações</h3>
                <div className="space-y-3">
                  {deletionRequests.map((req) => (
                    <div key={req.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            {req.status === 'completed' && (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            )}
                            {req.status === 'approved' && (
                              <AlertCircle className="w-5 h-5 text-yellow-600" />
                            )}
                            <span className="font-semibold">
                              {req.reason}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              req.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {req.status === 'completed' ? 'CONCLUÍDA' : 'APROVADA'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">
                            Solicitado em {new Date(req.requestedAt).toLocaleDateString('pt-BR')}
                          </p>
                          {req.status === 'approved' && req.approvedAt && (
                            <p className="text-sm text-gray-600">
                              Aprovado em {new Date(req.approvedAt).toLocaleDateString('pt-BR')} - processando...
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!showDeletionModal ? (
              <button
                onClick={() => setShowDeletionModal(true)}
                className="btn btn-danger flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Solicitar Exclusão de Dados
              </button>
            ) : (
              <div className="border rounded-lg p-4 bg-red-50">
                <h3 className="font-semibold text-red-900 mb-3">Confirme a exclusão de todos os seus dados</h3>
                <textarea
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  placeholder="Motivo da exclusão (obrigatório)..."
                  className="w-full p-3 border rounded mb-3 text-sm"
                  rows={3}
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleDeletionRequest}
                    disabled={isLoading || !deletionReason.trim()}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
                  >
                    Confirmar Exclusão
                  </button>
                  <button
                    onClick={() => {
                      setShowDeletionModal(false);
                      setDeletionReason('');
                    }}
                    className="px-4 py-2 border rounded hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'export' && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Exportar Meus Dados (Portabilidade)</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                ℹ️ Baixe uma cópia de todos seus dados pessoais em formato JSON.
                O arquivo será disponível por 7 dias.
              </p>
            </div>
            <button
              onClick={handleExportData}
              disabled={isLoading}
              className="btn btn-primary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar Meus Dados
            </button>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Log de Auditoria</h2>
            <p className="text-gray-600 mb-4">
              Histórico de acessos e modificações aos seus dados pessoais
            </p>
            <div className="space-y-3">
              {auditLog.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-gray-400" />
                        <h4 className="font-semibold text-gray-900">{entry.description}</h4>
                      </div>
                      <div className="mt-2 text-sm text-gray-600 space-y-1">
                        <p>
                          <span className="font-semibold">Data/Hora:</span>{' '}
                          {new Date(entry.timestamp).toLocaleString('pt-BR')}
                        </p>
                        <p>
                          <span className="font-semibold">IP:</span> {entry.ipAddress}
                        </p>
                        <p>
                          <span className="font-semibold">User-Agent:</span>{' '}
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {entry.userAgent.substring(0, 50)}...
                          </code>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
        <p>
          <strong>⚖️ Legislação aplicável:</strong> Lei Geral de Proteção de Dados Pessoais (LGPD - Lei 13.709/2018)
        </p>
        <p className="mt-2">
          Para mais informações sobre como seus dados são processados, consulte nossa Política de Privacidade.
        </p>
      </div>
    </div>
  );
}
