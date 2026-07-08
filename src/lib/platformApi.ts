/**
 * platformApi — HTTP client for the CHUO Platform Console API.
 * Mirrors the shape of the regular `api.ts` client but points to
 * the /api/platform base path and uses its own token store.
 */

const PLATFORM_BASE = (() => {
  // Strip the /api/v1 suffix and replace with /api/platform
  const schoolBase =
    import.meta.env.VITE_API_URL || "https://chuoapi.wikiteq.co.ke/api/v1";
  return schoolBase.replace(/\/api\/v1\/?$/, "/api/platform");
})();

const TOKEN_KEY = "chuo-platform-token";

class PlatformApiClient {
  private token: string | null = null;

  constructor() {
    // Restore token from storage on module load
    this.token = localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`;

    const res = await fetch(`${PLATFORM_BASE}${path}`, { ...options, headers });
    const raw = await res.text();
    let json: any = null;
    try {
      json = raw ? JSON.parse(raw) : null;
    } catch {
      json = { success: false, error: { message: raw || `Request failed: ${res.status}` } };
    }

    if (!res.ok || json?.success === false) {
      throw new Error(json?.error?.message || json?.error || `Request failed: ${res.status}`);
    }
    return json?.data as T;
  }

  get<T = unknown>(path: string): Promise<T> {
    return this.request<T>(path);
  }

  post<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  put<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  delete<T = unknown>(path: string): Promise<T> {
    return this.request<T>(path, { method: "DELETE" });
  }
}

export const platformApi = new PlatformApiClient();
