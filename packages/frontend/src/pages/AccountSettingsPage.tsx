import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { apiClient } from '@/services/api'
import {
  User as UserIcon,
  Mail,
  Calendar,
  Key,
  Shield,
  AlertCircle,
  CheckCircle,
  LogOut,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react'

interface UserProfile {
  id: string
  email: string
  name: string
  department: string
  createdAt: string
  lastLogin: string | null
  twoFactorEnabled: boolean
}

interface PasswordChangeRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function AccountSettingsPage() {
  const { user, token, logout } = useAuthStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [passwordForm, setPasswordForm] = useState<PasswordChangeRequest>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get<{
        id: string
        email: string
        name: string
        tipo?: string
        departamento?: string
        department?: string
        created_at?: string
        createdAt?: string
        last_login?: string
        lastLogin?: string | null
        two_factor_enabled?: boolean
        twoFactorEnabled?: boolean
      }>('/auth/me')

      setProfile({
        id: response.id,
        email: response.email,
        name: response.name,
        department: response.tipo || response.departamento || response.department || 'N/A',
        createdAt: response.created_at || response.createdAt || new Date().toISOString(),
        lastLogin: response.last_login || response.lastLogin || null,
        twoFactorEnabled: response.two_factor_enabled || response.twoFactorEnabled || false,
      })
      setError(null)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao carregar perfil'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    // Validação
    if (!passwordForm.currentPassword.trim()) {
      setError('Digite a senha atual')
      return
    }

    if (passwordForm.newPassword.length < 8) {
      setError('Nova senha deve ter no mínimo 8 caracteres')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setError('A nova senha deve ser diferente da atual')
      return
    }

    try {
      setChangingPassword(true)
      await apiClient.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })

      setSuccessMessage('Senha alterada com sucesso!')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPasswordChange(false)

      // Logout após mudança de senha
      setTimeout(() => {
        logout()
      }, 2000)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao alterar senha'
      setError(errorMsg)
    } finally {
      setChangingPassword(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca'
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(dateString))
    } catch {
      return 'Data inválida'
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
          <UserIcon className="w-12 h-12 text-slate-400 mx-auto mb-3 animate-spin" />
          <p className="text-slate-200">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <UserIcon className="w-8 h-8 text-indigo-400" />
        <h1 className="text-3xl font-bold text-white">Configurações da Conta</h1>
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

      {/* Profile Card */}
      {profile && (
        <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Meu Perfil</h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Nome */}
            <div>
              <label className="text-slate-400 text-sm font-medium mb-2 block">Nome Completo</label>
              <div className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-slate-500" />
                <span className="text-white">{profile.name}</span>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-slate-400 text-sm font-medium mb-2 block">Email</label>
              <div className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-500" />
                <span className="text-white">{profile.email}</span>
              </div>
            </div>

            {/* Departamento */}
            <div>
              <label className="text-slate-400 text-sm font-medium mb-2 block">Departamento</label>
              <div className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-3">
                <span className="text-white font-medium capitalize">{profile.department}</span>
              </div>
            </div>

            {/* 2FA Status */}
            <div>
              <label className="text-slate-400 text-sm font-medium mb-2 block">2FA Status</label>
              <div className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-500" />
                <span className={profile.twoFactorEnabled ? 'text-green-400 font-medium' : 'text-orange-400 font-medium'}>
                  {profile.twoFactorEnabled ? 'Habilitado' : 'Desabilitado'}
                </span>
              </div>
            </div>

            {/* Data de Criação */}
            <div>
              <label className="text-slate-400 text-sm font-medium mb-2 block">Membro desde</label>
              <div className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="text-white">{formatDate(profile.createdAt)}</span>
              </div>
            </div>

            {/* Último Login */}
            <div>
              <label className="text-slate-400 text-sm font-medium mb-2 block">Último acesso</label>
              <div className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 flex items-center gap-2">
                <LogOut className="w-4 h-4 text-slate-500" />
                <span className="text-white">{formatDate(profile.lastLogin)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Section */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Segurança</h2>

        {!showPasswordChange ? (
          <button
            onClick={() => setShowPasswordChange(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            <Key className="w-4 h-4" />
            Alterar Senha
          </button>
        ) : (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="text-slate-300 text-sm font-medium mb-2 block">Senha Atual</label>
              <div className="relative">
                <input
                  type={passwordVisible.current ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  placeholder="Digite sua senha atual"
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible({ ...passwordVisible, current: !passwordVisible.current })}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {passwordVisible.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="text-slate-300 text-sm font-medium mb-2 block">Nova Senha</label>
              <div className="relative">
                <input
                  type={passwordVisible.new ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  placeholder="Digite sua nova senha (mín. 8 caracteres)"
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible({ ...passwordVisible, new: !passwordVisible.new })}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {passwordVisible.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-slate-400 text-xs mt-1">Mínimo de 8 caracteres</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-slate-300 text-sm font-medium mb-2 block">Confirmar Nova Senha</label>
              <div className="relative">
                <input
                  type={passwordVisible.confirm ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  placeholder="Confirme sua nova senha"
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible({ ...passwordVisible, confirm: !passwordVisible.confirm })}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {passwordVisible.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Strength Indicator */}
            {passwordForm.newPassword && (
              <div className="bg-slate-950 border border-slate-700 rounded-lg p-3">
                <p className="text-xs text-slate-400 mb-2">Força da senha:</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`flex-1 h-2 rounded-full ${
                        passwordForm.newPassword.length >= i * 2
                          ? 'bg-green-500'
                          : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={changingPassword}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
              >
                {changingPassword ? 'Alterando...' : 'Alterar Senha'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordChange(false)
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                  setError(null)
                }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>

            <p className="text-slate-400 text-xs pt-2">
              ⚠️ Após alterar a senha, você será desconectado e precisará fazer login novamente.
            </p>
          </form>
        )}
      </div>

      {/* Security Tips */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Dicas de Segurança</h3>
        <ul className="space-y-3 text-slate-300 text-sm">
          <li className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold mt-1">•</span>
            <span>Use uma senha forte com pelo menos 8 caracteres, incluindo números e símbolos</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold mt-1">•</span>
            <span>Nunca compartilhe sua senha com outras pessoas</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold mt-1">•</span>
            <span>Ative a autenticação em 2 fatores para maior proteção</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold mt-1">•</span>
            <span>Mude sua senha regularmente, especialmente após acessar em dispositivos públicos</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold mt-1">•</span>
            <span>Se desconfiar de atividade não autorizada, altere sua senha imediatamente</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
