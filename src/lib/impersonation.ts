// Helpers to enter/exit a school impersonation session initiated by a
// platform admin. Keeps platform token intact so the admin can return
// to /admin after exiting.

import { api } from "@/lib/api";

const KEY = "chuo-impersonation";

export interface ImpersonationMeta {
  school_id: string;
  school_name: string;
  as_user_id: string;
  as_email: string;
  started_at: string;
  expires_at: number; // epoch ms
}

export function beginImpersonation(payload: {
  token: string;
  schoolId: string;
  schoolName: string;
  userId: string;
  userEmail: string;
  expiresInSec: number;
}) {
  const meta: ImpersonationMeta = {
    school_id: payload.schoolId,
    school_name: payload.schoolName,
    as_user_id: payload.userId,
    as_email: payload.userEmail,
    started_at: new Date().toISOString(),
    expires_at: Date.now() + payload.expiresInSec * 1000,
  };
  localStorage.setItem("chuo-token", payload.token);
  localStorage.setItem("chuo-school-id", payload.schoolId);
  localStorage.setItem(KEY, JSON.stringify(meta));
  api.setToken(payload.token);
  api.setSchoolId(payload.schoolId);
}

export function getImpersonation(): ImpersonationMeta | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const meta = JSON.parse(raw) as ImpersonationMeta;
    if (meta.expires_at && Date.now() > meta.expires_at) {
      endImpersonation();
      return null;
    }
    return meta;
  } catch {
    return null;
  }
}

export function endImpersonation() {
  localStorage.removeItem(KEY);
  localStorage.removeItem("chuo-token");
  localStorage.removeItem("chuo-school-id");
  localStorage.removeItem("chuo-academic-year-id");
  localStorage.removeItem("chuo-term-id");
  api.setToken(null);
  api.setSchoolId(null);
  api.setSession(null, null);
}