import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [requires2FA, setRequires2FA] = useState(false)
  const [challengeToken, setChallengeToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, loginWith2FA } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (requires2FA) {
        await loginWith2FA(challengeToken, twoFactorCode)
        navigate('/')
        return
      }

      const result = await login(email, password)

      if (result.requires2FA) {
        setRequires2FA(true)
        setChallengeToken(result.challengeToken || '')
        setTwoFactorCode('')
        setError('Informe o código do app autenticador para concluir o login')
        return
      }

      navigate('/')
    } catch (err) {
      setError(requires2FA ? 'Código 2FA inválido' : 'Email ou senha inválidos')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToPasswordStep = () => {
    setRequires2FA(false)
    setChallengeToken('')
    setTwoFactorCode('')
    setError('')
  }

  return (
    <div className="market-bg min-h-screen flex items-center justify-center px-4 py-8">
      <div className="market-glass rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
          Workflow Pagamentos
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Sistema de Validação e Pagamento de Notas Fiscais
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!requires2FA && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="seu.email@empresa.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Sua senha"
                  autoComplete="current-password"
                  required
                />
              </div>
            </>
          )}

          {requires2FA && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código de verificação (2FA)
              </label>
              <input
                type="text"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\s+/g, ''))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="000000"
                autoComplete="one-time-code"
                inputMode="numeric"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                Use o código atual do aplicativo autenticador ou um backup code.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Entrando...' : requires2FA ? 'Validar Código' : 'Entrar'}
          </button>

          {requires2FA && (
            <button
              type="button"
              onClick={handleBackToPasswordStep}
              className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 font-medium"
            >
              Voltar
            </button>
          )}

          {!requires2FA && (
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                Esqueci minha senha
              </Link>
            </div>
          )}
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
          <p>Use os usuarios reais do sistema</p>
          <p className="text-xs mt-2">Exemplo: superadmin@empresa.com</p>
        </div>
      </div>
    </div>
  )
}
