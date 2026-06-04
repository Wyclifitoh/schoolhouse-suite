import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useStudents } from "@/hooks/useStudents";
import { useTerm } from "@/contexts/TermContext";

type Row = {
  admission_number: string;
  student_name?: string;
  amount: number;
  reference?: string;
  notes?: string;
  _status?: "pending" | "success" | "error";
  _message?: string;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TEMPLATE_HEADERS = ["admission_number", "student_name", "amount", "reference", "notes"];

export function BulkPaymentImportDialog({ open, onOpenChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { selectedTerm } = useTerm();
  const { data: students = [] } = useStudents();
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [rows, setRows] = useState<Row[]>([]);
  const [fileName, setFileName] = useState("");
  const [progress, setProgress] = useState(0);

  const downloadTemplate = () => {
    // Pre-fill admission_number + student_name from the current school's students
    const data = [
      TEMPLATE_HEADERS,
      ...(students as any[]).map((s) => [
        s.admission_number || "",
        `${s.first_name || ""} ${s.last_name || ""}`.trim(),
        "", // amount
        "", // reference
        "", // notes
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws["!cols"] = [{ wch: 18 }, { wch: 28 }, { wch: 12 }, { wch: 22 }, { wch: 30 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payments");
    XLSX.writeFile(wb, "payments-bulk-template.xlsx");
    toast.success(`Template downloaded with ${(students as any[]).length} students`);
  };

  const onFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });
        const parsed: Row[] = raw
          .map((r) => ({
            admission_number: String(r.admission_number || "").trim(),
            student_name: String(r.student_name || "").trim(),
            amount: Number(r.amount) || 0,
            reference: String(r.reference || "").trim(),
            notes: String(r.notes || "").trim(),
            _status: "pending" as const,
          }))
          .filter((r) => r.admission_number && r.amount > 0);
        setRows(parsed);
        if (!parsed.length) toast.error("No valid rows found. Ensure admission_number and amount are filled.");
        else toast.success(`Parsed ${parsed.length} payment rows`);
      } catch (err: any) {
        toast.error(err.message || "Failed to read file");
      }
    };
    reader.readAsBinaryString(file);
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      let success = 0;
      let failed = 0;
      const updated = [...rows];
      for (let i = 0; i < updated.length; i++) {
        const r = updated[i];
        try {
          await api.post("/payments/record", {
            admission_number: r.admission_number,
            amount: r.amount,
            payment_method: paymentMethod,
            reference_number: r.reference || null,
            notes: r.notes || "Bulk import",
            term_id: selectedTerm?.id || null,
            idempotency_key: `bulk-${Date.now()}-${i}-${r.admission_number}`,
          });
          updated[i] = { ...r, _status: "success" };
          success++;
        } catch (e: any) {
          updated[i] = { ...r, _status: "error", _message: e.message };
          failed++;
        }
        setRows([...updated]);
        setProgress(Math.round(((i + 1) / updated.length) * 100));
      }
      return { success, failed };
    },
    onSuccess: ({ success, failed }) => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["student-fees"] });
      if (failed === 0) toast.success(`Imported ${success} payments`);
      else toast.warning(`Imported ${success}, ${failed} failed`);
    },
  });

  const close = () => {
    onOpenChange(false);
    setTimeout(() => { setRows([]); setFileName(""); setProgress(0); }, 200);
  };

  const total = rows.reduce((s, r) => s + r.amount, 0);

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(v) : close())}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Bulk Payment Import
          </DialogTitle>
          <DialogDescription>
            Download the Excel template (with admission numbers pre-filled), enter amounts, then upload to record payments.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              {fileName || "Choose File"}
            </Button>

            <div className="ml-auto flex items-center gap-2">
              <Label className="text-sm">Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {rows.length > 0 && (
            <>
              <div className="flex items-center justify-between text-sm">
                <div className="flex gap-4">
                  <span>Rows: <strong>{rows.length}</strong></span>
                  <span>Total: <strong>KES {total.toLocaleString()}</strong></span>
                </div>
                {importMutation.isPending && (
                  <span className="text-muted-foreground">Importing… {progress}%</span>
                )}
              </div>
              <div className="border rounded-lg max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Admission</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{r.admission_number}</TableCell>
                        <TableCell>{r.student_name || "—"}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {r.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{r.reference || "—"}</TableCell>
                        <TableCell>
                          {r._status === "success" ? (
                            <Badge className="bg-success/10 text-success border-0 gap-1">
                              <CheckCircle2 className="h-3 w-3" /> OK
                            </Badge>
                          ) : r._status === "error" ? (
                            <Badge className="bg-destructive/10 text-destructive border-0 gap-1" title={r._message}>
                              <AlertTriangle className="h-3 w-3" /> Failed
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={close}>Close</Button>
          <Button
            onClick={() => importMutation.mutate()}
            disabled={!rows.length || importMutation.isPending}
          >
            {importMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importing…</>
            ) : (
              <>Import {rows.length || ""} Payments</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
