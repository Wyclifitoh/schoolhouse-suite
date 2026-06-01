import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<UserRoleEntry[]>([]);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("chuo-token"),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [legacyRole, setLegacyRole] = useState<UserRole>("admin");

  const clearAuth = useCallback(() => {
    setUser(null);
    setProfile(null);
    setRoles([]);
    setToken(null);
    localStorage.removeItem("chuo-token");
    api.setToken(null);
  }, []);

  // Restore session on mount
  useEffect(() => {
    if (!token) {
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

  const primaryRole =
    roles.length > 0
      ? ROLE_PRIORITY.find((r) => roles.some((ur) => ur.role === r)) ||
        roles[0].role
      : null;

  const isAuthenticated = !!token && !!user;

  const signIn = async (email: string, password: string) => {
    try {
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
      localStorage.setItem("chuo-token", data.token);
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
      localStorage.setItem("chuo-token", data.token);
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

  const hasRole = (role: AppRole) => roles.some((r) => r.role === role);
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
