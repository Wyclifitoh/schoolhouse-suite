import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "./AuthContext";

export interface School {
  id: string;
  name: string;
  code: string | null;
  email: string | null;
  phone: string | null;
  logo_url: string | null;
  address: string | null;
  curriculum_type: string | null;
  paybill_number: string | null;
}

interface SchoolContextValue {
  currentSchool: School | null;
  schools: School[];
  schoolId: string | null;
  switchSchool: (schoolId: string) => void;
  isLoading: boolean;
}

const SchoolContext = createContext<SchoolContextValue | undefined>(undefined);

export function SchoolProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [currentSchoolId, setCurrentSchoolId] = useState<string | null>(() => {
    try {
      return localStorage.getItem("chuo-school-id");
    } catch {
      return null;
    }
  });

  const { data: schools = [], isLoading } = useQuery({
    queryKey: ["accessible-schools"],
    queryFn: async () => {
      const data = await api.get<School[]>("/schools/my-schools");
      return data || [];
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const effectiveSchoolId = currentSchoolId || schools[0]?.id || null;

  // Propagate to the api client SYNCHRONOUSLY during render so queries that
  // mount in the same commit already carry the X-School-ID header. Doing this
  // in an effect used to leave the first batch of requests unscoped, which
  // showed up as empty screens until a manual refresh.
  if (effectiveSchoolId && api.getSchoolId?.() !== effectiveSchoolId) {
    api.setSchoolId(effectiveSchoolId);
  }

  useEffect(() => {
    if (!currentSchoolId && schools.length > 0) {
      setCurrentSchoolId(schools[0].id);
    }
  }, [schools, currentSchoolId]);

  // Whenever the active school changes, drop every cached query that
  // could belong to another tenant. Keep the school list itself.
  const prevSchoolIdRef = useRef<string | null>(currentSchoolId);
  useEffect(() => {
    if (effectiveSchoolId) {
      try {
        localStorage.setItem("chuo-school-id", effectiveSchoolId);
      } catch {
        /* storage unavailable */
      }
    }
    const prev = prevSchoolIdRef.current;
    if (prev && prev !== effectiveSchoolId) {
      queryClient.removeQueries({
        predicate: (q) => {
          const key = q.queryKey?.[0];
          return key !== "accessible-schools";
        },
      });
    }
    prevSchoolIdRef.current = effectiveSchoolId;
  }, [effectiveSchoolId, queryClient]);


  const currentSchool =
    schools.find((s) => s.id === effectiveSchoolId) || null;

  return (
    <SchoolContext.Provider
      value={{
        currentSchool,
        schools,
        schoolId: effectiveSchoolId,

        switchSchool: setCurrentSchoolId,
        isLoading,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
}

export const useSchool = () => {
  const ctx = useContext(SchoolContext);
  if (!ctx) throw new Error("useSchool must be inside SchoolProvider");
  return ctx;
};

export const useSchoolId = () => {
  const { schoolId } = useSchool();
  return schoolId;
};
