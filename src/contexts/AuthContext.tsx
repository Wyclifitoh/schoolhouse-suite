import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type AppRole =
  // Canonical 7-role set (HR redesign 2026-05-31)
  | "super_admin"
  | "admin"
  | "manager"
  | "accountant"
  | "librarian"
  | "teacher"
  | "receptionist"
  // Legacy roles (kept for back-compat — do not assign to new staff)
  | "school_admin"
  | "deputy_admin"
  | "finance_officer"
  | "front_office"
  | "transport_officer"
  | "store_manager"
  | "pos_attendant"
  | "student"
  | "parent"
  | "auditor";

export interface Profile {
  id: string;
  school_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
}

export interface UserRoleEntry {
  role: AppRole;
  school_id: string | null;
  is_active: boolean;
}

export type UserRole =
  | "admin"
  | "accountant"
  | "teacher"
  | "librarian"
  | "parent"
  | "student";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Administrator",
  manager: "Manager",
  accountant: "Accountant",
  librarian: "Librarian",
  teacher: "Teacher",
  receptionist: "Receptionist",
  school_admin: "School Admin",
  deputy_admin: "Deputy Admin",
  finance_officer: "Finance Officer",
  front_office: "Front Office",
  transport_officer: "Transport Officer",
  store_manager: "Store Manager",
  pos_attendant: "POS Attendant",
  student: "Student",
  parent: "Parent",
  auditor: "Auditor",
};

const ROLE_PRIORITY: AppRole[] = [
  "super_admin",
  "school_admin",
  "admin",
  "deputy_admin",
  "manager",
  "finance_officer",
  "accountant",
  "teacher",
  "librarian",
  "receptionist",
  "front_office",
  "transport_officer",
  "store_manager",
  "pos_attendant",
  "auditor",
  "parent",
  "student",
];

interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  must_change_password?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  session: { token: string } | null;
  profile: Profile | null;
  roles: UserRoleEntry[];
  primaryRole: AppRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
  refreshMe: () => Promise<void>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; mustChangePassword?: boolean }>;
  signUp: (
    email: string,
    password: string,
    metadata?: Record<string, string>,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
  getRoleLabel: (role: string) => string;
  role: UserRole;
  roleLabel: string;
  hasPermission: (allowed: UserRole[]) => boolean;
  login: (role: UserRole) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "chuo-token";
const LAST_ACTIVITY_KEY = "chuo-last-activity";
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const ACTIVITY_WRITE_INTERVAL_MS = 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<UserRoleEntry[]>([]);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [legacyRole, setLegacyRole] = useState<UserRole>("admin");

  const clearAuth = useCallback(() => {
    setUser(null);
    setProfile(null);
    setRoles([]);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    // Clear per-school context so a fresh login doesn't reuse another
    // account's school id or cached data.
    localStorage.removeItem("chuo-school-id");
    localStorage.removeItem("chuo-term-id");
    localStorage.removeItem("chuo-academic-year-id");
    api.setToken(null);
    api.setSchoolId(null);
    api.setSession(null, null);
    // Nuke every React Query cache entry — no stale cross-tenant data.
    queryClient.clear();
  }, [queryClient]);

  // Any rejected authenticated request must immediately invalidate the local
  // session instead of leaving the UI in a half-authenticated blank state.
  useEffect(() => {
    api.onUnauthorized(clearAuth);
    return () => api.onUnauthorized(null);
  }, [clearAuth]);

  // Restore session on mount
  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || 0);
    if (lastActivity && Date.now() - lastActivity > IDLE_TIMEOUT_MS) {
      clearAuth();
      setIsLoading(false);
      return;
    }
    api.setToken(token);
    api
      .get<{ user: AuthUser; profile: Profile | null; roles: UserRoleEntry[] }>(
        "/auth/me",
      )
      .then((data) => {
        setUser(data.user);
        setProfile(data.profile);
        setRoles(data.roles || []);
      })
      .catch(() => clearAuth())
      .finally(() => setIsLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Enforce inactivity logout across refreshes and browser tabs. Activity is
  // persisted at most once per minute to avoid excessive storage writes.
  useEffect(() => {
    if (!token || !user) return;
    let lastWrite = 0;
    const markActivity = () => {
      const now = Date.now();
      if (now - lastWrite < ACTIVITY_WRITE_INTERVAL_MS) return;
      lastWrite = now;
      localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
    };
    const checkIdle = () => {
      const last = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || 0);
      if (last && Date.now() - last > IDLE_TIMEOUT_MS) clearAuth();
    };
    const syncLogout = (event: StorageEvent) => {
      if (event.key === TOKEN_KEY && !event.newValue) clearAuth();
    };
    const events: (keyof WindowEventMap)[] = [
      "pointerdown",
      "keydown",
      "scroll",
      "touchstart",
    ];
    markActivity();
    events.forEach((event) => window.addEventListener(event, markActivity, { passive: true }));
    window.addEventListener("storage", syncLogout);
    const timer = window.setInterval(checkIdle, 60_000);
    return () => {
      events.forEach((event) => window.removeEventListener(event, markActivity));
      window.removeEventListener("storage", syncLogout);
      window.clearInterval(timer);
    };
  }, [token, user, clearAuth]);

  const primaryRole =
    roles.length > 0
      ? ROLE_PRIORITY.find((r) => roles.some((ur) => ur.role === r)) ||
        roles[0].role
      : null;

  const isAuthenticated = !!token && !!user;

  const signIn = async (email: string, password: string) => {
    try {
      // Wipe any residual state from a previous account before signing in.
      localStorage.removeItem("chuo-school-id");
      localStorage.removeItem("chuo-term-id");
      localStorage.removeItem("chuo-academic-year-id");
      api.setSchoolId(null);
      api.setSession(null, null);
      queryClient.clear();

      const data = await api.post<{
        token: string;
        user: AuthUser;
        profile: Profile | null;
        roles: UserRoleEntry[];
      }>("/auth/login", { email, password });
      setToken(data.token);
      setUser(data.user);
      setProfile(data.profile);
      setRoles(data.roles || []);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
      api.setToken(data.token);
      return { error: null };
    } catch (err: any) {
      return { error: err.message || "Login failed" };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    metadata?: Record<string, string>,
  ) => {
    try {
      const data = await api.post<{
        token: string;
        user: AuthUser;
        profile: Profile | null;
        roles: UserRoleEntry[];
      }>("/auth/register", {
        email,
        password,
        full_name:
          `${metadata?.first_name || ""} ${metadata?.last_name || ""}`.trim() ||
          email,
        school_id: metadata?.school_id,
        role: metadata?.role,
      });
      setToken(data.token);
      setUser(data.user);
      setProfile(data.profile);
      setRoles(data.roles || []);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
      api.setToken(data.token);
      return { error: null };
    } catch (err: any) {
      return { error: err.message || "Registration failed" };
    }
  };

  const signOut = async () => {
    clearAuth();
  };

  const resetPassword = async (_email: string) => ({
    error: "Contact your administrator to reset password" as string | null,
  });
  const updatePassword = async (_password: string) => ({
    error: "Not implemented" as string | null,
  });

  const refreshMe = async () => {
    try {
      const data = await api.get<{
        user: AuthUser;
        profile: Profile | null;
        roles: UserRoleEntry[];
      }>("/auth/me");
      setUser(data.user);
      setProfile(data.profile);
      setRoles(data.roles || []);
    } catch {
      clearAuth();
    }
  };

  // Role aliases: canonical (2026 redesign) and legacy roles are equivalent.
  // This ensures users with the canonical role (e.g. "accountant") can access
  // routes that were originally guarded with the legacy name (e.g. "finance_officer").
  const ROLE_ALIASES: Record<string, AppRole[]> = {
    accountant: ["finance_officer"],
    finance_officer: ["accountant"],
    admin: ["school_admin"],
    school_admin: ["admin"],
    receptionist: ["front_office"],
    front_office: ["receptionist"],
    manager: ["deputy_admin"],
    deputy_admin: ["manager"],
  };
  /**
   * Role membership for the CURRENTLY SELECTED school only.
   *
   * These helpers are for presentation (labels, landing pages, identity
   * routes). They MUST NOT be used to grant access: authorization comes from
   * the server-resolved permission set (`useMyPermissions`), and the admin
   * wildcard is issued per-school by the backend authorization service.
   */
  const activeRoles = () => {
    const schoolId = localStorage.getItem("chuo-school-id");
    const live = roles.filter((r) => r.is_active !== false);
    if (!schoolId) return live;
    return live.filter((r) => !r.school_id || r.school_id === schoolId);
  };
  const hasRole = (role: AppRole) => {
    const scoped = activeRoles();
    if (scoped.some((r) => r.role === role)) return true;
    const aliases = ROLE_ALIASES[role] || [];
    return aliases.some((a) => scoped.some((r) => r.role === a));
  };
  const hasAnyRole = (checkRoles: AppRole[]) =>
    checkRoles.some((r) => hasRole(r));
  const getRoleLabel = (role: string) => ROLE_LABELS[role] || role;

  const mustChangePassword = !!user?.must_change_password;

  return (
    <AuthContext.Provider
      value={{
        user,
        session: token ? { token } : null,
        profile,
        roles,
        primaryRole,
        isLoading,
        isAuthenticated,
        mustChangePassword,
        refreshMe,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        hasRole,
        hasAnyRole,
        getRoleLabel,
        role: legacyRole,
        roleLabel: ROLE_LABELS[legacyRole] || legacyRole,
        hasPermission: (allowed) => allowed.includes(legacyRole),
        login: (r) => setLegacyRole(r),
        logout: () => {
          signOut();
          setLegacyRole("admin");
        },
        switchRole: (r) => setLegacyRole(r),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

export { ROLE_LABELS };
