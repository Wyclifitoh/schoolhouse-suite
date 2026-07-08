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
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-black">CHUO Platform Console</h1>
            <p className="text-sm text-muted-foreground">Internal staff sign-in</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground text-center">Restricted to CHUO platform staff. School accounts cannot sign in here.</p>
        </CardContent>
      </Card>
    </div>
  );
}