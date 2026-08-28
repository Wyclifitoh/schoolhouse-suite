import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck } from "lucide-react";
import { usePlatformAuth } from "@/contexts/PlatformAuthContext";
import { toast } from "@/hooks/use-toast";
import { useSeo } from "@/hooks/useSeo";

export default function AdminLogin() {
  useSeo("CHUO Platform Console — Sign in", "Internal CHUO staff access");
  const { signIn, isAuthenticated } = usePlatformAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (isAuthenticated) nav("/admin", { replace: true }); }, [isAuthenticated, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) toast({ title: "Sign-in failed", description: error, variant: "destructive" });
    else { toast({ title: "Welcome back" }); nav("/admin"); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-primary via-primary to-indigo-700 text-white relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
              <span className="font-black text-lg">C</span>
            </div>
            <div className="leading-tight">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/70 font-semibold">
                CHUO Cloud
              </div>
              <div className="font-bold">Operations Center</div>
            </div>
          </div>
        </div>
        <div className="relative space-y-5 max-w-sm">
          <h2 className="text-3xl font-black leading-tight tracking-tight">
            Run the entire CHUO platform from one console.
          </h2>
          <p className="text-sm text-white/80">
            Manage every school, subscription, invoice, SMS credit and platform signal
            — all in real time.
          </p>
          <div className="grid grid-cols-3 gap-3 pt-2">
            {["Schools", "Billing", "SMS Ops"].map((x) => (
              <div key={x} className="rounded-lg bg-white/10 backdrop-blur px-3 py-2 text-xs font-semibold">
                {x}
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-xs text-white/60">
          Restricted access · WikiTeq platform staff only
        </div>
      </div>
      <div className="flex items-center justify-center p-6 lg:p-10 bg-slate-50">
        <Card className="w-full max-w-md shadow-xl border-slate-200">
          <CardContent className="p-8 space-y-6">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-black tracking-tight">Sign in to the console</h1>
              <p className="text-sm text-muted-foreground">
                Use your WikiTeq platform staff credentials.
              </p>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-11"
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground">
              School accounts cannot sign in here — use{" "}
              <a href="/login" className="text-primary font-semibold hover:underline">
                chuoflow.co.ke
              </a>{" "}
              instead.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}