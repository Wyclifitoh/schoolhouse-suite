import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePlatformPlans, useSavePlan, useDeletePlan, PlatformPlan } from "@/hooks/usePlatform";
import { toast } from "@/hooks/use-toast";

const blank: Partial<PlatformPlan> = { code: "", name: "", billing_mode: "per_student", cycle: "termly", price_per_student: 0, base_price: 0, min_students: null, max_students: null, description: "" };

export default function AdminPlans() {
  const { data: plans = [], isLoading } = usePlatformPlans();
  const save = useSavePlan();
  const del = useDeletePlan();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(blank);

  const edit = (p: PlatformPlan) => { setForm(p); setOpen(true); };
  const create = () => { setForm({ ...blank }); setOpen(true); };

  const submit = async () => {
    try { await save.mutateAsync(form); toast({ title: "Plan saved" }); setOpen(false); }
    catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">Plans</h1>
          <p className="text-muted-foreground">Manage CHUO subscription plans. Changes only affect new invoices.</p>
        </div>
        <Button onClick={create}><Plus className="h-4 w-4 mr-1" /> New plan</Button>
      </div>

      {isLoading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {plans.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">{p.name}</h3>
                  <Badge variant={p.is_active ? "default" : "outline"}>{p.is_active ? "active" : "off"}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{p.description}</p>
                <div className="text-2xl font-black">
                  {p.billing_mode === "per_student" ? `KSh ${Number(p.price_per_student).toLocaleString()}` : `KSh ${Number(p.base_price).toLocaleString()}`}
                  <span className="text-xs text-muted-foreground font-normal"> / {p.billing_mode === "per_student" ? `learner / ${p.cycle}` : p.cycle}</span>
                </div>
                <div className="text-xs text-muted-foreground">{p.billing_mode} · {p.cycle}{p.min_students || p.max_students ? ` · ${p.min_students || 1}–${p.max_students || "∞"} learners` : ""}</div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => edit(p)}>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete this plan?")) del.mutate(p.id, { onSuccess: () => toast({ title: "Plan deleted" }) }); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{form.id ? "Edit plan" : "New plan"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Code</Label><Input value={form.code || ""} onChange={(e) => setForm({ ...form, code: e.target.value })} disabled={!!form.id} /></div>
              <div><Label>Name</Label><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Billing mode</Label>
                <Select value={form.billing_mode} onValueChange={(v) => setForm({ ...form, billing_mode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["per_student","flat","module","free"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Cycle</Label>
                <Select value={form.cycle} onValueChange={(v) => setForm({ ...form, cycle: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["monthly","termly","yearly"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Price / learner</Label><Input type="number" value={form.price_per_student || 0} onChange={(e) => setForm({ ...form, price_per_student: Number(e.target.value) })} /></div>
              <div><Label>Base price (flat / module)</Label><Input type="number" value={form.base_price || 0} onChange={(e) => setForm({ ...form, base_price: Number(e.target.value) })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Min learners</Label><Input type="number" value={form.min_students || ""} onChange={(e) => setForm({ ...form, min_students: e.target.value ? Number(e.target.value) : null })} /></div>
              <div><Label>Max learners</Label><Input type="number" value={form.max_students || ""} onChange={(e) => setForm({ ...form, max_students: e.target.value ? Number(e.target.value) : null })} /></div>
            </div>
            <div><Label>Description</Label><Input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked ? 1 : 0 })} /> Active</label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>{form.id ? "Save changes" : "Create plan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}