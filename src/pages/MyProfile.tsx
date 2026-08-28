import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Shield, User } from "lucide-react";

export default function MyProfile() {
  const { user, profile, primaryRole, getRoleLabel, refreshMe } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });

  useEffect(() => {
    setForm({
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      phone: profile?.phone || (user as any)?.phone || "",
    });
  }, [profile, user]);

  const save = async () => {
    if (!form.first_name.trim()) {
      toast.error("First name is required");
      return;
    }
    setSaving(true);
    try {
      await api.put("/auth/profile", form);
      toast.success("Profile updated");
      await refreshMe();
    } catch (err: any) {
      toast.error(err?.message || "Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  const initials =
    `${form.first_name?.[0] || ""}${form.last_name?.[0] || ""}`.toUpperCase() ||
    "?";

  return (
    <DashboardLayout
      title="My Profile"
      subtitle="Manage your personal details and account security"
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-black">
              {initials}
            </div>
            <div>
              <p className="font-bold text-foreground">
                {`${form.first_name} ${form.last_name}`.trim() || user?.email}
              </p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Shield className="h-3 w-3" />
              {primaryRole ? getRoleLabel(primaryRole) : "User"}
            </Badge>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-primary" />
              Personal details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>First name</Label>
                <Input
                  value={form.first_name}
                  onChange={(e) =>
                    setForm({ ...form, first_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Last name</Label>
                <Input
                  value={form.last_name}
                  onChange={(e) =>
                    setForm({ ...form, last_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="07XXXXXXXX"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={user?.email || ""} disabled />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={save} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </div>

            <Separator />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Account security</p>
                <p className="text-xs text-muted-foreground">
                  Update the password you use to sign in.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate("/change-password")}
              >
                Change password
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
