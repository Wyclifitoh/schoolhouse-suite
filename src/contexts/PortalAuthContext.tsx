import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { portalApi } from "@/lib/portalApi";

export interface PortalAccount {
  id: string;
  type: "parent" | "student";
  school_id: string;
  school_name?: string;
  must_change_pin?: boolean;
}
export interface PortalChild {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  gender: string | null;
  grade_name: string | null;
  stream_name: string | null;
  relationship?: string;
}
export interface PortalMe {
  type: "parent" | "student";
  school_id: string;
  children?: PortalChild[];
  student?: PortalChild;
}

interface Ctx {
  account: PortalAccount | null;
  me: PortalMe | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    type: "parent" | "student",
    identifier: string,
    pin: string,
  ) => Promise<{ error: string | null; account?: PortalAccount }>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const PortalAuthContext = createContext<Ctx | undefined>(undefined);

export function PortalAuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<PortalAccount | null>(() => {
    const raw = localStorage.getItem("chuo-portal-account");
    return raw ? JSON.parse(raw) : null;
  });
  const [me, setMe] = useState<PortalMe | null>(null);
  const [isLoading, setIsLoading] = useState(!!portalApi.getToken());

  const refresh = useCallback(async () => {
    if (!portalApi.getToken()) {
      setIsLoading(false);
      return;
    }
    try {
      const data = await portalApi.get<PortalMe>("/portal/me");
      setMe(data);
    } catch {
      portalApi.setToken(null);
      localStorage.removeItem("chuo-portal-account");
      setAccount(null);
      setMe(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login: Ctx["login"] = async (account_type, identifier, pin) => {
    try {
      const data = await portalApi.post<{
        token: string;
        account: PortalAccount;
      }>("/portal/login", { account_type, identifier, pin });
      portalApi.setToken(data.token);
      localStorage.setItem("chuo-portal-account", JSON.stringify(data.account));
      setAccount(data.account);
      const meData = await portalApi.get<PortalMe>("/portal/me");
      setMe(meData);
      return { error: null, account: data.account };
    } catch (e: any) {
      return { error: e.message || "Login failed" };
    }
  };

  const logout = () => {
    portalApi.setToken(null);
    localStorage.removeItem("chuo-portal-account");
    setAccount(null);
    setMe(null);
  };

  return (
    <PortalAuthContext.Provider
      value={{
        account,
        me,
        isLoading,
        isAuthenticated: !!account && !!portalApi.getToken(),
        login,
        logout,
        refresh,
      }}
    >
      {children}
    </PortalAuthContext.Provider>
  );
}

export function usePortalAuth() {
  const c = useContext(PortalAuthContext);
  if (!c)
    throw new Error("usePortalAuth must be inside PortalAuthProvider");
  return c;
}
