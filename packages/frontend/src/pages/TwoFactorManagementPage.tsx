import { useEffect, useState } from 'react'
import { apiClient } from '@/services/api'
import { Copy, CheckCircle, AlertCircle, Shield } from 'lucide-react'

interface TwoFactorStatus {
  enabled: boolean
}

interface SetupResponse {
  manual_entry_key: string
  qr_code_data_url: string
}

interface VerifySetupResponse {
  backup_codes: string[]
}

export default function TwoFactorManagementPage() {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [setUpInProgress, setSetUpInProgress] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [manualKey, setManualKey] = useState<string | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [disablingInProgress, setDisablingInProgress] = useState(false)
  const [disableCode, setDisableCode] = useState('')
  const [showDisableConfirmation, setShowDisableConfirmation] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null)

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get<TwoFactorStatus>('/auth/2fa/status')
      setStatus(response)
      setError(null)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao carregar status'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleStartSetup = async () => {
    try {
      setSetUpInProgress(true)
      setError(null)
      const response = await apiClient.post<SetupResponse>('/auth/2fa/setup')
      setQrCode(response.qr_code_data_url)
      setManualKey(response.manual_entry_key)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao iniciar setup'
      setError(errorMsg)
    } finally {
      setSetUpInProgress(false)
    }
  }

  const handleVerifySetup = async () => {
    if (!verificationCode.trim()) {
      setError('Digite o código de verificação')
      return
    }

    try {
      setSetUpInProgress(true)
      setError(null)
      const response = await apiClient.post<VerifySetupResponse>('/auth/2fa/verify-setup', { code: verificationCode })
      setBackupCodes(response.backup_codes)
      setSuccessMessage('2FA ativado com sucesso!')
      setQrCode(null)
      setManualKey(null)
      setVerificationCode('')
      loadStatus()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Código inválido'
      setError(errorMsg)
    } finally {
      setSetUpInProgress(false)
    }
  }

  const handleDisableTwoFactor = async () => {
    if (!disableCode.trim()) {
      setError('Digite seu código TOTP para desabilitar')
      return
    }

    try {
      setDisablingInProgress(true)
      setError(null)
      await apiClient.post('/auth/2fa/disable', { code: disableCode })
      setSuccessMessage('2FA desabilitado com sucesso')
      setShowDisableConfirmation(false)
      setDisableCode('')
      loadStatus()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao desabilitar 2FA'
      setError(errorMsg)
    } finally {
      setDisablingInProgress(false)
    }
  }

  const copyToClipboard = (code: string, index: number) => {
    navigator.clipboard.writeText(code)
    setCopiedCodeIndex(index)
    setTimeout(() => setCopiedCodeIndex(null), 2000)
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
          <Shield className="w-12 h-12 text-slate-400 mx-auto mb-3 animate-spin" />
          <p className="text-slate-200">Carregando status 2FA...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* header */}
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-indigo-400" />
        <h1 className="text-3xl font-bold text-white">Autenticação em 2 Fatores</h1>
      </div>

      {/* hero status card */}
      <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-slate-300 mb-2">Status Atual</p>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${status?.enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-2xl font-bold text-white">{status?.enabled ? 'Ativado' : 'Desativado'}</span>
            </div>
          </div>
          <div className="text-right text-sm text-slate-400">
            {status?.enabled ? (
              <p>Sua conta está protegida com 2FA</p>
            ) : (
              <p>Ative 2FA para maior segurança</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 flex gap-3">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-green-200">{successMessage}</p>
        </div>
      )}

      {/* Setup Section */}
      {!status?.enabled && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
          <h2 className="text-xl font-bold text-white mb-6">Ativar Autenticação em 2 Fatores</h2>

          {!qrCode ? (
            <div>
              <p className="text-slate-300 mb-6">
                A autenticação em 2 fatores adiciona uma camada extra de segurança à sua conta. Você precisará de um aplicativo autenticador (Google Authenticator, Microsoft Authenticator, Authy, etc.).
              </p>
              <button
                onClick={handleStartSetup}
                disabled={setUpInProgress}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
              >
                {setUpInProgress ? 'Gerando QR Code...' : 'Iniciar Setup'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* QR Code */}
              <div className="bg-slate-900 rounded-lg p-6">
                <p className="text-slate-300 text-sm mb-4">
                  <strong>Passo 1:</strong> Escaneie este QR com seu aplicativo autenticador
                </p>
                {qrCode && (
                  <div className="bg-white p-4 border border-slate-600 rounded-lg inline-block">
                    <img src={qrCode} alt="QR Code 2FA" className="w-64 h-64" />
                  </div>
                )}
              </div>

              {/* Manual Entry Key */}
              <div className="bg-slate-900 rounded-lg p-6">
                <p className="text-slate-300 text-sm mb-3">
                  <strong>Passo 2:</strong> Ou digite manualmente esta chave
                </p>
                <div className="bg-slate-950 border border-slate-700 rounded-lg p-4 font-mono text-sm text-slate-200 break-all">
                  {manualKey}
                </div>
                <p className="text-slate-400 text-xs mt-2">
                  Guarde esta chave em um local seguro para recuperação futura
                </p>
              </div>

              {/* Verification Code Input */}
              <div className="bg-slate-900 rounded-lg p-6">
                <p className="text-slate-300 text-sm mb-4">
                  <strong>Passo 3:</strong> Digite o código de 6 dígitos do seu autenticador
                </p>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-2xl text-center tracking-widest text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleVerifySetup}
                  disabled={setUpInProgress || verificationCode.length !== 6}
                  className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-slate-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                >
                  {setUpInProgress ? 'Verificando...' : 'Verificar e Ativar'}
                </button>
                <button
                  onClick={() => {
                    setQrCode(null)
                    setManualKey(null)
                    setVerificationCode('')
                  }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Backup Codes Display After Setup */}
      {backupCodes.length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-6">
          <h3 className="text-lg font-bold text-yellow-200 mb-4">Códigos de Backup</h3>
          <p className="text-yellow-100 mb-5 text-sm">
            Guarde estes códigos em um local seguro. Cada um pode ser usado uma única vez caso você perca acesso ao seu autenticador.
          </p>
          
          <div className="grid grid-cols-2 gap-3 mb-5">
            {backupCodes.map((code, index) => (
              <div key={index} className="bg-slate-950 border border-yellow-600/50 rounded-lg p-3 flex items-center justify-between group">
                <code className="font-mono text-sm text-yellow-100">{code}</code>
                <button
                  onClick={() => copyToClipboard(code, index)}
                  className="ml-2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 hover:bg-slate-700 rounded"
                >
                  {copiedCodeIndex === index ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>
            ))}
          </div>
          
          <button
            onClick={() => {
              const allCodes = backupCodes.join('\n')
              navigator.clipboard.writeText(allCodes)
              setSuccessMessage('Todos os códigos copiados!')
            }}
            className="w-full bg-yellow-700 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            Copiar Todos os Códigos
          </button>
          
          <p className="text-yellow-200 text-xs mt-4">
            ✓ Setup completado com sucesso! 2FA está ativado.
          </p>
        </div>
      )}

      {/* Active 2FA Section */}
      {status?.enabled && !backupCodes.length && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
          <h2 className="text-xl font-bold text-white mb-6">Gerenciar 2FA</h2>
          
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-200 font-medium">2FA Ativo</p>
                <p className="text-green-100 text-sm mt-1">
                  Sua conta está protegida. Você precisará inserir um código TOTP ao fazer login em um novo dispositivo.
                </p>
              </div>
            </div>
          </div>

          {!showDisableConfirmation ? (
            <button
              onClick={() => setShowDisableConfirmation(true)}
              className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-300 px-6 py-2.5 rounded-lg font-medium transition-colors"
            >
              Desabilitar 2FA
            </button>
          ) : (
            <div className="bg-red-900/20 border border-red-500/40 rounded-lg p-6 space-y-4">
              <p className="text-red-200">
                Para desabilitar 2FA, digite seu código TOTP atual do autenticador:
              </p>
              
              <input
                type="text"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full bg-slate-950 border border-red-600/50 rounded-lg px-4 py-2.5 text-2xl text-center tracking-widest text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-mono"
              />
              
              <div className="flex gap-3">
                <button
                  onClick={handleDisableTwoFactor}
                  disabled={disablingInProgress || disableCode.length !== 6}
                  className="flex-1 bg-red-600 hover:bg-red-500 disabled:bg-slate-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                >
                  {disablingInProgress ? 'Desabilitando...' : 'Confirmar Desabilitação'}
                </button>
                <button
                  onClick={() => {
                    setShowDisableConfirmation(false)
                    setDisableCode('')
                  }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Security Tips */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Dicas de Segurança</h3>
        <ul className="space-y-3 text-slate-300 text-sm">
          <li className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold mt-1">•</span>
            <span>Guarde seus códigos de backup em um local seguro, separado do seu dispositivo autenticador</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold mt-1">•</span>
            <span>Use um aplicativo autenticador confiável instalado em um dispositivo que você sempre tenha acesso</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold mt-1">•</span>
            <span>Nunca compartilhe o QR code ou a chave manual com outras pessoas</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold mt-1">•</span>
            <span>Se perder acesso ao seu autenticador, use os códigos de backup para recuperar a conta</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
