import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
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
  academicYears: AcademicYear[];
  currentAcademicYear: AcademicYear | null;
  switchTerm: (termId: string) => void;
  isViewingCurrentTerm: boolean;
  isLoading: boolean;
}

const TermContext = createContext<TermContextValue | undefined>(undefined);

export function TermProvider({ children }: { children: ReactNode }) {
  const { schoolId } = useSchool();
  const { isAuthenticated } = useAuth();

  const [selectedTermId, setSelectedTermId] = useState<string | null>(() => {
    try { return localStorage.getItem("chuo-term-id"); } catch { return null; }
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

  const currentTerm = terms.find(t => t.is_current) ||
    terms.find(t => { const now = new Date(); return new Date(t.start_date) <= now && new Date(t.end_date) >= now; }) ||
    terms[0] || null;

  const currentAcademicYear = academicYears.find(ay => ay.is_current) || academicYears[0] || null;

  useEffect(() => {
    if (!selectedTermId && currentTerm) setSelectedTermId(currentTerm.id);
  }, [currentTerm, selectedTermId]);

  useEffect(() => { setSelectedTermId(null); }, [schoolId]);

  useEffect(() => {
    if (selectedTermId) localStorage.setItem("chuo-term-id", selectedTermId);
  }, [selectedTermId]);

  const selectedTerm = terms.find(t => t.id === selectedTermId) || currentTerm;

  return (
    <TermContext.Provider value={{
      currentTerm, selectedTerm, terms, academicYears, currentAcademicYear,
      switchTerm: setSelectedTermId, isViewingCurrentTerm: selectedTerm?.id === currentTerm?.id, isLoading: termsLoading,
    }}>
      {children}
    </TermContext.Provider>
  );
}

export const useTerm = () => {
  const ctx = useContext(TermContext);
  if (!ctx) throw new Error("useTerm must be inside TermProvider");
  return ctx;
};
