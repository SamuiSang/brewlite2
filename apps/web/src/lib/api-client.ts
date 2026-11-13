/**
 * Client HTTP API wrapper cho BrewLite Web App
 * Tự động gắn token JWT từ localStorage vào Header Authorization: Bearer <token>
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export class ApiClient {
  public static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('brewlite_access_token');
  }

  public static setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('brewlite_access_token', token);
    }
  }

  public static removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('brewlite_access_token');
      localStorage.removeItem('brewlite_user_profile');
    }
  }

  public static async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Xử lý mã lỗi 401: Token hết hạn hoặc không hợp lệ -> Xóa token
    if (response.status === 401) {
      this.removeToken();
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        const currentPath = window.location.pathname;
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      }
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || `Lỗi hệ thống: ${response.status}`);
    }

    return data;
  }

  public static get<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  public static post<T = any>(endpoint: string, body?: any, customHeaders?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers: customHeaders,
    });
  }

  public static patch<T = any>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}
