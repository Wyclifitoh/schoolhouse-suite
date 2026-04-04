import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Finance report data
export function useFinanceReportData(filters?: { classId?: string; startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ["reports", "finance", filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.classId) params.set("class_id", filters.classId);
      if (filters?.startDate) params.set("start_date", filters.startDate);
      if (filters?.endDate) params.set("end_date", filters.endDate);
      const qs = params.toString();
      return api.get<any>(`/reports/finance${qs ? `?${qs}` : ""}`);
    },
  });
}

// Student report data
export function useStudentReportData(filters?: { classId?: string; year?: string }) {
  return useQuery({
    queryKey: ["reports", "students", filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.classId) params.set("class_id", filters.classId);
      if (filters?.year) params.set("year", filters.year);
      const qs = params.toString();
      return api.get<any>(`/reports/students${qs ? `?${qs}` : ""}`);
    },
  });
}

// Attendance report data
export function useAttendanceReportData(filters?: { classId?: string; month?: string }) {
  return useQuery({
    queryKey: ["reports", "attendance", filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.classId) params.set("class_id", filters.classId);
      if (filters?.month) params.set("month", filters.month);
      const qs = params.toString();
      return api.get<any>(`/reports/attendance${qs ? `?${qs}` : ""}`);
    },
  });
}

// Exam report data  
export function useExamReportData(filters?: { examId?: string }) {
  return useQuery({
    queryKey: ["reports", "exams", filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.examId) params.set("exam_id", filters.examId);
      const qs = params.toString();
      return api.get<any>(`/reports/exams${qs ? `?${qs}` : ""}`);
    },
  });
}

// HR report data
export function useHRReportData() {
  return useQuery({
    queryKey: ["reports", "hr"],
    queryFn: () => api.get<any>("/reports/hr"),
  });
}

// Payments data for reports
export function usePaymentsReportData(filters?: { startDate?: string; endDate?: string; method?: string }) {
  return useQuery({
    queryKey: ["reports", "payments", filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.set("start_date", filters.startDate);
      if (filters?.endDate) params.set("end_date", filters.endDate);
      if (filters?.method) params.set("method", filters.method);
      const qs = params.toString();
      return api.get<any>(`/reports/payments${qs ? `?${qs}` : ""}`);
    },
  });
}
