const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

class ApiClient {
  private token: string | null = null;
  private schoolId: string | null = null;

  setToken(token: string | null) { this.token = token; }
  setSchoolId(id: string | null) { this.schoolId = id; }
  getToken() { return this.token; }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    if (this.schoolId) headers['X-School-ID'] = this.schoolId;

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const json = await res.json();
    if (!res.ok || json.success === false) {
      throw new Error(json.error?.message || json.error || `Request failed: ${res.status}`);
    }
    return json.data as T;
  }

  get<T>(path: string) { return this.request<T>(path); }
  post<T>(path: string, body: unknown) { return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) }); }
  put<T>(path: string, body: unknown) { return this.request<T>(path, { method: 'PUT', body: JSON.stringify(body) }); }
  patch<T>(path: string, body?: unknown) { return this.request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }); }
  delete<T>(path: string) { return this.request<T>(path, { method: 'DELETE' }); }
}

export const api = new ApiClient();

// Restore token from localStorage on load
const savedToken = localStorage.getItem('chuo-token');
if (savedToken) api.setToken(savedToken);
const savedSchool = localStorage.getItem('chuo-school-id');
if (savedSchool) api.setSchoolId(savedSchool);
