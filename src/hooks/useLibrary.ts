import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface BookRow {
  id: string; title: string; author: string; isbn: string; publisher?: string;
  category: string; total_copies: number; available_copies: number;
  shelf_location: string; status: string;
}

export interface BookIssueRow {
  id: string; student_name: string; admission_no: string; class: string;
  book_title: string; issue_date: string; due_date: string;
  return_date: string | null; fine_amount: number; status: string;
  fine_paid: boolean; overdue_days: number; fine_per_day: number;
}

export function useBooks(search?: string, category?: string) {
  return useQuery({
    queryKey: ["library-books", search, category],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (category && category !== "all") params.set("category", category);
        const data = await api.get<any>(`/library/books?${params}`);
        return (data?.data || data || []) as BookRow[];
      } catch { return [] as BookRow[]; }
    },
  });
}

export function useBookIssues(search?: string, status?: string) {
  return useQuery({
    queryKey: ["book-issues", search, status],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (status && status !== "all") params.set("status", status);
        const data = await api.get<any>(`/library/issues?${params}`);
        return (data?.data || data || []) as BookIssueRow[];
      } catch { return [] as BookIssueRow[]; }
    },
  });
}
