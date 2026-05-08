import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Bell, Send, Users, Search, MessageSquare, AlertTriangle, CheckCircle,
  Clock, Phone, Filter,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSchool } from "@/contexts/SchoolContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { motion } from "framer-motion";

const formatKES = (amount: number) => `KES ${Math.abs(amount).toLocaleString()}`;

interface StudentWithBalance {
  id: string;
  full_name: string;
  admission_number: string;
  parent_phone: string;
  parent_name: string;
  grade_name: string;
  total_balance: number;
  fee_count: number;
  overdue_count: number;
  selected?: boolean;
}

const DEFAULT_TEMPLATE = `Dear {parent_name}, this is a gentle reminder that your child {student_name} ({admission_no}) has an outstanding fee balance of {balance}. Kindly make the payment at your earliest convenience. Thank you. - {school_name}`;

const FeeReminders = () => {
  const { user } = useAuth();
  const { currentSchool } = useSchool();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentWithBalance[]>([]);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [balanceFilter, setBalanceFilter] = useState("all");
  const [grades, setGrades] = useState<{ id: string; name: string }[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Send dialog
  const [sendDialog, setSendDialog] = useState(false);
  const [messageTemplate, setMessageTemplate] = useState(DEFAULT_TEMPLATE);
  const [sending, setSending] = useState(false);
  const [sendMethod, setSendMethod] = useState<"sms" | "in_app">("sms");

  // Reminder history
  const [reminderHistory, setReminderHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const schoolId = currentSchool?.id;

  const fetchData = async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      // Grades from backend
      try {
        const g = await api.get<any>("/classes/grades");
        setGrades((g?.data || g || []).map((x: any) => ({ id: x.id, name: x.name })));
      } catch { /* ignore */ }

      // Students with balances from backend (already aggregated)
      const list = await api.get<any[]>("/finance/student-fees-list");
      const rows: StudentWithBalance[] = (list || [])
        .filter((s: any) => Number(s.balance || 0) > 0)
        .map((s: any) => ({
          id: s.id,
          full_name: s.full_name || `${s.first_name || ""} ${s.last_name || ""}`.trim(),
          admission_number: s.admission_number,
          parent_phone: s.parent_phone || "N/A",
          parent_name: s.parent_name || "Parent",
          grade_name: s.grade || "—",
          total_balance: Number(s.balance || 0),
          fee_count: Number(s.fee_count || 0),
          overdue_count: Number(s.overdue_count || 0),
        }))
        .sort((a, b) => b.total_balance - a.total_balance);
      setStudents(rows);
    } catch (err: any) {
      toast.error("Failed to load student balances");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    if (!schoolId) return;
    setHistoryLoading(true);
    try {
      // Backend SMS logs endpoint not yet wired; keep history empty silently.
      setReminderHistory([]);
    } catch {
      // silent
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => { fetchData(); fetchHistory(); }, [schoolId]);

  const filtered = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = !search ||
        s.full_name.toLowerCase().includes(search.toLowerCase()) ||
        s.admission_number.toLowerCase().includes(search.toLowerCase());
      const matchesGrade = gradeFilter === "all" || s.grade_name === gradeFilter;
      const matchesBalance = balanceFilter === "all" ||
        (balanceFilter === "overdue" && s.overdue_count > 0) ||
        (balanceFilter === "high" && s.total_balance >= 10000);
      return matchesSearch && matchesGrade && matchesBalance;
    });
  }, [students, search, gradeFilter, balanceFilter]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(s => s.id)));
    }
  };

  const selectedStudents = filtered.filter(s => selectedIds.has(s.id));

  const handleSendReminders = async () => {
    if (selectedStudents.length === 0) return;
    setSending(true);

    try {
      // For each selected student, generate and "send" the reminder
      const smsLogs = selectedStudents
        .filter(s => s.parent_phone !== "N/A")
        .map(s => {
          const message = messageTemplate
            .replace("{parent_name}", s.parent_name)
            .replace("{student_name}", s.full_name)
            .replace("{admission_no}", s.admission_number)
            .replace("{balance}", formatKES(s.total_balance))
            .replace("{school_name}", currentSchool?.name || "School");

          return {
            school_id: schoolId!,
            student_id: s.id,
            phone_number: s.parent_phone,
            message,
            status: "pending",
            triggered_by: user?.id || "system",
            reference_type: "fee_reminder",
          };
        });

      if (smsLogs.length > 0) {
        // Insert SMS logs — actual sending would be handled by an SMS provider integration
        const { error } = await supabase.from("sms_logs").insert(smsLogs);
        if (error) throw error;
      }

      toast.success(`${smsLogs.length} fee reminders queued for sending`);
      setSendDialog(false);
      setSelectedIds(new Set());
      fetchHistory();
    } catch (err: any) {
      toast.error(err.message || "Failed to send reminders");
    } finally {
      setSending(false);
    }
  };

  const totalOutstanding = filtered.reduce((s, st) => s + st.total_balance, 0);
  const overdueStudents = filtered.filter(s => s.overdue_count > 0).length;

  return (
    <DashboardLayout title="Fee Reminders" subtitle="Send fee payment reminders to parents">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card><CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
            <div><p className="text-sm text-muted-foreground">Total Outstanding</p><p className="text-2xl font-bold text-foreground">{formatKES(totalOutstanding)}</p></div>
          </CardContent></Card>
          <Card><CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10"><Users className="h-5 w-5 text-warning" /></div>
            <div><p className="text-sm text-muted-foreground">Students with Balance</p><p className="text-2xl font-bold text-foreground">{filtered.length}</p></div>
          </CardContent></Card>
          <Card><CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10"><Clock className="h-5 w-5 text-destructive" /></div>
            <div><p className="text-sm text-muted-foreground">Overdue</p><p className="text-2xl font-bold text-foreground">{overdueStudents}</p></div>
          </CardContent></Card>
          <Card><CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><CheckCircle className="h-5 w-5 text-primary" /></div>
            <div><p className="text-sm text-muted-foreground">Selected</p><p className="text-2xl font-bold text-foreground">{selectedIds.size}</p></div>
          </CardContent></Card>
        </div>

        {/* Filters & Actions */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />Students with Outstanding Fees
              </CardTitle>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search student..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                  <SelectTrigger className="w-32 h-9"><SelectValue placeholder="Grade" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {grades.map(g => <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={balanceFilter} onValueChange={setBalanceFilter}>
                  <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Balances</SelectItem>
                    <SelectItem value="overdue">Overdue Only</SelectItem>
                    <SelectItem value="high">High Balance (10K+)</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  disabled={selectedIds.size === 0}
                  onClick={() => setSendDialog(true)}
                >
                  <Send className="h-3.5 w-3.5 mr-1" />
                  Send Reminder ({selectedIds.size})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={filtered.length > 0 && selectedIds.size === filtered.length}
                        onCheckedChange={selectAll}
                      />
                    </TableHead>
                    <TableHead className="font-semibold text-xs">Student</TableHead>
                    <TableHead className="font-semibold text-xs">Grade</TableHead>
                    <TableHead className="font-semibold text-xs">Parent Phone</TableHead>
                    <TableHead className="font-semibold text-xs text-right">Balance</TableHead>
                    <TableHead className="font-semibold text-xs text-center">Fees</TableHead>
                    <TableHead className="font-semibold text-xs text-center">Overdue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Loading...</TableCell></TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />No students with outstanding balances
                    </TableCell></TableRow>
                  ) : filtered.map(s => (
                    <TableRow key={s.id} className="cursor-pointer hover:bg-muted/30" onClick={() => toggleSelect(s.id)}>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <Checkbox checked={selectedIds.has(s.id)} onCheckedChange={() => toggleSelect(s.id)} />
                      </TableCell>
                      <TableCell>
                        <div><p className="font-medium text-foreground">{s.full_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{s.admission_number}</p></div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{s.grade_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{s.parent_phone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-destructive">{formatKES(s.total_balance)}</TableCell>
                      <TableCell className="text-center"><Badge variant="secondary">{s.fee_count}</Badge></TableCell>
                      <TableCell className="text-center">
                        {s.overdue_count > 0
                          ? <Badge className="bg-destructive/10 text-destructive border-0">{s.overdue_count}</Badge>
                          : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Reminder History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />Reminder History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold text-xs">Phone</TableHead>
                  <TableHead className="font-semibold text-xs">Message</TableHead>
                  <TableHead className="font-semibold text-xs">Status</TableHead>
                  <TableHead className="font-semibold text-xs">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : reminderHistory.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No reminders sent yet</TableCell></TableRow>
                ) : reminderHistory.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-sm">{r.phone_number}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{r.message}</TableCell>
                    <TableCell>
                      <Badge className={
                        r.status === "sent" || r.status === "delivered" ? "bg-success/10 text-success border-0" :
                        r.status === "failed" ? "bg-destructive/10 text-destructive border-0" :
                        "bg-warning/10 text-warning border-0"
                      }>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Send Reminder Dialog */}
      <Dialog open={sendDialog} onOpenChange={setSendDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Send Fee Reminders
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Selected Students</span>
                <span className="font-semibold">{selectedStudents.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">With Valid Phone</span>
                <span className="font-semibold">{selectedStudents.filter(s => s.parent_phone !== "N/A").length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Balance</span>
                <span className="font-bold text-destructive">{formatKES(selectedStudents.reduce((s, st) => s + st.total_balance, 0))}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Message Template</Label>
              <Textarea
                value={messageTemplate}
                onChange={e => setMessageTemplate(e.target.value)}
                rows={5}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Variables: {"{parent_name}"}, {"{student_name}"}, {"{admission_no}"}, {"{balance}"}, {"{school_name}"}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-warning/5 border border-warning/20 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                SMS messages will be queued for delivery. Actual sending requires an SMS provider (e.g., Africa's Talking) to be configured.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialog(false)}>Cancel</Button>
            <Button onClick={handleSendReminders} disabled={sending || selectedStudents.length === 0}>
              {sending ? "Sending..." : `Send ${selectedStudents.filter(s => s.parent_phone !== "N/A").length} Reminders`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default FeeReminders;
