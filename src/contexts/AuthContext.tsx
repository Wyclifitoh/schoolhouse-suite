import { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "admin" | "accountant" | "teacher" | "librarian" | "parent" | "student";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  school: string;
  children?: string[]; // for parent role
  studentId?: string;  // for student role
}

const MOCK_USERS: Record<UserRole, MockUser> = {
  admin: { id: "u1", name: "Jane Kamau", email: "admin@school.ac.ke", role: "admin", avatar: "JK", school: "Chuo Academy", },
  accountant: { id: "u2", name: "John Mutiso", email: "accountant@school.ac.ke", role: "accountant", avatar: "JM", school: "Chuo Academy", },
  teacher: { id: "u3", name: "Mr. Kamau", email: "teacher@school.ac.ke", role: "teacher", avatar: "MK", school: "Chuo Academy", },
  librarian: { id: "u4", name: "Susan Wambui", email: "librarian@school.ac.ke", role: "librarian", avatar: "SW", school: "Chuo Academy", },
  parent: { id: "u5", name: "Mary Wanjiku", email: "parent@school.ac.ke", role: "parent", avatar: "MW", school: "Chuo Academy", children: ["s1", "s9"] },
  student: { id: "u6", name: "Amina Wanjiku", email: "student@school.ac.ke", role: "student", avatar: "AW", school: "Chuo Academy", studentId: "s1" },
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator",
  accountant: "Accountant",
  teacher: "Teacher",
  librarian: "Librarian",
  parent: "Parent",
  student: "Student",
};

interface AuthContextType {
  user: MockUser | null;
  role: UserRole;
  roleLabel: string;
  login: (role: UserRole) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  hasPermission: (allowed: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(MOCK_USERS.admin);
  const [role, setRole] = useState<UserRole>("admin");

  const login = (r: UserRole) => { setRole(r); setUser(MOCK_USERS[r]); };
  const logout = () => { setUser(null); setRole("admin"); };
  const switchRole = (r: UserRole) => { setRole(r); setUser(MOCK_USERS[r]); };
  const hasPermission = (allowed: UserRole[]) => allowed.includes(role);

  return (
    <AuthContext.Provider value={{ user, role, roleLabel: ROLE_LABELS[role], login, logout, switchRole, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};

export { ROLE_LABELS, MOCK_USERS };
