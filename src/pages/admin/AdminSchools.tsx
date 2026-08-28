import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Search,
  ArrowRight,
  Building2,
  GraduationCap,
  Banknote,
  LogIn,
  Trash2,
} from "lucide-react";
import {
  useSchools,
  useImpersonateSchool,
  useDeleteSchool,
} from "@/hooks/usePlatform";
import { beginImpersonation } from "@/lib/impersonation";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input as UiInput } from "@/components/ui/input";

type StatusKey = "" | "trial" | "active" | "past_due" | "locked" | "cancelled";

const STATUS_TABS: { key: StatusKey; label: string }[] = [
  { key: "", label: "All" },
  { key: "active", label: "Active" },
  { key: "trial", label: "Trial" },
  { key: "past_due", label: "Past due" },
  { key: "locked", label: "Locked" },
  { key: "cancelled", label: "Cancelled" },
];

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  trial: "bg-primary/10 text-primary border-primary/20",
  past_due: "bg-amber-100 text-amber-700 border-amber-200",
  locked: "bg-rose-100 text-rose-700 border-rose-200",
  cancelled: "bg-slate-200 text-slate-600 border-slate-200",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function AdminSchools() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusKey>("");
  const { data: schools = [], isLoading } = useSchools({ search, status });
  const impersonate = useImpersonateSchool();
  const deleteSchool = useDeleteSchool();
  const navigate = useNavigate();
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [confirmText, setConfirmText] = useState("");

  const handleImpersonate = async (schoolId: string, schoolName: string) => {
    try {
      const res = await impersonate.mutateAsync(schoolId);
      beginImpersonation({
        token: res.token,
        schoolId: res.school.id,
        schoolName: res.school.name,
        userId: res.user.id,
        userEmail: res.user.email,
        expiresInSec: res.expires_in,
      });
      toast({
        title: "Impersonation started",
        description: `You are now signed in as ${res.user.email} at ${schoolName}.`,
      });
      navigate("/dashboard");
      setTimeout(() => window.location.reload(), 50);
    } catch (e: any) {
      toast({
        title: "Impersonation failed",
        description: e?.message || "Could not open school session",
        variant: "destructive",
      });
    }
  };

  const totals = useMemo(
    () => ({
      students: schools.reduce((a, s) => a + Number(s.active_students || 0), 0),
      staff: schools.reduce((a, s) => a + Number(s.staff_count || 0), 0),
      revenue: schools.reduce((a, s) => a + Number(s.lifetime_paid || 0), 0),
    }),
    [schools],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-widest font-bold text-primary">
            Tenants
          </div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight mt-1">
            Schools
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage every school on CHUO — subscriptions, users and revenue.
          </p>
        </div>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: Building2,
            label: "Schools shown",
            value: schools.length.toLocaleString(),
          },
          {
            icon: GraduationCap,
            label: "Active students",
            value: totals.students.toLocaleString(),
          },
          {
            icon: Banknote,
            label: "Lifetime revenue",
            value: `KSh ${totals.revenue.toLocaleString()}`,
          },
        ].map((k) => (
          <Card key={k.label} className="shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <k.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                  {k.label}
                </div>
                <div className="text-2xl font-black tracking-tight">
                  {k.value}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4 flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, code…"
              className="pl-9 h-10 bg-muted/30 border-transparent focus-visible:bg-white"
            />
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {STATUS_TABS.map((t) => (
              <button
                key={t.key || "all"}
                onClick={() => setStatus(t.key)}
                className={cn(
                  "px-3 h-9 rounded-lg text-xs font-semibold transition",
                  status === t.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b bg-muted/40">
                <tr>
                  <th className="p-3 pl-5 font-bold">School</th>
                  <th className="p-3 font-bold">Plan</th>
                  <th className="p-3 font-bold">Status</th>
                  <th className="p-3 text-right font-bold">Students</th>
                  <th className="p-3 text-right font-bold">Staff</th>
                  <th className="p-3 text-right font-bold">Paid lifetime</th>
                  <th className="p-3 font-bold">Trial / Renews</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {schools.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-10 text-center text-muted-foreground"
                    >
                      No schools match the filters.
                    </td>
                  </tr>
                )}
                {schools.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b last:border-0 hover:bg-muted/40 transition"
                  >
                    <td className="p-3 pl-5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/80 to-primary text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                          {initials(s.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{s.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {s.email || s.code || "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm font-medium">
                        {s.plan_name || "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {s.billing_mode || ""} {s.cycle ? `· ${s.cycle}` : ""}
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border",
                          STATUS_STYLES[s.sub_status || ""] ||
                            "bg-slate-100 text-slate-600 border-slate-200",
                        )}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {(s.sub_status || "no sub").replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-3 text-right font-semibold">
                      {Number(s.active_students).toLocaleString()}
                    </td>
                    <td className="p-3 text-right">
                      {Number(s.staff_count).toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-semibold">
                      KSh {Number(s.lifetime_paid).toLocaleString()}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {s.sub_status === "trial" && s.trial_ends_at && (
                        <>
                          Trial ends{" "}
                          {new Date(s.trial_ends_at).toLocaleDateString()}
                        </>
                      )}
                      {s.sub_status === "active" && s.current_period_end && (
                        <>
                          Renews{" "}
                          {new Date(s.current_period_end).toLocaleDateString()}
                        </>
                      )}
                    </td>
                    <td className="p-3 pr-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleImpersonate(s.id, s.name)}
                          disabled={impersonate.isPending}
                          title="Sign in to this school as a school admin"
                        >
                          <LogIn className="h-3 w-3 mr-1" />
                          Login as
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/admin/schools/${s.id}`}>
                            Manage <ArrowRight className="h-3 w-3 ml-1" />
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => {
                            setPendingDelete({ id: s.id, name: s.name });
                            setConfirmText("");
                          }}
                          title="Permanently delete this school and all its data"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null);
            setConfirmText("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Delete {pendingDelete?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the school and{" "}
              <b>every related record</b> — users, students, staff, fees,
              payments, attendance, exams, communications. This action cannot be
              undone.
              <br />
              <br />
              Type <b>{pendingDelete?.name}</b> to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <UiInput
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type school name…"
            autoFocus
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={
                deleteSchool.isPending ||
                !pendingDelete ||
                confirmText.trim() !== pendingDelete.name
              }
              onClick={async (e) => {
                e.preventDefault();
                if (!pendingDelete) return;
                try {
                  await deleteSchool.mutateAsync(pendingDelete.id);
                  toast({
                    title: "School deleted",
                    description: `${pendingDelete.name} and all related data have been removed.`,
                  });
                  setPendingDelete(null);
                  setConfirmText("");
                } catch (err: any) {
                  toast({
                    title: "Delete failed",
                    description: err?.message || "Could not delete school",
                    variant: "destructive",
                  });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSchool.isPending && (
                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
              )}
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
