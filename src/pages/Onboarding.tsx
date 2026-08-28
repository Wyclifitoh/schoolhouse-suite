import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { School, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useSeo } from "@/hooks/useSeo";

export default function Onboarding() {
  useSeo("Onboard your school — CHUO", "Set up your school in CHUO and start your 30-day free trial.");
  const nav = useNavigate();
  const { refreshMe } = useAuth();
  const [loading, setLoading] = useState(false);

  const [draft, setDraft] = useState<any>(null);
  const [form, setForm] = useState({
    school_name: "", school_code: "", curriculum_type: "CBC", address: "", paybill_number: "",
    academic_year_name: `${new Date().getFullYear()}`,
    academic_year_start: `${new Date().getFullYear()}-01-01`,
    academic_year_end: `${new Date().getFullYear()}-12-31`,
    term_name: "Term 1",
    term_start: `${new Date().getFullYear()}-01-01`,
    term_end: `${new Date().getFullYear()}-04-30`,
  });

  useEffect(() => {
    const raw = sessionStorage.getItem("chuo-signup-draft");
    if (!raw) { nav("/signup"); return; }
    setDraft(JSON.parse(raw));
  }, [nav]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setLoading(true);
    try {
      const payload = {
        owner_name: draft.owner_name,
        owner_email: draft.owner_email,
        owner_phone: draft.owner_phone,
        password: draft.password,
        ...form,
      };
      const data = await api.post<{ token: string; user: any; school: any }>("/onboarding/signup", payload);
      localStorage.setItem("chuo-token", data.token);
      localStorage.setItem("chuo-school-id", data.school.id);
      api.setToken(data.token);
      api.setSchoolId(data.school.id);
      sessionStorage.removeItem("chuo-signup-draft");
      await refreshMe();
      toast({ title: "School created! Welcome to CHUO" , description: "Your 30-day free trial is now active." });
      nav("/dashboard");
    } catch (err: any) {
      toast({ title: "Could not create account", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  if (!draft) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-background p-4 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <School className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-black">Set up your school</h1>
          <p className="text-sm text-muted-foreground">A few details and you're done — your 30-day free trial begins immediately.</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={submit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>School name *</Label>
                  <Input required value={form.school_name} onChange={(e) => set("school_name", e.target.value)} placeholder="Bright Future Academy" />
                </div>
                <div>
                  <Label>School code</Label>
                  <Input value={form.school_code} onChange={(e) => set("school_code", e.target.value)} placeholder="BFA-001" />
                </div>
                <div>
                  <Label>Curriculum</Label>
                  <Select value={form.curriculum_type} onValueChange={(v) => set("curriculum_type", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CBC">CBC</SelectItem>
                      <SelectItem value="8-4-4">8-4-4</SelectItem>
                      <SelectItem value="IGCSE">IGCSE</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>M-Pesa paybill (optional)</Label>
                  <Input value={form.paybill_number} onChange={(e) => set("paybill_number", e.target.value)} placeholder="123456" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Address</Label>
                  <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Nairobi, Kenya" />
                </div>
              </div>

              <div className="border-t pt-5 space-y-4">
                <h3 className="font-bold text-sm">Current academic year & term</h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <Label>Year name</Label>
                    <Input value={form.academic_year_name} onChange={(e) => set("academic_year_name", e.target.value)} />
                  </div>
                  <div>
                    <Label>Year start</Label>
                    <Input type="date" value={form.academic_year_start} onChange={(e) => set("academic_year_start", e.target.value)} />
                  </div>
                  <div>
                    <Label>Year end</Label>
                    <Input type="date" value={form.academic_year_end} onChange={(e) => set("academic_year_end", e.target.value)} />
                  </div>
                  <div>
                    <Label>Term name</Label>
                    <Input value={form.term_name} onChange={(e) => set("term_name", e.target.value)} />
                  </div>
                  <div>
                    <Label>Term start</Label>
                    <Input type="date" value={form.term_start} onChange={(e) => set("term_start", e.target.value)} />
                  </div>
                  <div>
                    <Label>Term end</Label>
                    <Input type="date" value={form.term_end} onChange={(e) => set("term_end", e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Your 30-day free trial includes everything</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Students, Assessments, Finance, Inventory, HR, Communication & Portal. Choose a paid plan any time from Settings → Billing.
                    </p>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full font-semibold" size="lg" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (<>Create school & start trial <ArrowRight className="ml-2 h-4 w-4" /></>)}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
