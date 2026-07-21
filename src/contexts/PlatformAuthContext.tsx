import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { platformApi } from "@/lib/platformApi";

export interface PlatformUser {
  id: string;
  email: string;
  full_name: string;
  role: "platform_admin" | "platform_support";
}

interface PlatformAuthCtx {
  user: PlatformUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => void;
}

const Ctx = createContext<PlatformAuthCtx | undefined>(undefined);

export function PlatformAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PlatformUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clear = useCallback(() => {
    setUser(null);
    platformApi.setToken(null);
  }, []);

  useEffect(() => {
    const t = platformApi.getToken();
    if (!t) { setIsLoading(false); return; }
    platformApi
      .get<PlatformUser>("/auth/me")
      .then(setUser)
      .catch(() => clear())
      .finally(() => setIsLoading(false));
  }, [clear]);

  const signIn = async (email: string, password: string) => {
    try {
      const data = await platformApi.post<{ token: string; user: PlatformUser }>("/auth/login", { email, password });
      platformApi.setToken(data.token);
      setUser(data.user);
      return { error: null };
    } catch (e: any) {
      return { error: e.message || "Login failed" };
    }
  };

  return (
    <Ctx.Provider value={{ user, isLoading, isAuthenticated: !!user, signIn, signOut: clear }}>
      {children}
    </Ctx.Provider>
  );
}

export const usePlatformAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePlatformAuth must be inside PlatformAuthProvider");
  return c;
};