import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertCircle, Download, Trash2, Eye, Smartphone, KeyRound, Copy } from 'lucide-react';
import { apiClient } from '@/services/api';

interface Consent {
  id: string;
  type: string;
  granted: boolean;
  grantedAt?: string;
  revokedAt?: string;
}

interface ConsentApiResponse {
  id: string;
  consent_type: string;
  given_at: string;
  revoked_at: string | null;
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

interface DeletionRequestApiResponse {
  id: string;
  user_id: string;
  reason: string;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  request_date: string;
  updated_at?: string;
  completed_at: string | null;
}

interface AuditEntry {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
}

interface AuditApiResponse {
  id: string;
  action: string;
  data_type: string;
  reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface TwoFactorStatusResponse {
  enabled: boolean;
}

interface TwoFactorSetupResponse {
  manual_entry_key: string;
  qr_code_data_url: string;
}

interface TwoFactorVerifyResponse {
  backup_codes: string[];
}

const CONSENT_TYPES = [
  { id: 'marketing', label: 'Marketing e Comunicações', description: 'Receber emails promocionais' },
  { id: 'analytics', label: 'Analytics', description: 'Análise de uso e comportamento' },
  { id: 'data_processing', label: 'Processamento de Dados', description: 'Permitir processamento para operação do sistema' },
];

function LgpdPage() {
  const [activeTab, setActiveTab] = useState<'consents' | 'deletion' | 'export' | 'audit' | 'security'>('consents');
  const [consents, setConsents] = useState<Consent[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetupResponse | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [disableTwoFactorCode, setDisableTwoFactorCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'consents') {
        const response = await apiClient.get<{ success: boolean; consents: ConsentApiResponse[] }>('/lgpd/consents');

        const latestByType = new Map<string, ConsentApiResponse>();
        for (const item of response.consents || []) {
          if (!latestByType.has(item.consent_type)) {
            latestByType.set(item.consent_type, item);
          }
        }

        setConsents(
          CONSENT_TYPES.map((type) => {
            const consent = latestByType.get(type.id);
            return {
              id: type.id,
              type: type.label,
              granted: consent ? consent.revoked_at === null : false,
              grantedAt: consent?.given_at,
              revokedAt: consent?.revoked_at || undefined,
            };
          }),
        );
      } else if (activeTab === 'deletion') {
        const response = await apiClient.get<{ success: boolean; requests: DeletionRequestApiResponse[] }>('/lgpd/data-deletion');

        setDeletionRequests(
          (response.requests || []).map((item) => ({
            id: item.id,
            userId: item.user_id,
            reason: item.reason,
            requestedAt: item.request_date,
            status: item.status === 'rejected' ? 'pending' : item.status,
            approvedAt: item.status === 'approved' ? item.updated_at : undefined,
            completedAt: item.completed_at || undefined,
          })),
        );
      } else if (activeTab === 'audit') {
        const response = await apiClient.get<{ success: boolean; audit: AuditApiResponse[] }>('/lgpd/data-audit');

        setAuditLog(
          (response.audit || []).map((entry) => ({
            id: entry.id,
            action: entry.action,
            description: `${entry.action} - ${entry.data_type}${entry.reason ? ` (${entry.reason})` : ''}`,
            timestamp: entry.created_at,
            ipAddress: entry.ip_address || 'N/A',
            userAgent: entry.user_agent || 'N/A',
          })),
        );
      } else if (activeTab === 'security') {
        const response = await apiClient.get<{ success: boolean; data: TwoFactorStatusResponse }>('/auth/2fa/status');
        setTwoFactorEnabled(Boolean(response.data?.enabled));
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
      const response = await apiClient.get<Blob>('/lgpd/data-export', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(response as Blob);
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

  const handleStartTwoFactorSetup = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.post<{ success: boolean; data: TwoFactorSetupResponse }>('/auth/2fa/setup');
      setTwoFactorSetup(response.data || null);
      setBackupCodes([]);
      setTwoFactorCode('');
      setSuccessMessage('Configuração 2FA iniciada. Escaneie o QR code e informe o código para ativar.');
    } catch (error) {
      console.error('Erro ao iniciar configuração 2FA:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyTwoFactorSetup = async () => {
    if (!twoFactorCode.trim()) {
      alert('Informe o código do app autenticador');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post<{ success: boolean; data: TwoFactorVerifyResponse }>('/auth/2fa/verify-setup', {
        code: twoFactorCode.trim(),
      });

      setBackupCodes(response.data?.backup_codes || []);
      setTwoFactorEnabled(true);
      setTwoFactorSetup(null);
      setTwoFactorCode('');
      setSuccessMessage('2FA habilitado com sucesso. Guarde os backup codes em local seguro.');
    } catch (error) {
      console.error('Erro ao verificar configuração 2FA:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    if (!disableTwoFactorCode.trim()) {
      alert('Informe um código 2FA ou backup code para desabilitar');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post('/auth/2fa/disable', {
        code: disableTwoFactorCode.trim(),
      });

      setTwoFactorEnabled(false);
      setTwoFactorSetup(null);
      setBackupCodes([]);
      setDisableTwoFactorCode('');
      setSuccessMessage('2FA desabilitado com sucesso.');
    } catch (error) {
      console.error('Erro ao desabilitar 2FA:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyBackupCodes = async () => {
    if (backupCodes.length === 0) {
      return;
    }

    try {
      await navigator.clipboard.writeText(backupCodes.join('\n'));
      setSuccessMessage('Backup codes copiados para a área de transferência.');
    } catch (error) {
      console.error('Erro ao copiar backup codes:', error);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-white">Privacidade e Proteção de Dados</h1>
        </div>
        <p className="text-slate-300">Gerenciar suas preferências de privacidade conforme a LGPD (Lei 13.709/2018)</p>
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
          {(['consents', 'deletion', 'export', 'audit', 'security'] as const).map((tab) => (
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
              {tab === 'security' && 'Segurança (2FA)'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow">
        {activeTab === 'consents' && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Gerenciar Consentimentos</h2>
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
                        {consent?.revokedAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            Revogado em {new Date(consent.revokedAt).toLocaleDateString('pt-BR')}
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

            {deletionRequests.length === 0 && (
              <p className="text-sm text-gray-600 mb-6">Nenhuma solicitação registrada para sua conta.</p>
            )}

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
                                : req.status === 'approved'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-slate-100 text-slate-800'
                            }`}>
                              {req.status === 'completed' ? 'CONCLUÍDA' : req.status === 'approved' ? 'APROVADA' : 'PENDENTE'}
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
                          {req.status === 'completed' && req.completedAt && (
                            <p className="text-sm text-gray-600">
                              Concluído em {new Date(req.completedAt).toLocaleDateString('pt-BR')}
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
              {auditLog.length === 0 && (
                <p className="text-sm text-gray-600">Nenhum evento de auditoria encontrado para sua conta.</p>
              )}
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

        {activeTab === 'security' && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Autenticação em Dois Fatores (2FA)</h2>
            <p className="text-gray-600 mb-4">
              Aumente a segurança da sua conta exigindo um código adicional no login.
            </p>

            <div className="mb-6 p-4 rounded-lg border bg-slate-50">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-900">Status atual</span>
              </div>
              <p className="text-sm text-gray-700">
                {twoFactorEnabled ? '2FA habilitado para sua conta.' : '2FA desabilitado para sua conta.'}
              </p>
            </div>

            {!twoFactorEnabled && !twoFactorSetup && (
              <button
                onClick={handleStartTwoFactorSetup}
                disabled={isLoading}
                className="btn btn-primary flex items-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                Iniciar Configuração 2FA
              </button>
            )}

            {!twoFactorEnabled && twoFactorSetup && (
              <div className="space-y-4 border rounded-lg p-4 bg-white">
                <h3 className="font-semibold text-gray-900">1) Escaneie o QR Code no app autenticador</h3>
                <img
                  src={twoFactorSetup.qr_code_data_url}
                  alt="QR code para configuração de 2FA"
                  className="w-56 h-56 border rounded-lg"
                />

                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">2) Chave manual (caso não use QR)</h4>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded block break-all">
                    {twoFactorSetup.manual_entry_key}
                  </code>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">3) Informe o código gerado</h4>
                  <input
                    type="text"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\s+/g, ''))}
                    placeholder="000000"
                    className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg"
                    inputMode="numeric"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleVerifyTwoFactorSetup}
                    disabled={isLoading || !twoFactorCode.trim()}
                    className="btn btn-primary"
                  >
                    Confirmar e Habilitar
                  </button>
                  <button
                    onClick={() => {
                      setTwoFactorSetup(null);
                      setTwoFactorCode('');
                    }}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {backupCodes.length > 0 && (
              <div className="mt-6 p-4 rounded-lg border bg-amber-50">
                <h3 className="font-semibold text-amber-900 mb-2">Backup Codes (uso único)</h3>
                <p className="text-sm text-amber-800 mb-3">
                  Guarde estes códigos em local seguro. Eles são exibidos apenas agora.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  {backupCodes.map((code) => (
                    <code key={code} className="text-xs bg-white border px-2 py-1 rounded">
                      {code}
                    </code>
                  ))}
                </div>
                <button
                  onClick={handleCopyBackupCodes}
                  className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-white"
                >
                  <Copy className="w-4 h-4" />
                  Copiar Códigos
                </button>
              </div>
            )}

            {twoFactorEnabled && (
              <div className="mt-6 p-4 rounded-lg border bg-red-50">
                <h3 className="font-semibold text-red-900 mb-2">Desabilitar 2FA</h3>
                <p className="text-sm text-red-800 mb-3">
                  Informe um código válido do autenticador ou um backup code para confirmar.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <input
                    type="text"
                    value={disableTwoFactorCode}
                    onChange={(e) => setDisableTwoFactorCode(e.target.value.replace(/\s+/g, ''))}
                    placeholder="Código 2FA ou backup code"
                    className="w-full sm:max-w-sm px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <button
                    onClick={handleDisableTwoFactor}
                    disabled={isLoading || !disableTwoFactorCode.trim()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    Desabilitar 2FA
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
        <p>
          <strong>⚖️ Legislação aplicável:</strong> Lei Geral de Proteção de Dados Pessoais (LGPD - Lei 13.709/2018)
        </p>
        <p className="mt-2">
          Documentos oficiais do produto: Política de Privacidade e Termos de Uso (versão vigente em <strong>docs/</strong> do projeto).
        </p>
        <ul className="mt-3 list-disc list-inside space-y-1">
          <li>docs/POLITICA_PRIVACIDADE.md</li>
          <li>docs/TERMOS_DE_USO.md</li>
        </ul>
      </div>
    </div>
  );
}

export default LgpdPage;
