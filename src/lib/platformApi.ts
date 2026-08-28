// Separate API client for the CHUO platform (super-admin) console.
// Uses its own token storage key so it never collides with school-tenant auth.

const API_BASE =
  import.meta.env.VITE_API_URL || "https://api.chuoflow.co.ke/api/v1";

const TOKEN_KEY = "chuo-platform-token";

class PlatformApi {
  private token: string | null = null;

  constructor() {
    const t = localStorage.getItem(TOKEN_KEY);
    if (t) this.token = t;
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }

  getToken() {
    return this.token;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`;
    const res = await fetch(`${API_BASE}/admin${path}`, {
      ...options,
      headers,
    });
    const raw = await res.text();
    let json: any = null;
    try {
      json = raw ? JSON.parse(raw) : null;
    } catch {
      json = {
        success: false,
        error: { message: raw || `HTTP ${res.status}` },
      };
    }
    if (!res.ok || json.success === false) {
      throw new Error(json.error?.message || `Request failed: ${res.status}`);
    }
    return json.data as T;
  }

  get<T>(path: string) {
    return this.request<T>(path);
  }
  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }
  put<T>(path: string, body: unknown) {
    return this.request<T>(path, { method: "PUT", body: JSON.stringify(body) });
  }
  patch<T>(path: string, body: unknown) {
    return this.request<T>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }
  delete<T>(path: string) {
    return this.request<T>(path, { method: "DELETE" });
  }
}

export const platformApi = new PlatformApi();
