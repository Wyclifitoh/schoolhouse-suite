import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { School, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useSeo } from "@/hooks/useSeo";

export default function Signup() {
  useSeo("Create your CHUO account", "Start your free 30-day trial. Onboard your school in minutes.");
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    owner_name: "", owner_email: "", owner_phone: "", password: "", confirm: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast({ title: "Passwords don't match", variant: "destructive" });
    if (form.password.length < 8) return toast({ title: "Password must be at least 8 characters", variant: "destructive" });
    // stash for onboarding step
    sessionStorage.setItem("chuo-signup-draft", JSON.stringify(form));
    nav("/onboarding");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <School className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-black">Create your account</h1>
            <p className="text-sm text-muted-foreground">Start your 30-day free trial. No card required.</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>Your full name</Label>
              <Input required value={form.owner_name} onChange={(e) => set("owner_name", e.target.value)} placeholder="Jane Doe" />
            </div>
            <div>
              <Label>Email</Label>
              <Input required type="email" value={form.owner_email} onChange={(e) => set("owner_email", e.target.value)} placeholder="you@school.com" />
            </div>
            <div>
              <Label>Phone (M-Pesa)</Label>
              <Input value={form.owner_phone} onChange={(e) => set("owner_phone", e.target.value)} placeholder="2547xxxxxxxx" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Password</Label>
                <Input required type="password" value={form.password} onChange={(e) => set("password", e.target.value)} />
              </div>
              <div>
                <Label>Confirm</Label>
                <Input required type="password" value={form.confirm} onChange={(e) => set("confirm", e.target.value)} />
              </div>
            </div>
            <Button type="submit" className="w-full font-semibold" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (<>Continue to school details <ArrowRight className="ml-2 h-4 w-4" /></>)}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="text-primary font-semibold">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
