import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
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
  isReady: boolean;
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
  const prevSessionRef = useRef<{ y: string | null; t: string | null }>({
    y: null,
    t: null,
  });
  useEffect(() => {
    // Don't clobber the api session with nulls — wait until we actually have
    // resolved term/year ids (from localStorage or from the /terms endpoint).
    // Otherwise queries that mount before terms load fire without the
    // X-Term-Id / X-Academic-Year-Id headers and return empty data, forcing
    // users to manually refresh the page.
    if (!selectedTermId || !selectedYearId) return;
    localStorage.setItem("chuo-term-id", selectedTermId);
    localStorage.setItem("chuo-academic-year-id", selectedYearId);
    api.setSession(selectedYearId, selectedTermId);
    // Only invalidate when the session actually CHANGES from a previously
    // resolved value. Invalidating on the initial resolution causes screens
    // that just mounted (already fetching with correct headers) to refetch
    // and flicker — data appears, then briefly disappears.
    const prev = prevSessionRef.current;
    if (
      prev.y !== null &&
      prev.t !== null &&
      (prev.y !== selectedYearId || prev.t !== selectedTermId)
    ) {
      queryClient.invalidateQueries();
    }
    prevSessionRef.current = { y: selectedYearId, t: selectedTermId };
  }, [selectedTermId, selectedYearId, queryClient]);

  const selectedTerm =
    terms.find((t) => t.id === selectedTermId) || currentTerm;
  const selectedAcademicYear =
    academicYears.find((ay) => ay.id === selectedYearId) || currentAcademicYear;

  const isViewingCurrentTerm =
    selectedTerm?.id === currentTerm?.id &&
    selectedAcademicYear?.id === currentAcademicYear?.id;

  // "Ready" means the api client has session headers set. When the user is
  // authenticated inside a school, we require terms to have resolved before
  // dependent queries fire. On the public/login side there's no school, so
  // we're trivially ready.
  const isReady = !isAuthenticated
    ? true
    : !schoolId
      ? true
      : !!selectedTermId && !!selectedYearId;

  // Propagate historical-view flag to api client so backend can enforce.
  useEffect(() => {
    api.setHistorical(!isViewingCurrentTerm && !!selectedTerm);
  }, [isViewingCurrentTerm, selectedTerm]);

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
        isViewingCurrentTerm,
        isLoading: termsLoading,
        isReady,
      }}
    >
      {isReady ? (
        children
      ) : (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <div className="text-sm">Loading academic session…</div>
          </div>
        </div>
      )}
    </TermContext.Provider>
  );
}

export const useTerm = () => {
  const ctx = useContext(TermContext);
  if (!ctx) throw new Error("useTerm must be inside TermProvider");
  return ctx;
};
