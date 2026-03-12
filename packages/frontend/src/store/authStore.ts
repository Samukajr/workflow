import { create } from 'zustand'
import { apiClient } from '@/services/api'

interface User {
  id: string
  nome: string
  email: string
  departamento: string
  tipo: string
}

interface LoginResult {
  requires2FA: boolean
  challengeToken?: string
}

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<LoginResult>
  loginWith2FA: (challengeToken: string, code: string) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
  setToken: (token: string) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),

  login: async (email: string, password: string) => {
    try {
      const data = (await apiClient.post('/auth/login', { email, password })) as any
      const rawUser = data?.user ?? data?.data?.user
      const requires2FA = Boolean(data?.requires_2fa ?? data?.data?.requires_2fa)
      const challengeToken = data?.challenge_token ?? data?.data?.challenge_token

      if (requires2FA) {
        if (!challengeToken || !rawUser) {
          throw new Error('Desafio 2FA inválido')
        }

        return {
          requires2FA: true,
          challengeToken,
        }
      }

      const token = data?.token ?? data?.data?.token

      if (!token || !rawUser) {
        throw new Error('Login failed')
      }

      const normalizedUser: User = {
        id: String(rawUser.id ?? ''),
        nome: rawUser.nome ?? rawUser.name ?? '',
        email: rawUser.email ?? '',
        departamento: rawUser.departamento ?? rawUser.department ?? '',
        tipo: rawUser.tipo ?? rawUser.role ?? rawUser.departamento ?? rawUser.department ?? '',
      }

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(normalizedUser))

      set({
        token,
        user: normalizedUser,
        isAuthenticated: true,
      })

      return {
        requires2FA: false,
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  },

  loginWith2FA: async (challengeToken: string, code: string) => {
    try {
      const data = (await apiClient.post('/auth/login/2fa', {
        challenge_token: challengeToken,
        code,
      })) as any

      const token = data?.token ?? data?.data?.token
      const rawUser = data?.user ?? data?.data?.user

      if (!token || !rawUser) {
        throw new Error('Falha na autenticação 2FA')
      }

      const normalizedUser: User = {
        id: String(rawUser.id ?? ''),
        nome: rawUser.nome ?? rawUser.name ?? '',
        email: rawUser.email ?? '',
        departamento: rawUser.departamento ?? rawUser.department ?? '',
        tipo: rawUser.tipo ?? rawUser.role ?? rawUser.departamento ?? rawUser.department ?? '',
      }

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(normalizedUser))

      set({
        token,
        user: normalizedUser,
        isAuthenticated: true,
      })
    } catch (error) {
      console.error('2FA login error:', error)
      throw error
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null, isAuthenticated: false })
  },

  setUser: (user: User) => set({ user }),
  setToken: (token: string) => set({ token }),
}))
