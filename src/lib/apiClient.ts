import { getUserSession } from '@/lib/cognito';

/**
 * API client wrapper that automatically adds authentication headers
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001')) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get authorization header with Cognito ID token
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    try {
      const session = await getUserSession();
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.idToken}`,
      };
    } catch {
      // No token available; still return JSON header and let the server 401
      return { 'Content-Type': 'application/json' };
    }
  }

  /**
   * Make an authenticated GET request
   */
  async get<T>(url: string): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const bodyText = await response.text().catch(() => '');
      const detail = bodyText || response.statusText;
      const msg = response.status === 401 ? 'Unauthorized - please sign in.' : `HTTP ${response.status}: ${detail}`;
      throw new Error(msg);
    }

    return response.json();
  }

  /**
   * Make an authenticated POST request
   */
  async post<T>(url: string, data?: unknown): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const bodyText = await response.text().catch(() => '');
      const detail = bodyText || response.statusText;
      const msg = response.status === 401 ? 'Unauthorized - please sign in.' : `HTTP ${response.status}: ${detail}`;
      throw new Error(msg);
    }

    return response.json();
  }

  /**
   * Make an authenticated PUT request
   */
  async put<T>(url: string, data?: unknown): Promise<T> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const bodyText = await response.text().catch(() => '');
      const detail = bodyText || response.statusText;
      const msg = response.status === 401 ? 'Unauthorized - please sign in.' : `HTTP ${response.status}: ${detail}`;
      throw new Error(msg);
    }

    return response.json();
  }

  /**
   * Make an authenticated PATCH request
   */
    async patch<T>(url: string, data?: unknown): Promise<T> {
        const headers = await this.getAuthHeaders();
        const response = await fetch(`${this.baseUrl}${url}`, {
        method: 'PATCH',
        headers,
        body: data ? JSON.stringify(data) : undefined,
        });

        if (!response.ok) {
        const bodyText = await response.text().catch(() => '');
        const detail = bodyText || response.statusText;
        const msg = response.status === 401 ? 'Unauthorized - please sign in.' : `HTTP ${response.status}: ${detail}`;
        throw new Error(msg);
        }

        return response.json();
    }

  /**
   * Make an authenticated DELETE request
   */
    async delete<T>(url: string): Promise<T | void> {
        const headers = await this.getAuthHeaders();
        const response = await fetch(`${this.baseUrl}${url}`, {
        method: 'DELETE',
        headers,
        });

        if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
        }

        // 204 No Content or empty body should not attempt to parse JSON
        if (response.status === 204) {
        return;
        }
        const text = await response.text().catch(() => '');
        if (!text) {
        return;
        }
        return JSON.parse(text) as T;
    }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances
export default ApiClient;
