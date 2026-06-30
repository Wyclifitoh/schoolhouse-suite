import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, KeyRound, ShieldX, ShieldCheck } from "lucide-react";
import { useSearchUsers, useResetUserPassword, useSetUserActive } from "@/hooks/usePlatform";
import { toast } from "@/hooks/use-toast";

export default function AdminUsers() {
  const [q, setQ] = useState("");
  const { data = [], isLoading } = useSearchUsers(q);
  const reset = useResetUserPassword();
  const setActive = useSetUserActive();

  return (
    <div className="p-6 space-y-6 max-w-[1200px]">
      <div>
        <h1 className="text-3xl font-black">Users</h1>
        <p className="text-muted-foreground">Search any user across every school on CHUO.</p>
      </div>
      <Card><CardContent className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, email or phone (min 2 chars)" className="pl-9" />
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-0 overflow-x-auto">
        {isLoading ? <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground border-b bg-muted/30">
              <tr><th className="p-3">Name</th><th className="p-3">Email / Phone</th><th className="p-3">Memberships</th><th className="p-3">Status</th><th className="p-3"></th></tr>
            </thead>
            <tbody>
              {data.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">{q.length < 2 ? "Type at least 2 characters." : "No matches."}</td></tr>}
              {data.map((u: any) => (
                <tr key={u.id} className="border-b">
                  <td className="p-3 font-medium">{u.full_name}</td>
                  <td className="p-3 text-xs">{u.email}<br /><span className="text-muted-foreground">{u.phone}</span></td>
                  <td className="p-3 text-xs">{u.memberships ? u.memberships.split("|").join(" • ") : "—"}</td>
                  <td className="p-3"><span className={u.is_active ? "text-success" : "text-destructive"}>{u.is_active ? "active" : "disabled"}</span></td>
                  <td className="p-3 text-right space-x-1">
                    <Button size="sm" variant="outline" onClick={() => {
                      const pw = prompt("New password (min 8 chars)");
                      if (pw && pw.length >= 8) reset.mutate({ id: u.id, password: pw }, {
                        onSuccess: () => toast({ title: "Password reset" }),
                        onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
                      });
                    }}><KeyRound className="h-3 w-3" /></Button>
                    <Button size="sm" variant={u.is_active ? "destructive" : "default"} onClick={() => setActive.mutate({ id: u.id, active: !u.is_active }, { onSuccess: () => toast({ title: u.is_active ? "User disabled" : "User enabled" }) })}>
                      {u.is_active ? <ShieldX className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent></Card>
    </div>
  );
}
