import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Search, ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSchools } from "@/hooks/usePlatform";

const STATUS_COLORS: Record<string,"default"|"secondary"|"destructive"|"outline"> = {
  active: "default", trial: "secondary", past_due: "outline", locked: "destructive", cancelled: "destructive",
};

export default function AdminSchools() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const { data: schools = [], isLoading } = useSchools({ search, status });

  const totals = useMemo(() => ({
    students: schools.reduce((a, s) => a + Number(s.active_students || 0), 0),
    staff: schools.reduce((a, s) => a + Number(s.staff_count || 0), 0),
    revenue: schools.reduce((a, s) => a + Number(s.lifetime_paid || 0), 0),
  }), [schools]);

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">Schools</h1>
          <p className="text-muted-foreground">{schools.length} schools • {totals.students.toLocaleString()} active students • KSh {totals.revenue.toLocaleString()} collected</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, code…" className="pl-9" />
          </div>
          <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
            <SelectTrigger className="sm:w-56"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="past_due">Past due</SelectItem>
              <SelectItem value="locked">Locked</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground border-b bg-muted/30">
                <tr>
                  <th className="p-3">School</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Students</th>
                  <th className="p-3 text-right">Staff</th>
                  <th className="p-3 text-right">Paid (lifetime)</th>
                  <th className="p-3">Trial / Renews</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {schools.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No schools match the filters.</td></tr>}
                {schools.map((s) => (
                  <tr key={s.id} className="border-b hover:bg-muted/40">
                    <td className="p-3">
                      <div className="font-semibold">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.email || s.code || "—"}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">{s.plan_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{s.billing_mode || ""} {s.cycle ? `· ${s.cycle}` : ""}</div>
                    </td>
                    <td className="p-3">
                      <Badge variant={STATUS_COLORS[s.sub_status || ""] || "outline"}>{s.sub_status || "no sub"}</Badge>
                    </td>
                    <td className="p-3 text-right font-semibold">{Number(s.active_students).toLocaleString()}</td>
                    <td className="p-3 text-right">{Number(s.staff_count).toLocaleString()}</td>
                    <td className="p-3 text-right font-semibold">KSh {Number(s.lifetime_paid).toLocaleString()}</td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {s.sub_status === "trial" && s.trial_ends_at && <>Trial ends {new Date(s.trial_ends_at).toLocaleDateString()}</>}
                      {s.sub_status === "active" && s.current_period_end && <>Renews {new Date(s.current_period_end).toLocaleDateString()}</>}
                    </td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/admin/schools/${s.id}`}>Manage <ArrowRight className="h-3 w-3 ml-1" /></Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}