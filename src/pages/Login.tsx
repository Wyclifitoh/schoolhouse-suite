import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { School, Eye, EyeOff, ArrowRight, Shield, Users, BarChart3, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth, ROLE_LABELS, UserRole } from "@/contexts/AuthContext";

const features = [
  { icon: Users, label: "342 Students", desc: "Active enrollments" },
  { icon: Shield, label: "Role-based Access", desc: "6 user roles" },
  { icon: BarChart3, label: "Real-time Analytics", desc: "Live dashboards" },
  { icon: Zap, label: "99.9% Uptime", desc: "Always available" },
];

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("admin");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login(selectedRole);
      setLoading(false);
      if (selectedRole === "parent") navigate("/parent-portal");
      else if (selectedRole === "student") navigate("/student-panel");
      else navigate("/dashboard");
    }, 800);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left — Hero */}
      <div className="hidden lg:flex lg:w-[55%] relative items-center justify-center overflow-hidden bg-gradient-to-br from-[hsl(221,83%,20%)] via-[hsl(221,83%,35%)] to-[hsl(262,83%,40%)]">
        {/* Floating orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[10%] left-[15%] w-[400px] h-[400px] rounded-full bg-white/[0.04] blur-3xl" />
          <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] rounded-full bg-white/[0.03] blur-3xl" />
          <div className="absolute top-[60%] left-[60%] w-[200px] h-[200px] rounded-full bg-primary-foreground/[0.05] blur-2xl" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '64px 64px'
          }} />
        </div>

        <div className="relative z-10 max-w-lg px-12 text-white">
          <div className="flex items-center gap-3 mb-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 shadow-2xl">
              <School className="h-8 w-8" />
            </div>
            <div>
              <span className="text-2xl font-extrabold tracking-wide">CHUO</span>
              <p className="text-xs text-white/50 tracking-widest uppercase">Management System</p>
            </div>
          </div>
          <h1 className="text-5xl font-extrabold leading-[1.1] mb-5 tracking-tight">
            School Management,
            <br />
            <span className="text-white/50">Reimagined.</span>
          </h1>
          <p className="text-lg text-white/50 leading-relaxed mb-12">
            A modern platform designed for Kenyan schools. Manage admissions, fees, exams, and more — all in one place.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {features.map(f => (
              <div key={f.label} className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.08]">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                  <f.icon className="h-5 w-5 text-white/80" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{f.label}</p>
                  <p className="text-[11px] text-white/40">{f.desc}</p>
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
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Welcome back</h2>
            <p className="mt-2 text-muted-foreground">Sign in to your school management portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Login As</Label>
              <Select value={selectedRole} onValueChange={v => setSelectedRole(v as UserRole)}>
                <SelectTrigger className="h-12 rounded-xl bg-muted/50 border-border/50 font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ROLE_LABELS) as UserRole[]).map(r => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Email Address</Label>
              <Input type="email" placeholder="admin@school.ac.ke" defaultValue="admin@school.ac.ke" className="h-12 rounded-xl bg-muted/50 border-border/50" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Password</Label>
                <button type="button" className="text-xs text-primary hover:underline font-medium">Forgot password?</button>
              </div>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} placeholder="••••••••" defaultValue="password123" className="h-12 rounded-xl pr-11 bg-muted/50 border-border/50" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 rounded-xl font-semibold text-base bg-gradient-to-r from-primary to-[hsl(var(--primary-glow))] hover:opacity-90 shadow-lg shadow-primary/25 transition-all duration-300" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In as {ROLE_LABELS[selectedRole]}
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <p className="mt-10 text-center text-xs text-muted-foreground">
            Powered by <span className="font-semibold text-foreground">CHUO</span> School Management System
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
