import axios, { AxiosInstance, AxiosError } from 'axios';
import { rateLimitAlert } from './alertService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptar requisições para adicionar token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Interceptar respostas para lidar com erros
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        } else if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          const retrySeconds = retryAfter ? parseInt(retryAfter, 10) : 60;
          rateLimitAlert.trigger(retrySeconds);
        }
        return Promise.reject(error);
      },
    );
  }

  async request<T>(method: string, url: string, data?: unknown) {
    try {
      const response = await this.client({
        method,
        url,
        data,
      });
      return response.data as T;
    } catch (error) {
      throw error;
    }
  }

  async get<T>(url: string) {
    return this.request<T>('GET', url);
  }

  async post<T>(url: string, data?: unknown) {
    return this.request<T>('POST', url, data);
  }

  async put<T>(url: string, data?: unknown) {
    return this.request<T>('PUT', url, data);
  }

  async delete<T>(url: string) {
    return this.request<T>('DELETE', url);
  }

  async uploadFile<T>(url: string, formData: FormData) {
    try {
      const token = localStorage.getItem('token');
      const response = await this.client({
        method: 'POST',
        url,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      return response.data as T;
    } catch (error) {
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
