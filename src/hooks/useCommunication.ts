import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface NoticeRow {
  id: string; title: string; message: string; audience: string;
  priority: string; author: string; date: string;
}

export interface DownloadRow {
  id: string; title: string; category: string; file_type: string;
  size: string; audience: string; date: string; url?: string;
}

export function useNotices() {
  return useQuery({
    queryKey: ["notices"],
    queryFn: async () => {
      try {
        const data = await api.get<any>("/communication/notices");
        return (data?.data || data || []) as NoticeRow[];
      } catch { return [] as NoticeRow[]; }
    },
  });
}

export function useDownloads() {
  return useQuery({
    queryKey: ["downloads"],
    queryFn: async () => {
      try {
        const data = await api.get<any>("/communication/downloads");
        return (data?.data || data || []) as DownloadRow[];
      } catch { return [] as DownloadRow[]; }
    },
  });
}
