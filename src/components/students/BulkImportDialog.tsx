import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Download,
  FileText,
  CheckCircle,
  AlertTriangle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useGrades, useStreams } from "@/hooks/useGrades";

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "students" | "staff";
}

const STUDENT_CSV_HEADERS =
  "full_name,admission_no,gender,dob,grade,stream,parent_name,parent_phone,parent_email,category";
const STAFF_CSV_HEADERS =
  "full_name,employee_id,email,phone,department,designation,date_of_joining";

export function BulkImportDialog({
  open,
  onOpenChange,
  type,
}: BulkImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [allRows, setAllRows] = useState<Record<string, string>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [gradeId, setGradeId] = useState("");
  const [streamId, setStreamId] = useState("");
  const { data: grades = [], isLoading: gradesLoading } = useGrades();
  const { data: streams = [], isLoading: streamsLoading } = useStreams(
    gradeId || undefined,
  );
  const selectedGrade = grades.find((g) => g.id === gradeId);
  const selectedStream = streams.find((s) => s.id === streamId);

  const headers = type === "students" ? STUDENT_CSV_HEADERS : STAFF_CSV_HEADERS;

  const importMutation = useMutation({
    mutationFn: (students: Record<string, string>[]) =>
      api.post<any>("/students/bulk-import", { students }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      const created = result?.created?.length ?? 0;
      const failed = result?.failed?.length ?? 0;
      toast.success(
        `${created} students imported${failed ? `, ${failed} failed` : ""}`,
      );
      onOpenChange(false);
      setFile(null);
      setPreviewData([]);
      setAllRows([]);
      setErrors([]);
    },
    onError: (error: Error) => toast.error(error.message || "Import failed"),
  });

  const parseCsvLine = (line: string) => {
    const cells: string[] = [];
    let current = "";
    let quoted = false;
    for (const char of line) {
      if (char === '"') quoted = !quoted;
      else if (char === "," && !quoted) {
        cells.push(current.trim());
        current = "";
      } else current += char;
    }
    cells.push(current.trim());
    return cells;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }
    setFile(selected);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      const fileHeaders = parseCsvLine(lines[0] || headers).map((h) =>
        h.trim(),
      );
      const rows = lines.slice(1).map((l) => parseCsvLine(l));
      const mappedRows = rows.map((row) =>
        Object.fromEntries(fileHeaders.map((h, i) => [h, row[i] || ""])),
      );
      setPreviewData(rows.slice(0, 10));
      setAllRows(mappedRows);

      const errs: string[] = [];
      rows.forEach((row, i) => {
        if (!row[0]) errs.push(`Row ${i + 2}: Missing name`);
        if (type === "students" && !row[1])
          errs.push(`Row ${i + 2}: Missing admission number`);
      });
      setErrors(errs);
    };
    reader.readAsText(selected);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([headers + "\n"], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}-import-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  };

  const handleImport = () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }
    if (type === "students" && (!gradeId || !streamId)) {
      toast.error("Please select grade and stream");
      return;
    }
    if (errors.length > 0) {
      toast.error("Please fix errors before importing");
      return;
    }
    if (type !== "students") {
      toast.error("Staff import backend endpoint is not available yet");
      return;
    }

    importMutation.mutate(
      allRows.map((row) => ({
        ...row,
        grade: row.grade || selectedGrade?.name || "",
        stream: row.stream || selectedStream?.name || "",
        grade_id: gradeId,
        stream_id: streamId,
      })),
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Bulk Import {type === "students" ? "Students" : "Staff"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {type === "students" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Class / Grade *</Label>
                <Select
                  value={gradeId}
                  onValueChange={(v) => {
                    setGradeId(v);
                    setStreamId("");
                  }}
                  disabled={gradesLoading}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue
                      placeholder={
                        gradesLoading ? "Loading..." : "Select Class"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                    {grades.length === 0 && !gradesLoading && (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">
                        No classes found
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Stream *</Label>
                <Select
                  value={streamId}
                  onValueChange={setStreamId}
                  disabled={!gradeId || streamsLoading}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue
                      placeholder={
                        !gradeId
                          ? "Select class first"
                          : streamsLoading
                            ? "Loading..."
                            : "Select Stream"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {streams.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                    {gradeId && streams.length === 0 && !streamsLoading && (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">
                        No streams in this class
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
            >
              <Download className="h-4 w-4 mr-1.5" />
              Download Template
            </Button>
            <div className="text-xs text-muted-foreground">
              Download and fill the CSV template, then upload below
            </div>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileSelect}
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {previewData.length} records found
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setPreviewData([]);
                    setErrors([]);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click to upload CSV file
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum 500 records per upload
                </p>
              </>
            )}
          </div>

          {errors.length > 0 && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-1">
              <p className="text-xs font-semibold text-destructive flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                {errors.length} error(s) found
              </p>
              {errors.slice(0, 5).map((err, i) => (
                <p key={i} className="text-xs text-destructive/80">
                  {err}
                </p>
              ))}
              {errors.length > 5 && (
                <p className="text-xs text-destructive/60">
                  ...and {errors.length - 5} more
                </p>
              )}
            </div>
          )}

          {previewData.length > 0 && errors.length === 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground">
                Preview (first 10 rows)
              </p>
              <div className="rounded-md border overflow-auto max-h-48">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      {headers.split(",").map((h) => (
                        <TableHead
                          key={h}
                          className="text-xs whitespace-nowrap"
                        >
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((row, i) => (
                      <TableRow key={i}>
                        {row.map((cell, j) => (
                          <TableCell key={j} className="text-xs py-1.5">
                            {cell}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || errors.length > 0 || importMutation.isPending}
          >
            <CheckCircle className="h-4 w-4 mr-1.5" />
            {importMutation.isPending
              ? "Importing..."
              : `Import ${allRows.length} ${type}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
