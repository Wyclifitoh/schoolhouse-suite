import { useMemo, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Search, ArrowRight, Plus, Building2, Users, GraduationCap, AlertCircle, Upload, X, ImageIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useSchools, useCreateSchool } from "@/hooks/usePlatform";
import { toast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default", trial: "secondary", past_due: "outline", locked: "destructive", cancelled: "destructive",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active", trial: "Trial", past_due: "Past Due", locked: "Locked", cancelled: "Cancelled",
};

const CURRICULUM = ["CBC", "8-4-4", "IGCSE", "IB"];

const empty = { name: "", email: "", phone: "", address: "", curriculum_type: "CBC", code: "", trial_days: "30", admin_name: "", admin_email: "", admin_password: "" };

export default function AdminSchools() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(empty);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const { data: schools = [], isLoading } = useSchools({ search, status });
  const create = useCreateSchool();

  const totals = useMemo(() => ({
    schools: schools.length,
    students: schools.reduce((a, s) => a + Number(s.active_students || 0), 0),
    staff: schools.reduce((a, s) => a + Number(s.staff_count || 0), 0),
    revenue: schools.reduce((a, s) => a + Number(s.lifetime_paid || 0), 0),
  }), [schools]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await create.mutateAsync({
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        curriculum_type: form.curriculum_type || "CBC",
        code: form.code || undefined,
        trial_days: Number(form.trial_days) || 30,
        admin_name: form.admin_name || undefined,
        admin_email: form.admin_email || undefined,
        admin_password: form.admin_password || undefined,
        logo_base64: logoPreview || undefined,
      });
      toast({ title: "School created", description: `${form.name} is on a ${form.trial_days}-day trial.` });
      setShowCreate(false);
      setForm(empty);
      setLogoPreview(null);
    } catch (err: any) {
      toast({ title: "Failed to create school", description: err.message, variant: "destructive" });
    }
  };

  const handleLogoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      toast({ title: "File too large", description: "Logo must be under 500 KB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const trialEnding = schools.filter(s => {
    if (s.sub_status !== "trial" || !s.trial_ends_at) return false;
    const days = Math.ceil((new Date(s.trial_ends_at).getTime() - Date.now()) / 86400000);
    return days <= 7;
  });

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black">Schools</h1>
          <p className="text-muted-foreground mt-1">
            {totals.schools} schools · {totals.students.toLocaleString()} active students · KSh {totals.revenue.toLocaleString()} collected
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New school
        </Button>
      </div>

      {/* Trial ending alert */}
      {trialEnding.length > 0 && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-300">
                {trialEnding.length} school{trialEnding.length > 1 ? "s" : ""} trial ending within 7 days
              </p>
              <div className="flex flex-wrap gap-2 mt-1">
                {trialEnding.map(s => (
                  <Link key={s.id} to={`/admin/schools/${s.id}`} className="text-sm underline text-amber-700 dark:text-amber-400">
                    {s.name} (ends {s.trial_ends_at ? new Date(s.trial_ends_at).toLocaleDateString() : "—"})
                  </Link>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total schools", value: totals.schools, icon: Building2 },
          { label: "Active students", value: totals.students.toLocaleString(), icon: GraduationCap },
          { label: "Total staff", value: totals.staff.toLocaleString(), icon: Users },
          { label: "Lifetime revenue", value: `KSh ${totals.revenue.toLocaleString()}`, icon: null },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <p className="text-[11px] uppercase font-bold text-muted-foreground">{k.label}</p>
              <p className="text-2xl font-black mt-1">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, code…" className="pl-9" />
          </div>
          <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
            <SelectTrigger className="sm:w-48"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="past_due">Past due</SelectItem>
              <SelectItem value="locked">Locked</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground border-b bg-muted/30">
                <tr>
                  <th className="p-3">School</th>
                  <th className="p-3">Plan / Status</th>
                  <th className="p-3 text-right">Students</th>
                  <th className="p-3 text-right">Staff</th>
                  <th className="p-3 text-right">Paid (lifetime)</th>
                  <th className="p-3">Trial / Renews</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {schools.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No schools match the filters.</td></tr>
                )}
                {schools.map((s) => {
                  const daysLeft = s.trial_ends_at
                    ? Math.ceil((new Date(s.trial_ends_at).getTime() - Date.now()) / 86400000)
                    : null;
                  return (
                    <tr key={s.id} className="border-b hover:bg-muted/40 transition-colors">
                      <td className="p-3">
                        <div className="font-semibold">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.email || s.code || "—"}</div>
                        {!s.is_active && <Badge variant="destructive" className="mt-1 text-[10px]">Suspended</Badge>}
                      </td>
                      <td className="p-3">
                        <Badge variant={STATUS_COLORS[s.sub_status || ""] || "outline"}>
                          {STATUS_LABELS[s.sub_status || ""] || s.sub_status || "No sub"}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {s.plan_name || (s.sub_status === "trial" ? "Trial (no plan)" : "—")}
                        </div>
                      </td>
                      <td className="p-3 text-right font-semibold">{Number(s.active_students).toLocaleString()}</td>
                      <td className="p-3 text-right">{Number(s.staff_count).toLocaleString()}</td>
                      <td className="p-3 text-right font-semibold">KSh {Number(s.lifetime_paid || 0).toLocaleString()}</td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {s.sub_status === "trial" && s.trial_ends_at && (
                          <span className={daysLeft !== null && daysLeft <= 7 ? "text-amber-600 font-semibold" : ""}>
                            {daysLeft !== null && daysLeft < 0
                              ? <span className="text-destructive">Expired {Math.abs(daysLeft)}d ago</span>
                              : <>Trial ends {new Date(s.trial_ends_at).toLocaleDateString()} ({daysLeft}d left)</>
                            }
                          </span>
                        )}
                        {s.sub_status === "active" && s.current_period_end && <>Renews {new Date(s.current_period_end).toLocaleDateString()}</>}
                      </td>
                      <td className="p-3 text-right">
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/admin/schools/${s.id}`}>Manage <ArrowRight className="h-3 w-3 ml-1" /></Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Create school dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Create new school
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Logo upload field */}
              <div className="col-span-2">
                <Label>School Logo <span className="text-muted-foreground text-xs">(optional · max 500 KB)</span></Label>
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="h-16 w-16 rounded-lg border-2 border-dashed border-border bg-muted/40 flex items-center justify-center overflow-hidden shrink-0">
                    {logoPreview
                      ? <img src={logoPreview} alt="Preview" className="h-full w-full object-contain p-0.5" />
                      : <ImageIcon className="h-6 w-6 text-muted-foreground/40" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>
                      <Upload className="h-3.5 w-3.5 mr-1.5" /> Choose logo
                    </Button>
                    {logoPreview && (
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => { setLogoPreview(null); if (logoInputRef.current) logoInputRef.current.value = ""; }}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                    className="hidden" onChange={handleLogoSelect} />
                </div>
              </div>

              <div className="col-span-2">
                <Label htmlFor="school-name">School name <span className="text-destructive">*</span></Label>
                <Input id="school-name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Greenfield Academy" />
              </div>
              <div>
                <Label htmlFor="school-code">School code</Label>
                <Input id="school-code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g. GFA001" />
              </div>
              <div>
                <Label htmlFor="school-curriculum">Curriculum</Label>
                <Select value={form.curriculum_type} onValueChange={v => setForm({ ...form, curriculum_type: v })}>
                  <SelectTrigger id="school-curriculum"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRICULUM.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="school-email">Email</Label>
                <Input id="school-email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="principal@school.ac.ke" />
              </div>
              <div>
                <Label htmlFor="school-phone">Phone</Label>
                <Input id="school-phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+254 7XX XXX XXX" />
              </div>
              <div className="col-span-2">
                <Label htmlFor="school-address">Address</Label>
                <Input id="school-address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Nairobi, Kenya" />
              </div>
              <div className="col-span-2">
                <Label htmlFor="school-trial">Trial period (days)</Label>
                <Select value={form.trial_days} onValueChange={v => setForm({ ...form, trial_days: v })}>
                  <SelectTrigger id="school-trial"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[7, 14, 30, 60, 90].map(d => <SelectItem key={d} value={String(d)}>{d} days</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  After the trial, the school is charged KSh 10 per active student per assessment created.
                </p>
              </div>
              <div className="col-span-2 mt-4 pt-4 border-t border-border/50">
                <h4 className="text-sm font-semibold mb-3">Initial Administrator</h4>
              </div>
              <div className="col-span-2">
                <Label htmlFor="admin-name">Admin Full Name <span className="text-destructive">*</span></Label>
                <Input id="admin-name" required value={form.admin_name} onChange={e => setForm({ ...form, admin_name: e.target.value })} placeholder="e.g. John Doe" />
              </div>
              <div>
                <Label htmlFor="admin-email">Admin Email <span className="text-destructive">*</span></Label>
                <Input id="admin-email" type="email" required value={form.admin_email} onChange={e => setForm({ ...form, admin_email: e.target.value })} placeholder="admin@school.ac.ke" />
              </div>
              <div>
                <Label htmlFor="admin-password">Admin Password <span className="text-destructive">*</span></Label>
                <Input id="admin-password" type="password" required value={form.admin_password} onChange={e => setForm({ ...form, admin_password: e.target.value })} placeholder="••••••••" minLength={8} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create school"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}