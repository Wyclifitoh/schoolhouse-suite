import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

// ============================================
// TYPES
// ============================================

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

// ============================================
// CONTEXT
// ============================================

const SchoolContext = createContext<SchoolContextValue | undefined>(undefined);

export function SchoolProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();

  // Persist selected school
  const [currentSchoolId, setCurrentSchoolId] = useState<string | null>(() => {
    try {
      return localStorage.getItem("chuo-school-id");
    } catch {
      return null;
    }
  });

  // Fetch accessible schools
  const { data: schools = [], isLoading } = useQuery({
    queryKey: ["accessible-schools", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get school IDs from user_roles
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("school_id")
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (!roleData || roleData.length === 0) return [];

      const schoolIds = [...new Set(roleData.map(r => r.school_id).filter(Boolean))];

      if (schoolIds.length === 0) return [];

      const { data: schoolsData } = await supabase
        .from("schools")
        .select("id, name, code, email, phone, logo_url, address, curriculum_type, paybill_number")
        .in("id", schoolIds);

      return (schoolsData || []) as School[];
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  // Auto-select first school
  useEffect(() => {
    if (!currentSchoolId && schools.length > 0) {
      setCurrentSchoolId(schools[0].id);
    }
  }, [schools, currentSchoolId]);

  // Persist selection
  useEffect(() => {
    if (currentSchoolId) {
      localStorage.setItem("chuo-school-id", currentSchoolId);
    }
  }, [currentSchoolId]);

  const currentSchool = schools.find(s => s.id === currentSchoolId) || null;

  return (
    <SchoolContext.Provider
      value={{
        currentSchool,
        schools,
        schoolId: currentSchoolId,
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
