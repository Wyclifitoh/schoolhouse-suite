import { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface BulkExpenseImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported?: () => void;
}

const TEMPLATE_HEADERS = [
  "title",
  "amount",
  "date",
  "category",
  "supplier",
  "supplier_pin",
  "payment_method",
  "reference",
  "description",
  "status",
];

export function BulkExpenseImportDialog({
  open,
  onOpenChange,
  onImported,
}: BulkExpenseImportDialogProps) {
  const [rows, setRows] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      TEMPLATE_HEADERS,
      [
        "Electricity Bill - March",
        15000,
        new Date().toISOString().slice(0, 10),
        "Utilities",
        "Kenya Power",
        "P051234567A",
        "mpesa",
        "INV-001",
        "March 2026 bill",
        "pending",
      ],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    XLSX.writeFile(wb, "expenses-import-template.xlsx");
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<any>(ws, { defval: "" });
        setRows(json);
        toast.success(`${json.length} rows ready to import`);
      } catch {
        toast.error("Could not parse file");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const submit = async () => {
    if (!rows.length) return;
    setSubmitting(true);
    try {
      const res = await api.post<any>("/expenses/bulk-import", { rows });
      const data = (res as any)?.data || res;
      toast.success(
        `Imported ${data?.imported ?? rows.length} expenses${data?.errors?.length ? `, ${data.errors.length} errors` : ""}`,
      );
      onImported?.();
      onOpenChange(false);
      setRows([]);
    } catch (e: any) {
      toast.error(e.message || "Import failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk Import Expenses</DialogTitle>
          <DialogDescription>
            Download the template, fill it in, then upload to import. Supplier
            and category are matched by name; tax PIN can be used to disambiguate
            suppliers.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Button variant="outline" onClick={downloadTemplate} className="w-full">
            <Download className="h-4 w-4 mr-2" /> Download Excel Template
          </Button>
          <label className="block">
            <span className="text-xs text-muted-foreground">Upload filled file (.xlsx)</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="mt-1 block w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:cursor-pointer"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </label>
          {rows.length > 0 && (
            <div className="text-sm flex items-center gap-2 p-2 bg-muted/40 rounded">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              {rows.length} rows ready
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!rows.length || submitting}>
            <Upload className="h-4 w-4 mr-2" />
            {submitting ? "Importing..." : `Import ${rows.length || ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
