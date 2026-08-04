const API_BASE =
  import.meta.env.VITE_API_URL || "https://chuoapi.wikiteq.co.ke/api/v1";

class ApiClient {
  private token: string | null = null;
  private schoolId: string | null = null;
  private academicYearId: string | null = null;
  private termId: string | null = null;
  private historical = false;

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
  setHistorical(v: boolean) {
    this.historical = v;
  }
  getToken() {
    return this.token;
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

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
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
      throw new Error(
        json.error?.message || json.error || `Request failed: ${res.status}`,
      );
    }
    return json.data as T;
  }

  get<T>(path: string) {
    return this.request<T>(path);
  }

  /** Returns full paginated envelope: { data, pagination } */
  async getPaginated<T>(path: string): Promise<{ data: T; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`;
    if (this.schoolId) headers["X-School-ID"] = this.schoolId;
    if (this.academicYearId) headers["X-Academic-Year-Id"] = this.academicYearId;
    if (this.termId) headers["X-Term-Id"] = this.termId;
    const API_BASE = import.meta.env.VITE_API_URL || "https://chuoapi.wikiteq.co.ke/api/v1";
    const res = await fetch(`${API_BASE}${path}`, { headers });
    const json = await res.json();
    if (!res.ok || json.success === false) throw new Error(json.error?.message || `Request failed: ${res.status}`);
    return { data: json.data as T, pagination: json.pagination };
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

  /** Upload a logo as base64 JSON to avoid multipart complexity */
  uploadLogoBase64(path: string, base64Data: string) {
    return this.request<{ logo_url: string }>(path, {
      method: "POST",
      body: JSON.stringify({ logo_base64: base64Data }),
    });
  }

  /**
   * Fetch a binary file (PDF/XLSX) with auth headers and open it in a new tab.
   * window.open() cannot send Authorization headers, which is why direct links
   * to authenticated endpoints return "Authentication required".
   */
  async openFile(path: string, filename?: string): Promise<void> {
    const headers: Record<string, string> = {};
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`;
    if (this.schoolId) headers["X-School-ID"] = this.schoolId;
    if (this.academicYearId)
      headers["X-Academic-Year-Id"] = this.academicYearId;
    if (this.termId) headers["X-Term-Id"] = this.termId;

    const res = await fetch(`${API_BASE}${path}`, { headers });
    if (!res.ok) {
      let message = `Download failed (${res.status})`;
      try {
        const json = await res.json();
        message = json?.error?.message || message;
      } catch {
        /* binary or empty body */
      }
      throw new Error(message);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (!win) {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "download.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
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
