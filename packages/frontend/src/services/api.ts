import axios, { AxiosInstance, AxiosError } from 'axios';

const DEFAULT_API_BASE_URL = 'http://localhost:3000/api';

function normalizeApiBaseUrl(rawUrl?: string): string {
  const candidate = (rawUrl || DEFAULT_API_BASE_URL).trim();

  try {
    const parsed = new URL(candidate);
    const path = parsed.pathname.replace(/\/+$/, '');

    if (!path || path === '/') {
      parsed.pathname = '/api';
    } else if (path === '/api' || path.startsWith('/api/')) {
      parsed.pathname = path;
    } else {
      parsed.pathname = path;
    }

    return parsed.toString().replace(/\/+$/, '');
  } catch {
    const sanitized = candidate.replace(/\/+$/, '');

    if (!sanitized) {
      return DEFAULT_API_BASE_URL;
    }

    if (sanitized.endsWith('/api')) {
      return sanitized;
    }

    return `${sanitized}/api`;
  }
}

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

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
          const retryAfterHeader = error.response.headers['retry-after'];
          const responseBody = error.response.data as { retryAfter?: number; message?: string } | undefined;
          const retryFromBody = typeof responseBody?.retryAfter === 'number' ? responseBody.retryAfter : undefined;
          const retryFromHeader = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;
          const retrySeconds = retryFromBody ?? retryFromHeader ?? 60;
          const waitText = retrySeconds >= 60
            ? `${Math.ceil(retrySeconds / 60)} minuto(s)`
            : `${retrySeconds} segundo(s)`;
          alert(`Rate limit atingido. Tente novamente em ${waitText}.`);
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

  async get<T>(url: string, config?: unknown) {
    const response = await this.client.get<T>(url, config as any);
    return response.data;
  }

  async post<T>(url: string, data?: unknown) {
    return this.request<T>('POST', url, data);
  }

  async put<T>(url: string, data?: unknown) {
    return this.request<T>('PUT', url, data);
  }

  async delete<T>(url: string, config?: unknown) {
    const response = await this.client.delete<T>(url, config as any);
    return response.data;
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

  async download(url: string, params?: Record<string, string | number>) {
    const response = await this.client.get(url, {
      params,
      responseType: 'blob',
    });

    return {
      data: response.data,
      headers: response.headers,
    };
  }
}

export const apiClient = new ApiClient();
