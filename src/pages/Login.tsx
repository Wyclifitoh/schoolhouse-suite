import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { School, Eye, EyeOff, ArrowRight, ShieldCheck, Landmark, BookOpen, Wallet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { getDashboardRedirect } from "@/hooks/usePermission";
import loginCampus from "@/assets/login-campus.jpg";

const features = [
  { icon: BookOpen, label: "Academics", desc: "Classes, exams, subjects and timetables" },
  { icon: Wallet, label: "Finance", desc: "Fees, payments, balances and reporting" },
  { icon: ShieldCheck, label: "Secure Access", desc: "Role-based access with session login" },
  { icon: Landmark, label: "School Operations", desc: "Parents, staff, inventory and settings" },
];

const Login = () => {
  const navigate = useNavigate();
  const { signIn, isAuthenticated, primaryRole } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Redirect if already authenticated
  if (isAuthenticated) {
    const redirect = getDashboardRedirect(primaryRole);
    navigate(redirect, { replace: true });
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      toast.error(error);
    } else {
      toast.success("Signed in successfully");
      // Navigation will happen via auth state change + redirect above
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left — Hero */}
      <div
        className="relative hidden lg:flex lg:w-[58%] items-center justify-center overflow-hidden bg-card"
        style={{
          backgroundImage: `linear-gradient(135deg, hsl(var(--foreground) / 0.72), hsl(var(--primary) / 0.18), hsl(var(--foreground) / 0.42)), url(${loginCampus})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="absolute inset-0 bg-background/5" />

        <div className="relative z-10 flex w-full max-w-2xl flex-col items-center justify-center px-14 text-center text-primary-foreground">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary-foreground/20 bg-background/10 backdrop-blur-md shadow-2xl">
              <School className="h-8 w-8" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-[0.2em]">CHUO</span>
              <p className="text-xs uppercase tracking-[0.28em] text-primary-foreground/70">School Management System</p>
            </div>
          </div>
          <h1 className="mb-5 text-5xl font-black leading-[1.05] tracking-tight">
            One official platform
            <br />
            for running your school.
          </h1>
          <p className="mb-10 max-w-xl text-lg leading-relaxed text-primary-foreground/80">
            Manage admissions, academics, finance, communication and daily school operations from one secure system built for real institutional use.
          </p>

          <div className="grid w-full grid-cols-2 gap-4">
            {features.map(f => (
              <div key={f.label} className="flex items-center gap-3 rounded-2xl border border-primary-foreground/15 bg-background/10 p-4 text-left backdrop-blur-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10">
                  <f.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-bold">{f.label}</p>
                  <p className="text-[11px] text-primary-foreground/70">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
              <School className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-extrabold text-foreground tracking-wide">CHUO</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-foreground tracking-tight">Welcome back</h2>
            <p className="mt-2 text-muted-foreground">Sign in to continue to your official school workspace</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Email Address</Label>
              <Input
                type="email"
                placeholder="you@school.ac.ke"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="h-12 rounded-xl bg-muted/50 border-border/50"
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-12 rounded-xl pr-11 bg-muted/50 border-border/50"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl font-semibold text-base shadow-lg shadow-primary/25 transition-all duration-300"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <p className="mt-10 text-center text-xs text-muted-foreground">
            Secure access to <span className="font-bold text-foreground">CHUO</span> School Management System
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
