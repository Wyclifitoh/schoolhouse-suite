import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
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

  const [currentSchoolId, setCurrentSchoolId] = useState<string | null>(() => {
    try { return localStorage.getItem("chuo-school-id"); } catch { return null; }
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

  useEffect(() => {
    if (!currentSchoolId && schools.length > 0) {
      setCurrentSchoolId(schools[0].id);
    }
  }, [schools, currentSchoolId]);

  useEffect(() => {
    if (currentSchoolId) {
      localStorage.setItem("chuo-school-id", currentSchoolId);
      api.setSchoolId(currentSchoolId);
    }
  }, [currentSchoolId]);

  const currentSchool = schools.find(s => s.id === currentSchoolId) || null;

  return (
    <SchoolContext.Provider value={{ currentSchool, schools, schoolId: currentSchoolId, switchSchool: setCurrentSchoolId, isLoading }}>
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
