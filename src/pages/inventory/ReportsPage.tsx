/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { InventoryNav } from "@/components/inventory/InventoryNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart3, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { useInventoryReport, useInventoryReports } from "@/hooks/useInventoryOps";

const humanise = (key: string) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const cellValue = (v: any) => {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "number") return v.toLocaleString();
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) return v.slice(0, 10);
  return String(v);
};

/** Inventory reporting workspace: pick a report, filter by date, export to CSV. */
export default function InventoryReports() {
  const { data: reports = [], isLoading: loadingList } = useInventoryReports();
  const [active, setActive] = useState<string | undefined>();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { data: report, isLoading } = useInventoryReport(active, { from, to });

  const rows = report?.rows || [];
  const columns = rows.length ? Object.keys(rows[0]) : [];

  const exportCsv = () => {
    if (!rows.length) return toast.error("Nothing to export yet");
    const head = columns.join(",");
    const body = rows
      .map((r: any) =>
        columns
          .map((c) => `"${String(r[c] ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob([`${head}\n${body}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${active}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout
      title="Inventory Reports"
      subtitle="Stock valuation, movement, issuance and purchasing reports"
    >
      <InventoryNav />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Available reports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {loadingList && <p className="text-sm text-muted-foreground">Loading…</p>}
            {reports.map((r) => (
              <button
                key={r.key}
                onClick={() => setActive(r.key)}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                  active === r.key
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-accent"
                }`}
              >
                {r.label}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">
                {report?.label || "Select a report"}
              </CardTitle>
              {!!active && (
                <p className="text-sm text-muted-foreground mt-1">
                  {rows.length} row{rows.length === 1 ? "" : "s"}
                </p>
              )}
            </div>
            <div className="flex items-end gap-2">
              <div className="space-y-1">
                <Label className="text-xs">From</Label>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">To</Label>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
              <Button variant="outline" size="sm" onClick={exportCsv} disabled={!rows.length}>
                <Download className="h-4 w-4 mr-1" /> CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!active && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <FileText className="h-8 w-8 mb-2" />
                <p className="text-sm">Choose a report from the list to run it.</p>
              </div>
            )}
            {active && isLoading && (
              <p className="py-12 text-center text-muted-foreground text-sm">Running report…</p>
            )}
            {active && !isLoading && !rows.length && (
              <p className="py-12 text-center text-muted-foreground text-sm">
                No data for this report and date range.
              </p>
            )}
            {active && !isLoading && !!rows.length && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((c) => (
                        <TableHead key={c}>{humanise(c)}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r: any, i: number) => (
                      <TableRow key={i}>
                        {columns.map((c) => (
                          <TableCell key={c} className="text-sm">
                            {cellValue(r[c])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
