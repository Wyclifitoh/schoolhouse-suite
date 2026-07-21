import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LogIn, LogOut, Clock } from "lucide-react";
import { toast } from "sonner";

const REASONS = [
  "End of day",
  "Left early — personal",
  "Sick",
  "Official duty",
  "Meeting off-site",
  "Family emergency",
  "Other",
];

export function ClockInOutCard() {
  const qc = useQueryClient();
  const [confirmIn, setConfirmIn] = useState(false);
  const [outOpen, setOutOpen] = useState(false);
  const [reason, setReason] = useState("End of day");
  const [customReason, setCustomReason] = useState("");

  const { data, isLoading } = useQuery<{
    linked: boolean;
    status?: "out" | "in" | "clocked_out";
    today?: any;
    name?: string;
  }>({
    queryKey: ["staff-attendance", "self-status"],
    queryFn: () => api.get("/staff-attendance/self/status"),
    refetchInterval: 60_000,
  });

  const clockIn = useMutation({
    mutationFn: () => api.post("/staff-attendance/self/clock-in", {}),
    onSuccess: () => {
      toast.success("Clocked in");
      qc.invalidateQueries({ queryKey: ["staff-attendance"] });
      setConfirmIn(false);
    },
    onError: (e: any) => toast.error(e.message || "Failed to clock in"),
  });

  const clockOut = useMutation({
    mutationFn: (r: string) =>
      api.post("/staff-attendance/self/clock-out", { reason: r }),
    onSuccess: () => {
      toast.success("Clocked out");
      qc.invalidateQueries({ queryKey: ["staff-attendance"] });
      setOutOpen(false);
      setReason("End of day");
      setCustomReason("");
    },
    onError: (e: any) => toast.error(e.message || "Failed to clock out"),
  });

  if (isLoading || !data?.linked) return null;

  const status = data.status;
  const today = data.today;

  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">My Attendance</p>
            <p className="text-xs text-muted-foreground">
              {status === "out" && "Not yet clocked in today"}
              {status === "in" &&
                `Clocked in at ${(today?.check_in || "").slice(0, 5)}`}
              {status === "clocked_out" &&
                `Done for today (${(today?.check_in || "").slice(0, 5)} – ${(today?.check_out || "").slice(0, 5)})`}
            </p>
          </div>
          {status === "in" && (
            <Badge className="bg-success/10 text-success border-0">Active</Badge>
          )}
          {status === "clocked_out" && (
            <Badge variant="secondary">Completed</Badge>
          )}
        </div>
        <div className="flex gap-2">
          {status === "out" && (
            <Button size="sm" onClick={() => setConfirmIn(true)}>
              <LogIn className="h-4 w-4 mr-1.5" /> Clock In
            </Button>
          )}
          {status === "in" && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setOutOpen(true)}
            >
              <LogOut className="h-4 w-4 mr-1.5" /> Clock Out
            </Button>
          )}
        </div>

        {/* Clock-in confirmation */}
        <Dialog open={confirmIn} onOpenChange={setConfirmIn}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Clock in now?</DialogTitle>
              <DialogDescription>
                This will record your check-in time for today.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmIn(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => clockIn.mutate()}
                disabled={clockIn.isPending}
              >
                {clockIn.isPending ? "Recording…" : "Yes, clock me in"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Clock-out with reason */}
        <Dialog open={outOpen} onOpenChange={setOutOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Clock out</DialogTitle>
              <DialogDescription>
                Please select a reason. Your reason will be visible to
                administrators.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Reason</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REASONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {reason === "Other" && (
                <div>
                  <Label className="text-xs">Please specify</Label>
                  <Textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    rows={2}
                    placeholder="Explain briefly…"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOutOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const r =
                    reason === "Other" ? customReason.trim() : reason;
                  if (!r) {
                    toast.error("Please enter a reason");
                    return;
                  }
                  clockOut.mutate(r);
                }}
                disabled={clockOut.isPending}
              >
                {clockOut.isPending ? "Recording…" : "Confirm clock out"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}