import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { apiClient } from '@/services/api'

interface User {
  id: string
  email: string
  name: string
  department: string
  is_active: boolean
  created_at: string
  last_login?: string
}

interface CreateUserForm {
  email: string
  password: string
  confirmPassword: string
  name: string
  department: 'submissao' | 'validacao' | 'financeiro' | 'admin' | 'superadmin'
}

const DEPARTMENTS = [
  { value: 'submissao', label: '📤 Submissão (Upload de Documentos)' },
  { value: 'validacao', label: '✅ Validação (Aprovação de Pagamentos)' },
  { value: 'financeiro', label: '💰 Financeiro (Executar Pagamentos)' },
  { value: 'admin', label: '⚙️ Admin (Administração)' },
  { value: 'superadmin', label: '🔐 Superadmin (Controle Total)', disabled: true },
]

export default function UserManagementPage() {
  const { user } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState<CreateUserForm>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    department: 'submissao',
  })

  // Verificar se é superadmin
  const isSuperadmin = user?.departamento === 'superadmin' || user?.tipo === 'SUPERADMIN'

  useEffect(() => {
    if (!isSuperadmin) {
      setError('Acesso negado: apenas superadmin pode gerenciar usuários')
      return
    }
    loadUsers()
  }, [isSuperadmin])

  const loadUsers = async () => {
    try {
      setLoading(true)
      // Para essa página, vamos fazer uma requisição simples
      // No backend, pode ser criado um novo endpoint GET /api/auth/users
      // Por enquanto, simulamos uma lista vazia
      setUsers([])
      setError('')
    } catch (err) {
      setError('Erro ao carregar usuários')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateForm = (): boolean => {
    if (!formData.email || !formData.password || !formData.name) {
      setError('Preencha todos os campos obrigatórios')
      return false
    }

    if (formData.password.length < 8) {
      setError('Senha deve ter pelo menos 8 caracteres')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Senhas não conferem')
      return false
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Email inválido')
      return false
    }

    return true
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!validateForm()) return

    try {
      const response = await apiClient.post('/auth/register', {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        department: formData.department,
      }) as any

      if (response.data?.success) {
        setSuccess(`Usuário ${formData.email} criado com sucesso!`)
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          name: '',
          department: 'submissao',
        })
        setShowForm(false)
        setTimeout(() => setSuccess(''), 5000)
        loadUsers()
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao criar usuário'
      setError(errorMessage)
      console.error(err)
    }
  }

  if (!isSuperadmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md">
          <h1 className="text-2xl font-bold text-red-700 mb-4">❌ Acesso Negado</h1>
          <p className="text-red-600">Apenas superadmin pode gerenciar usuários do sistema.</p>
          <p className="text-red-500 text-sm mt-2">Seu papel: {user?.departamento || user?.tipo}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              🔐 Gerenciamento de Usuários
            </h1>
            <p className="text-slate-300">
              Criar e gerenciar contas de usuários para as diferentes equipes
            </p>
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="mb-6 bg-red-500/20 border border-red-500 text-red-200 px-6 py-4 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-500/20 border border-green-500 text-green-200 px-6 py-4 rounded-lg">
              ✅ {success}
            </div>
          )}

          {/* Create User Button */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mb-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-300 shadow-lg"
            >
              ➕ Criar Novo Usuário
            </button>
          )}

          {/* Create User Form */}
          {showForm && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-8 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-6">Criar Novo Usuário</h2>

              <form onSubmit={handleCreateUser} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="usuario@empresa.com"
                      className="w-full bg-slate-700 text-white placeholder-slate-500 rounded-lg px-4 py-3 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Nome do Usuário"
                      className="w-full bg-slate-700 text-white placeholder-slate-500 rounded-lg px-4 py-3 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Senha *
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full bg-slate-700 text-white placeholder-slate-500 rounded-lg px-4 py-3 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Confirmar Senha *
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Repita a senha"
                      className="w-full bg-slate-700 text-white placeholder-slate-500 rounded-lg px-4 py-3 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Department */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Departamento / Função *
                    </label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      {DEPARTMENTS.map(dept => (
                        <option key={dept.value} value={dept.value} disabled={dept.disabled}>
                          {dept.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      <strong>Submissão:</strong> Upload de boletos, notas fiscais e faturas<br/>
                      <strong>Validação:</strong> Aprovação/rejeição de pagamentos<br/>
                      <strong>Financeiro:</strong> Executar pagamentos validados<br/>
                      <strong>Admin:</strong> Gerenciamento de configurações
                    </p>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-300"
                  >
                    ✅ Criar Usuário
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setFormData({
                        email: '',
                        password: '',
                        confirmPassword: '',
                        name: '',
                        department: 'submissao',
                      })
                      setError('')
                    }}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-300"
                  >
                    ❌ Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Instructions Section */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6">ℹ️ Guia de Criação de Usuários</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Submissão */}
              <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
                <h3 className="text-lg font-semibold text-amber-400 mb-3">📤 Equipe de Submissão</h3>
                <p className="text-slate-300 text-sm mb-3">
                  Responsáveis por fazer upload de:
                </p>
                <ul className="text-slate-300 text-sm space-y-1 ml-4">
                  <li>✓ Boletos bancários</li>
                  <li>✓ Notas fiscais</li>
                  <li>✓ Faturas para pagamento</li>
                </ul>
                <p className="text-slate-400 text-xs mt-4">
                  Quantos usuários: 3-5 pessoas da operação
                </p>
              </div>

              {/* Validação */}
              <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
                <h3 className="text-lg font-semibold text-blue-400 mb-3">✅ Equipe de Validação</h3>
                <p className="text-slate-300 text-sm mb-3">
                  Responsáveis por:
                </p>
                <ul className="text-slate-300 text-sm space-y-1 ml-4">
                  <li>✓ Revisar documentos</li>
                  <li>✓ Aprovar/rejeitar pagamentos</li>
                  <li>✓ Adicionar observações</li>
                </ul>
                <p className="text-slate-400 text-xs mt-4">
                  Quantos usuários: 2-3 pessoas da equipe
                </p>
              </div>

              {/* Financeiro */}
              <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
                <h3 className="text-lg font-semibold text-green-400 mb-3">💰 Equipe Financeira</h3>
                <p className="text-slate-300 text-sm mb-3">
                  Responsáveis por:
                </p>
                <ul className="text-slate-300 text-sm space-y-1 ml-4">
                  <li>✓ Processar pagamentos</li>
                  <li>✓ Confirmar transferências</li>
                  <li>✓ Gerar comprovantes</li>
                </ul>
                <p className="text-slate-400 text-xs mt-4">
                  Quantos usuários: 1-2 pessoas do financeiro
                </p>
              </div>
            </div>

            {/* Process Flow */}
            <div className="mt-8 p-6 bg-purple-900/20 border border-purple-700/50 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-300 mb-4">🔄 Fluxo do Processo</h3>
              <div className="flex items-center justify-between text-center space-x-4">
                <div>
                  <p className="text-2xl mb-2">📤</p>
                  <p className="text-slate-300 text-sm font-semibold">Submissão</p>
                </div>
                <div className="text-slate-400 text-xl">→</div>
                <div>
                  <p className="text-2xl mb-2">✅</p>
                  <p className="text-slate-300 text-sm font-semibold">Validação</p>
                </div>
                <div className="text-slate-400 text-xl">→</div>
                <div>
                  <p className="text-2xl mb-2">💰</p>
                  <p className="text-slate-300 text-sm font-semibold">Pagamento</p>
                </div>
              </div>
            </div>
          </div>

          {/* Users List (if any) */}
          {users.length > 0 && (
            <div className="mt-8 bg-slate-800 border border-slate-700 rounded-lg p-8 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-6">👥 Usuários Cadastrados</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-600">
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4">Nome</th>
                      <th className="text-left py-3 px-4">Departamento</th>
                      <th className="text-left py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                        <td className="py-3 px-4">{u.email}</td>
                        <td className="py-3 px-4">{u.name}</td>
                        <td className="py-3 px-4">
                          <span className="px-3 py-1 bg-slate-700 rounded-full text-xs font-semibold">
                            {u.department}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {u.is_active ? (
                            <span className="text-green-400">✅ Ativo</span>
                          ) : (
                            <span className="text-red-400">❌ Inativo</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
      </div>
    </div>
  )
}
