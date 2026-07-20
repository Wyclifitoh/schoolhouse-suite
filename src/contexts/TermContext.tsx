import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useSchool } from "./SchoolContext";
import { useAuth } from "./AuthContext";

export interface Term {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  academic_year_id: string;
}

export interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

interface TermContextValue {
  currentTerm: Term | null;
  selectedTerm: Term | null;
  terms: Term[];
  termsForYear: Term[];
  academicYears: AcademicYear[];
  currentAcademicYear: AcademicYear | null;
  selectedAcademicYear: AcademicYear | null;
  switchTerm: (termId: string) => void;
  switchAcademicYear: (yearId: string) => void;
  isViewingCurrentTerm: boolean;
  isLoading: boolean;
}

const TermContext = createContext<TermContextValue | undefined>(undefined);

export function TermProvider({ children }: { children: ReactNode }) {
  const { schoolId } = useSchool();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [selectedTermId, setSelectedTermId] = useState<string | null>(() => {
    try {
      return localStorage.getItem("chuo-term-id");
    } catch {
      return null;
    }
  });
  const [selectedYearId, setSelectedYearId] = useState<string | null>(() => {
    try {
      return localStorage.getItem("chuo-academic-year-id");
    } catch {
      return null;
    }
  });

  const { data: terms = [], isLoading: termsLoading } = useQuery({
    queryKey: ["terms", schoolId],
    queryFn: () => api.get<Term[]>("/schools/terms"),
    enabled: !!schoolId && isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const { data: academicYears = [] } = useQuery({
    queryKey: ["academic-years", schoolId],
    queryFn: () => api.get<AcademicYear[]>("/schools/academic-years"),
    enabled: !!schoolId && isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const currentTerm =
    terms.find((t) => t.is_current) ||
    terms.find((t) => {
      const now = new Date();
      return new Date(t.start_date) <= now && new Date(t.end_date) >= now;
    }) ||
    terms[0] ||
    null;

  const currentAcademicYear =
    academicYears.find((ay) => ay.is_current) || academicYears[0] || null;

  // Initialize from current when not set
  useEffect(() => {
    if (!selectedTermId && currentTerm) setSelectedTermId(currentTerm.id);
  }, [currentTerm, selectedTermId]);
  useEffect(() => {
    if (!selectedYearId && currentAcademicYear)
      setSelectedYearId(currentAcademicYear.id);
  }, [currentAcademicYear, selectedYearId]);

  // Reset on school switch
  useEffect(() => {
    setSelectedTermId(null);
    setSelectedYearId(null);
  }, [schoolId]);

  // Persist + propagate to api client + invalidate every cached query so the
  // whole app refetches under the new session.
  useEffect(() => {
    if (selectedTermId) localStorage.setItem("chuo-term-id", selectedTermId);
    if (selectedYearId)
      localStorage.setItem("chuo-academic-year-id", selectedYearId);
    api.setSession(selectedYearId, selectedTermId);
    // Invalidate every query so caches under the previous session are dropped.
    queryClient.invalidateQueries();
  }, [selectedTermId, selectedYearId, queryClient]);

  const selectedTerm =
    terms.find((t) => t.id === selectedTermId) || currentTerm;
  const selectedAcademicYear =
    academicYears.find((ay) => ay.id === selectedYearId) || currentAcademicYear;

  // Terms scoped to the selected academic year (for the year-then-term UI)
  const termsForYear = selectedAcademicYear
    ? terms.filter((t) => t.academic_year_id === selectedAcademicYear.id)
    : terms;

  // Switching year auto-picks that year's current/first term
  const switchAcademicYear = (yearId: string) => {
    setSelectedYearId(yearId);
    const yearTerms = terms.filter((t) => t.academic_year_id === yearId);
    const next = yearTerms.find((t) => t.is_current) || yearTerms[0];
    if (next) setSelectedTermId(next.id);
  };

  return (
    <TermContext.Provider
      value={{
        currentTerm,
        selectedTerm,
        terms,
        termsForYear,
        academicYears,
        currentAcademicYear,
        selectedAcademicYear,
        switchTerm: setSelectedTermId,
        switchAcademicYear,
        isViewingCurrentTerm:
          selectedTerm?.id === currentTerm?.id &&
          selectedAcademicYear?.id === currentAcademicYear?.id,
        isLoading: termsLoading,
      }}
    >
      {children}
    </TermContext.Provider>
  );
}

export const useTerm = () => {
  const ctx = useContext(TermContext);
  if (!ctx) throw new Error("useTerm must be inside TermProvider");
  return ctx;
};
