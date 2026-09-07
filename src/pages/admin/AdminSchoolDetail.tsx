import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  ArrowLeft,
  ShieldX,
  ShieldCheck,
  Calendar,
  Receipt,
  Check,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useSchoolDetail,
  useExtendTrial,
  useTerminateTrial,
  useSetSubStatus,
  useSetSchoolActive,
  useActivateSubscription,
  useCreateInvoice,
  useConfirmInvoice,
  useVoidInvoice,
  usePlatformPlans,
} from "@/hooks/usePlatform";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

export default function AdminSchoolDetail() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const { data, isLoading } = useSchoolDetail(id);
  const { data: plans = [] } = usePlatformPlans();

  const extend = useExtendTrial();
  const terminate = useTerminateTrial();
  const setStatus = useSetSubStatus();
  const setActive = useSetSchoolActive();

  const [extendDays, setExtendDays] = useState("7");

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  if (!data) return <div className="p-6">School not found</div>;

  const { school, subscription, invoices, users, counts } = data;

  const guard = async (label: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
      toast({ title: label });
    } catch (e: any) {
      toast({
        title: "Failed",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => nav("/admin/schools")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to schools
        </Button>
        <h1 className="text-3xl font-black mt-2">{school.name}</h1>
        <p className="text-muted-foreground">
          {school.email || "—"} · {school.phone || "—"} ·{" "}
          {school.curriculum_type}
        </p>
      </div>

      {/* Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active students", v: counts.active_students },
          { label: "Total students", v: counts.total_students },
          { label: "Staff", v: counts.staff_count },
          { label: "Parents", v: counts.parent_count },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <div className="text-[11px] uppercase font-semibold text-muted-foreground">
                {k.label}
              </div>
              <div className="text-2xl font-black">
                {Number(k.v).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subscription */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold">Subscription</h3>
              <p className="text-sm text-muted-foreground">
                <Badge variant="outline">
                  {school.subscription_status || "no sub"}
                </Badge>
              </p>
              <div className="text-xs text-muted-foreground mt-1">
                {school.trial_ends_at && (
                  <>
                    Trial ends{" "}
                    {new Date(school.trial_ends_at).toLocaleDateString()}{" "}
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {school.is_active ? (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    guard("School suspended", () =>
                      setActive.mutateAsync({ id, active: false }),
                    )
                  }
                >
                  <ShieldX className="h-3 w-3 mr-1" /> Suspend
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() =>
                    guard("School reactivated", () =>
                      setActive.mutateAsync({ id, active: true }),
                    )
                  }
                >
                  <ShieldCheck className="h-3 w-3 mr-1" /> Reactivate
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  guard("Marked active", () =>
                    setStatus.mutateAsync({ id, status: "active" }),
                  )
                }
              >
                Set active
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  guard("Marked inactive", () =>
                    setStatus.mutateAsync({ id, status: "inactive" }),
                  )
                }
              >
                Set inactive
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Extend / terminate trial */}
            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Trial controls
              </h4>
              <div className="flex gap-2">
                <Select value={extendDays} onValueChange={setExtendDays}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[7, 14, 30, 60, 90].map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        +{d} days
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={() =>
                    guard("Trial extended", () =>
                      extend.mutateAsync({ id, days: Number(extendDays) }),
                    )
                  }
                >
                  Extend trial
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (confirm("Terminate trial now? School will be locked."))
                      guard("Trial terminated", () =>
                        terminate.mutateAsync(id),
                      );
                  }}
                >
                  Terminate
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Assessment Billing */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">Assessment Billing</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground border-b">
                <tr>
                  <th className="p-2">Date</th>
                  <th className="p-2">Assessment ID</th>
                  <th className="p-2">Students</th>
                  <th className="p-2">Amount</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-4 text-center text-muted-foreground"
                    >
                      No billing records yet.
                    </td>
                  </tr>
                )}
                {invoices.map((i: any) => (
                  <tr key={i.id} className="border-b">
                    <td className="p-2">
                      {new Date(i.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-2 text-xs text-muted-foreground">{i.assessment_id}</td>
                    <td className="p-2 text-xs">{i.student_count}</td>
                    <td className="p-2 font-semibold">
                      KSh {Number(i.total_amount).toLocaleString()}
                    </td>
                    <td className="p-2">
                      <Badge
                        variant={
                          i.status === "paid"
                            ? "default"
                            : i.status === "pending"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {i.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* School users */}
      <Card>
        <CardContent className="p-5">
          <h3 className="font-bold mb-3">School users ({users.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground border-b">
                <tr>
                  <th className="p-2">Name</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Roles</th>
                  <th className="p-2">Last login</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id} className="border-b">
                    <td className="p-2 font-medium">{u.full_name}</td>
                    <td className="p-2">{u.email}</td>
                    <td className="p-2 text-xs">{u.roles || "—"}</td>
                    <td className="p-2 text-xs">
                      {u.last_login_at
                        ? new Date(u.last_login_at).toLocaleString()
                        : "never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
