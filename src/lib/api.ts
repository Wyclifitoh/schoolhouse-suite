const API_BASE =
  import.meta.env.VITE_API_URL || "https://api.chuoflow.co.ke/api/v1";

class ApiClient {
  private token: string | null = null;
  private schoolId: string | null = null;
  private academicYearId: string | null = null;
  private termId: string | null = null;
  private isHistorical: boolean = false;
  private unauthorizedHandler: (() => void) | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  setSchoolId(id: string | null) {
    this.schoolId = id;
  }
  setSession(academicYearId: string | null, termId: string | null) {
    this.academicYearId = academicYearId;
    this.termId = termId;
  }
  setHistorical(isHistorical: boolean) {
    this.isHistorical = isHistorical;
  }
  onUnauthorized(handler: (() => void) | null) {
    this.unauthorizedHandler = handler;
  }
  getToken() {
    return this.token;
  }
  getSchoolId() {
    return this.schoolId;
  }

  getSession() {
    return { academicYearId: this.academicYearId, termId: this.termId };
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
    if (this.schoolId) headers["X-School-ID"] = this.schoolId;
    if (this.academicYearId)
      headers["X-Academic-Year-Id"] = this.academicYearId;
    if (this.termId) headers["X-Term-Id"] = this.termId;
    if (this.isHistorical) headers["X-Historical-View"] = "true";

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    let res: Response;
    try {
      res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
        signal: options.signal || controller.signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error("The server took too long to respond. Please try again.");
      }
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
    const raw = await res.text();
    let json: any = null;
    try {
      json = raw ? JSON.parse(raw) : null;
    } catch {
      json = {
        success: false,
        error: { message: raw || `Request failed: ${res.status}` },
      };
    }
    if (!res.ok || json.success === false) {
      if (res.status === 401 && path !== "/auth/login") {
        this.unauthorizedHandler?.();
      }
      throw new Error(
        json.error?.message || json.error || `Request failed: ${res.status}`,
      );
    }
    return json.data as T;
  }

  get<T>(path: string) {
    return this.request<T>(path);
  }
  post<T>(path: string, body: unknown) {
    return this.request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }
  put<T>(path: string, body: unknown) {
    return this.request<T>(path, { method: "PUT", body: JSON.stringify(body) });
  }
  patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }
  delete<T>(path: string) {
    return this.request<T>(path, { method: "DELETE" });
  }
}

export const api = new ApiClient();

// Restore from localStorage on load
const savedToken = localStorage.getItem("chuo-token");
if (savedToken) api.setToken(savedToken);
const savedSchool = localStorage.getItem("chuo-school-id");
if (savedSchool) api.setSchoolId(savedSchool);
const savedYear = localStorage.getItem("chuo-academic-year-id");
const savedTerm = localStorage.getItem("chuo-term-id");
if (savedYear || savedTerm) api.setSession(savedYear, savedTerm);
