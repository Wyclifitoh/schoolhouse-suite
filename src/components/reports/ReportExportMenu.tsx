import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface ReportExportMenuProps {
  /** Backend path without extension, e.g. "/reports/finance/export" or "/reports/students/export" */
  path: string;
  /** Query string filters */
  params?: Record<string, string | undefined>;
  /** Base name for downloaded file */
  fileBase?: string;
  formats?: Array<"xlsx" | "pdf" | "csv">;
  size?: "sm" | "default";
  label?: string;
}

export function ReportExportMenu({
  path,
  params = {},
  fileBase = "report",
  formats = ["xlsx", "pdf"],
  size = "sm",
  label = "Export",
}: ReportExportMenuProps) {
  const download = async (kind: "xlsx" | "pdf" | "csv") => {
    try {
      const search = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") search.set(k, String(v));
      });
      const token = api.getToken();
      const schoolId = localStorage.getItem("chuo-school-id") || "";
      const base =
        (import.meta as any).env?.VITE_API_URL ||
        "https://chuoapi.wikiteq.co.ke/api/v1";
      const full = `${base}${path}.${kind}?${search.toString()}`;
      const res = await fetch(full, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-School-ID": schoolId,
        },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileBase}-${new Date().toISOString().slice(0, 10)}.${kind}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(e?.message || "Export failed");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={size}>
          <Download className="h-4 w-4 mr-1.5" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {formats.map((f) => (
          <DropdownMenuItem key={f} onClick={() => download(f)}>
            Export as {f.toUpperCase()}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
