import { apiClient } from './api';
import { User, ApiResponse } from '@/types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  department: 'financeiro' | 'validacao' | 'submissao';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post('/auth/login', credentials);
  },

  async register(data: RegisterRequest): Promise<ApiResponse<{ user: User }>> {
    return apiClient.post('/auth/register', data);
  },

  async getMe(): Promise<ApiResponse<{ user: User }>> {
    return apiClient.get('/auth/me');
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};
