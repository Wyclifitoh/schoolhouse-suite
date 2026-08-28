import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Wallet,
  Building2,
  Loader2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { getDashboardRedirect } from "@/hooks/usePermission";
import loginCampus from "@/assets/login-campus.jpg";
import monogram from "@/assets/chuo-monogram.png";

const capabilities = [
  {
    icon: BookOpen,
    label: "Academics",
    desc: "Classes, subjects, assessments and timetables",
  },
  {
    icon: Wallet,
    label: "Finance",
    desc: "Fees, payments, balances and financial reporting",
  },
  {
    icon: Building2,
    label: "School Operations",
    desc: "Students, staff, communication, inventory and administration",
  },
];

const Login = () => {
  const { signIn, isAuthenticated, isLoading, primaryRole } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">Checking your session…</p>
        </div>
      </div>
    );
  }

  // Declarative redirects avoid updating router state during render.
  if (isAuthenticated) {
    const redirect = getDashboardRedirect(primaryRole);
    return <Navigate to={redirect} replace />;
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
    <div className="flex min-h-screen bg-muted/30">
      {/* Left — Brand */}
      <div className="relative hidden lg:flex lg:w-[55%] flex-col justify-between overflow-hidden">
        <img
          src={loginCampus}
          alt="School campus"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, hsl(222 47% 11% / 0.92) 0%, hsl(222 47% 11% / 0.78) 45%, hsl(221 83% 33% / 0.72) 100%)",
          }}
        />

        <div className="relative z-10 flex flex-col justify-between h-full px-14 py-14 text-primary-foreground">
          {/* Brand lockup */}
          <div className="flex items-center gap-3">
            <img
              src={monogram}
              alt="CHUO logo"
              className="h-11 w-11 rounded-xl bg-primary-foreground/95 p-1.5 object-contain"
            />
            <div className="leading-tight">
              <p className="text-xl font-bold tracking-[0.22em]">CHUO</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-primary-foreground/60">
                School Management System
              </p>
            </div>
          </div>

          {/* Message */}
          <div className="max-w-xl">
            <h1 className="text-[2.75rem] font-semibold leading-[1.1] tracking-tight">
              Everything your school needs.
              <br />
              <span className="text-primary-foreground/85">
                One powerful platform.
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-primary-foreground/70">
              Manage students, academics, finance, communication and daily school
              operations from one secure system.
            </p>
          </div>

          {/* Capability cards */}
          <div className="space-y-3">
            {capabilities.map((c) => (
              <div
                key={c.label}
                className="flex items-start gap-3.5 rounded-xl border border-primary-foreground/10 bg-primary-foreground/[0.07] px-4 py-3.5 backdrop-blur-sm transition-colors hover:bg-primary-foreground/[0.1]"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10">
                  <c.icon className="h-4 w-4 text-primary-foreground/90" />
                </div>
                <div>
                  <p className="text-sm font-semibold tracking-wide">
                    {c.label}
                  </p>
                  <p className="text-xs leading-relaxed text-primary-foreground/60">
                    {c.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Auth panel */}
      <div className="flex flex-1 items-center justify-center bg-muted/40 px-6 py-10 sm:px-10">
        <div className="w-full max-w-[400px] animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* Mobile brand */}
          <div className="mb-9 flex items-center gap-3 lg:hidden">
            <img
              src={monogram}
              alt="CHUO logo"
              className="h-10 w-10 object-contain"
            />
            <div className="leading-tight">
              <p className="text-lg font-bold tracking-[0.2em] text-foreground">
                CHUO
              </p>
              <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                School Management System
              </p>
            </div>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Welcome back
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in to continue to your school workspace
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[13px] font-medium text-foreground">
                Email Address
              </Label>
              <Input
                type="email"
                placeholder="you@school.ac.ke"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-lg border-border bg-card text-sm shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-primary/25"
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[13px] font-medium text-foreground">
                  Password
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-primary transition-colors hover:text-primary/80 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-lg border-border bg-card pr-11 text-sm shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-primary/25"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="h-11 w-full rounded-lg text-sm font-semibold shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-7 flex items-center justify-center gap-2 border-t border-border pt-6 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary/70" />
            <span>
              Secure access to{" "}
              <span className="font-semibold text-foreground">CHUO</span> School
              Management System
            </span>
          </div>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/70">
            <Lock className="h-3 w-3" />
            Role-based access with session sign-in
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
