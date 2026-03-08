import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

// ============================================
// TYPES
// ============================================

export type AppRole =
  | "super_admin"
  | "school_admin"
  | "deputy_admin"
  | "teacher"
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

// Legacy compat
export type UserRole = "admin" | "accountant" | "teacher" | "librarian" | "parent" | "student";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  school_admin: "School Admin",
  deputy_admin: "Deputy Admin",
  teacher: "Teacher",
  finance_officer: "Finance Officer",
  front_office: "Front Office",
  transport_officer: "Transport Officer",
  store_manager: "Store Manager",
  pos_attendant: "POS Attendant",
  student: "Student",
  parent: "Parent",
  auditor: "Auditor",
  // Legacy labels
  admin: "Administrator",
  accountant: "Accountant",
  librarian: "Librarian",
};

const ROLE_PRIORITY: AppRole[] = [
  "super_admin",
  "school_admin",
  "deputy_admin",
  "finance_officer",
  "teacher",
  "front_office",
  "transport_officer",
  "store_manager",
  "pos_attendant",
  "auditor",
  "parent",
  "student",
];

// ============================================
// CONTEXT
// ============================================

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: UserRoleEntry[];
  primaryRole: AppRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Auth actions
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, metadata?: Record<string, string>) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;

  // Role helpers
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
  getRoleLabel: (role: string) => string;

  // Legacy compat
  role: UserRole;
  roleLabel: string;
  hasPermission: (allowed: UserRole[]) => boolean;
  login: (role: UserRole) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<UserRoleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Legacy state for backward compat with existing pages
  const [legacyRole, setLegacyRole] = useState<UserRole>("admin");

  // Fetch profile and roles
  const fetchUserData = useCallback(async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileData) {
        setProfile(profileData as Profile);
      }

      // Fetch roles
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role, school_id, is_active")
        .eq("user_id", userId)
        .eq("is_active", true);

      if (rolesData && rolesData.length > 0) {
        setRoles(rolesData as UserRoleEntry[]);
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  }, []);

  // Auth state listener
  useEffect(() => {
    // Set up listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Defer to avoid Supabase client deadlock
          setTimeout(() => fetchUserData(newSession.user.id), 0);
        } else {
          setProfile(null);
          setRoles([]);
        }

        if (event === "SIGNED_OUT") {
          setProfile(null);
          setRoles([]);
        }

        setIsLoading(false);
      }
    );

    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);

      if (existingSession?.user) {
        fetchUserData(existingSession.user.id);
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  // Computed values
  const primaryRole = roles.length > 0
    ? ROLE_PRIORITY.find(r => roles.some(ur => ur.role === r)) || roles[0].role
    : null;

  const isAuthenticated = !!session && !!user;

  // Auth actions
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message || null };
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, string>) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error?.message || null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRoles([]);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error?.message || null };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error?.message || null };
  };

  // Role helpers
  const hasRole = (role: AppRole) => roles.some(r => r.role === role);
  const hasAnyRole = (checkRoles: AppRole[]) => checkRoles.some(r => hasRole(r));
  const getRoleLabel = (role: string) => ROLE_LABELS[role] || role;

  // Legacy compat
  const legacyRoleLabel = ROLE_LABELS[legacyRole] || legacyRole;
  const hasPermission = (allowed: UserRole[]) => allowed.includes(legacyRole);
  const login = (r: UserRole) => setLegacyRole(r);
  const logout = () => { signOut(); setLegacyRole("admin"); };
  const switchRole = (r: UserRole) => setLegacyRole(r);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        primaryRole,
        isLoading,
        isAuthenticated,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        hasRole,
        hasAnyRole,
        getRoleLabel,
        // Legacy
        role: legacyRole,
        roleLabel: legacyRoleLabel,
        hasPermission,
        login,
        logout,
        switchRole,
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
