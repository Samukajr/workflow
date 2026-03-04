import { useAtom } from 'jotai';
import toast from 'react-hot-toast';
import { userAtom, tokenAtom, loadingAtom } from '@/store';
import { authService } from '@/services/authService';
import { User } from '@/types';

export function useAuth() {
  const [user, setUser] = useAtom(userAtom);
  const [token, setToken] = useAtom(tokenAtom);
  const [loading, setLoading] = useAtom(loadingAtom);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await authService.login({ email, password });

      if (response.data) {
        const { token: newToken, user: newUser } = response.data;
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        toast.success('Login realizado com sucesso!');
        return true;
      }
      toast.error(response.message || 'Erro ao fazer login');
      return false;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao fazer login');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, department: string) => {
    setLoading(true);
    try {
      const response = await authService.register({
        email,
        password,
        name,
        department: department as 'financeiro' | 'validacao' | 'submissao',
      });

      if (response.data) {
        toast.success('Usuário registrado com sucesso!');
        return true;
      }
      toast.error(response.message || 'Erro ao registrar');
      return false;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao registrar');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
    toast.success('Logout realizado com sucesso!');
  };

  const initializeAuth = async () => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  };

  return {
    user,
    token,
    loading,
    login,
    register,
    logout,
    initializeAuth,
    isAuthenticated: !!token,
  };
}
