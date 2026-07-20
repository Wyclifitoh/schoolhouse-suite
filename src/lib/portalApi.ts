// Lightweight API client for parent/student portal — separate token storage
// so it doesn't collide with staff auth.
const API_BASE =
  import.meta.env.VITE_API_URL || "https://chuoapi.wikiteq.co.ke/api/v1";

const TOKEN_KEY = "chuo-portal-token";

class PortalApi {
  private token: string | null = localStorage.getItem(TOKEN_KEY);

  setToken(t: string | null) {
    this.token = t;
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  }
  getToken() {
    return this.token;
  }

  private async req<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((init.headers as Record<string, string>) || {}),
    };
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`;
    const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
    const raw = await res.text();
    let json: any = null;
    try {
      json = raw ? JSON.parse(raw) : null;
    } catch {
      json = { success: false, error: { message: raw || `HTTP ${res.status}` } };
    }
    if (!res.ok || json?.success === false) {
      throw new Error(json?.error?.message || `Request failed: ${res.status}`);
    }
    return json.data as T;
  }

  get<T>(p: string) {
    return this.req<T>(p);
  }
  post<T>(p: string, b: unknown) {
    return this.req<T>(p, { method: "POST", body: JSON.stringify(b) });
  }
  request<T>(p: string, init: RequestInit = {}) {
    return this.req<T>(p, init);
  }
}

export const portalApi = new PortalApi();
