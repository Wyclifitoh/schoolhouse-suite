import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { usePortalAuth, PortalChild } from "./PortalAuthContext";

interface Ctx {
  children: PortalChild[];
  selectedId: string | null;
  setSelectedId: (id: string) => void;
  selected: PortalChild | null;
}

const SelectedChildContext = createContext<Ctx | undefined>(undefined);

const KEY = "chuo-portal-selected-child";

export function SelectedChildProvider({ children }: { children: ReactNode }) {
  const { me } = usePortalAuth();
  const list = me?.children || [];
  const [selectedId, setSelectedIdState] = useState<string | null>(() =>
    localStorage.getItem(KEY),
  );

  useEffect(() => {
    if (!list.length) return;
    if (!selectedId || !list.find((c) => c.id === selectedId)) {
      const next = list[0].id;
      setSelectedIdState(next);
      localStorage.setItem(KEY, next);
    }
  }, [list, selectedId]);

  const setSelectedId = (id: string) => {
    setSelectedIdState(id);
    localStorage.setItem(KEY, id);
  };

  const value = useMemo<Ctx>(
    () => ({
      children: list,
      selectedId,
      setSelectedId,
      selected: list.find((c) => c.id === selectedId) || list[0] || null,
    }),
    [list, selectedId],
  );

  return (
    <SelectedChildContext.Provider value={value}>
      {children}
    </SelectedChildContext.Provider>
  );
}

export function useSelectedChild() {
  const c = useContext(SelectedChildContext);
  if (!c)
    throw new Error(
      "useSelectedChild must be used inside SelectedChildProvider",
    );
  return c;
}