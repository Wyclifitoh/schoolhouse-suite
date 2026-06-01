import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Users,
  GraduationCap,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  School,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import { toast } from "sonner";

const UserLogin = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, account } = usePortalAuth();
  const [tab, setTab] = useState<"parent" | "student">("parent");
  const [identifier, setIdentifier] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated && account) {
    navigate(account.type === "parent" ? "/portal/parent" : "/portal/student", {
      replace: true,
    });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !pin) {
      toast.error("Enter your details and PIN");
      return;
    }
    setLoading(true);
    const { error, account: acc } = await login(tab, identifier.trim(), pin);
    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Signed in");
    navigate(acc?.type === "parent" ? "/portal/parent" : "/portal/student", {
      replace: true,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20 mb-3">
            <School className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-black text-foreground">
            Parent & Student Portal
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track results, attendance and fees
          </p>
        </div>

        <Card className="border-border/60 shadow-xl">
          <CardContent className="p-6">
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              <TabsList className="grid w-full grid-cols-2 mb-5">
                <TabsTrigger value="parent" className="gap-2">
                  <Users className="h-4 w-4" /> Parent
                </TabsTrigger>
                <TabsTrigger value="student" className="gap-2">
                  <GraduationCap className="h-4 w-4" /> Student
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} className="space-y-4">
                <TabsContent value="parent" className="m-0 space-y-2">
                  <Label className="text-sm font-semibold">Phone Number</Label>
                  <Input
                    placeholder="e.g. 0712345678"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="h-11 rounded-xl"
                    autoComplete="tel"
                  />
                </TabsContent>
                <TabsContent value="student" className="m-0 space-y-2">
                  <Label className="text-sm font-semibold">
                    Admission Number
                  </Label>
                  <Input
                    placeholder="e.g. ADM/2024/001"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </TabsContent>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">PIN</Label>
                  <div className="relative">
                    <Input
                      type={showPin ? "text" : "password"}
                      placeholder="••••"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="h-11 rounded-xl pr-11 tracking-widest"
                      inputMode="numeric"
                      maxLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPin ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Default PIN for new accounts is{" "}
                    <span className="font-bold">0000</span>. Change it after
                    first login.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2">
                      Sign In <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Are you staff?{" "}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Staff sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default UserLogin;
