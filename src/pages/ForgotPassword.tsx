import { useState } from "react";
import { Link } from "react-router-dom";
import { School, ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await resetPassword(email);
    setLoading(false);

    if (error) {
      setError(error);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-[420px]">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
            <School className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-extrabold text-foreground tracking-wide">CHUO</span>
        </div>

        <Card className="glass-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-extrabold">Reset Password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4">
                <Alert className="bg-success/10 border-success/30">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <AlertDescription className="text-success">
                    Password reset email sent! Check your inbox for a link to reset your password.
                  </AlertDescription>
                </Alert>
                <Link to="/login">
                  <Button variant="outline" className="w-full mt-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="h-12 rounded-xl pl-10 bg-muted/50 border-border/50"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl font-semibold bg-gradient-to-r from-primary to-[hsl(var(--primary-glow))] hover:opacity-90 shadow-lg shadow-primary/25"
                  disabled={loading || !email}
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>

                <Link to="/login" className="block">
                  <Button variant="ghost" className="w-full text-muted-foreground">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Button>
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
