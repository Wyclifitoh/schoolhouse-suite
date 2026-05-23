import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useExams } from "@/hooks/useExams";
import { useExamLifecycle, useExamAudit } from "@/hooks/useExamsExtended";
import { CheckCircle2, ShieldCheck, Lock, RefreshCw, Archive, FileClock } from "lucide-react";

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SUBMITTED: "bg-info/10 text-info",
  REVIEWED: "bg-warning/10 text-warning",
  APPROVED: "bg-success/10 text-success",
  LOCKED: "bg-destructive/10 text-destructive",
  ARCHIVED: "bg-muted text-muted-foreground",
};

export default function ExamReview() {
  const { data: exams = [], isLoading } = useExams();
  const lc = useExamLifecycle();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const { data: audit = [] } = useExamAudit(selectedId || undefined);

  const run = (action: keyof typeof lc, id: string) =>
    (lc[action] as any).mutate({ id, reason: reason || undefined });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" /> Exam Review & Approval
          </h1>
          <p className="text-muted-foreground">HOD review, academic approval, lock and reopen workflow.</p>
        </div>

        <Card>
          <CardHeader><CardTitle>Exams</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-3">
              <Input placeholder="Optional reason for lifecycle action" value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(exams as any[]).map((e) => (
                  <TableRow key={e.id} className={selectedId === e.id ? "bg-muted/30" : ""} onClick={() => setSelectedId(e.id)}>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell>{e.type}</TableCell>
                    <TableCell>{e.term || "—"}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLOR[e.status] || ""}>{e.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      {e.status === "SUBMITTED" && (
                        <Button size="sm" variant="outline" onClick={() => run("review", e.id)}>
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Review
                        </Button>
                      )}
                      {e.status === "REVIEWED" && (
                        <Button size="sm" onClick={() => run("approve", e.id)}>
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
                        </Button>
                      )}
                      {e.status === "APPROVED" && (
                        <Button size="sm" variant="destructive" onClick={() => run("lock", e.id)}>
                          <Lock className="h-3 w-3 mr-1" /> Lock
                        </Button>
                      )}
                      {(e.status === "LOCKED" || e.status === "APPROVED" || e.status === "SUBMITTED" || e.status === "REVIEWED") && (
                        <Button size="sm" variant="ghost" onClick={() => run("reopen", e.id)}>
                          <RefreshCw className="h-3 w-3 mr-1" /> Reopen
                        </Button>
                      )}
                      {(e.status === "APPROVED" || e.status === "LOCKED") && (
                        <Button size="sm" variant="ghost" onClick={() => run("archive", e.id)}>
                          <Archive className="h-3 w-3 mr-1" /> Archive
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!exams.length && !isLoading && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No exams.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {selectedId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileClock className="h-5 w-5" /> Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(audit as any[]).map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-xs">{new Date(a.at).toLocaleString()}</TableCell>
                      <TableCell><Badge variant="outline">{a.action}</Badge></TableCell>
                      <TableCell className="text-xs">{a.actor_role}</TableCell>
                      <TableCell className="text-xs">{a.reason || "—"}</TableCell>
                      <TableCell className="text-xs font-mono">
                        {a.old_value || "∅"} → {a.new_value || "∅"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!audit.length && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No audit entries.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
