import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFeeAdjustments, useDecideFeeAdjustment } from "@/hooks/useFinance";
import { Check, X, ClipboardCheck } from "lucide-react";
import { PermissionGate } from "@/components/PermissionGate";

const formatKES = (n: number) => `KES ${Number(n || 0).toLocaleString()}`;

const FeeAdjustments = () => {
  const [tab, setTab] = useState("pending");
  const { data: rows = [], isLoading } = useFeeAdjustments(tab);
  const decide = useDecideFeeAdjustment();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleReject = () => {
    if (!rejectId || rejectReason.length < 5) return;
    decide.mutate(
      { id: rejectId, decision: "reject", rejected_reason: rejectReason },
      {
        onSuccess: () => {
          setRejectId(null);
          setRejectReason("");
        },
      },
    );
  };

  return (
    <DashboardLayout title="Fee Adjustments">
      <Card className="mb-4 border-info/30 bg-info/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-info" /> What is this page?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground leading-relaxed pb-4">
          When an accountant submits a fee adjustment (waiver, fine, credit, or
          balance correction) that exceeds the allowed self-approve limit, it is
          queued here for an administrator to <strong>approve</strong> or{" "}
          <strong>reject</strong>. Approved adjustments are applied to the
          student's fee record; rejected ones are returned with a reason. If
          this page is empty, there are no adjustments awaiting your action.
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" /> Adjustment
            Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
            <TabsContent value={tab} className="mt-4">
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : rows.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  No {tab} adjustments
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Previous</TableHead>
                      <TableHead>New</TableHead>
                      <TableHead>Reason</TableHead>
                      {tab === "pending" && <TableHead>Action</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {new Date(r.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-xs">
                          {r.student_name}
                          <div className="text-muted-foreground">
                            {r.admission_number}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {r.fee_name || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="capitalize text-xs"
                          >
                            {r.adjustment_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatKES(r.previous_amount)}
                        </TableCell>
                        <TableCell className="text-xs font-semibold">
                          {formatKES(r.new_amount)}
                        </TableCell>
                        <TableCell className="text-xs max-w-xs truncate">
                          {r.reason}
                        </TableCell>
                        {tab === "pending" && (
                          <TableCell>
                            <PermissionGate permission="finance:fees:waive">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    decide.mutate({
                                      id: r.id,
                                      decision: "approve",
                                    })
                                  }
                                  disabled={decide.isPending}
                                >
                                  <Check className="h-4 w-4 mr-1" /> Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setRejectId(r.id)}
                                >
                                  <X className="h-4 w-4 mr-1" /> Reject
                                </Button>
                              </div>
                            </PermissionGate>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={!!rejectId} onOpenChange={(o) => !o && setRejectId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Adjustment</DialogTitle>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejecting this adjustment"
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={rejectReason.length < 5 || decide.isPending}
              onClick={handleReject}
            >
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default FeeAdjustments;
