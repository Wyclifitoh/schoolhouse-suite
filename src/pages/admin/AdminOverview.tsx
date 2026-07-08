import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Building2, Users, GraduationCap, Banknote, Clock, ArrowRight } from "lucide-react";
import { useOverview } from "@/hooks/usePlatform";
import { Link } from "react-router-dom";

const fmt = (n: number) => `KSh ${Number(n || 0).toLocaleString()}`;

export default function AdminOverview() {
  const { data, isLoading } = useOverview();

  if (isLoading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!data) return <div className="p-6">No data</div>;

  const subs = data.subscriptions || {};
  const totalSubs = Object.values(subs).reduce((a, b) => a + (b as number), 0);

  const kpi = [
    { label: "Schools", value: data.totals.total_schools, icon: Building2, sub: `${data.totals.active_schools} active` },
    { label: "Students (system-wide)", value: data.totals.total_students.toLocaleString(), icon: GraduationCap },
    { label: "Users (school staff)", value: data.totals.total_users.toLocaleString(), icon: Users },
    { label: "Revenue collected", value: fmt(data.revenue.collected), icon: Banknote, sub: `${fmt(data.revenue.pending)} pending` },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-3xl font-black">Platform overview</h1>
        <p className="text-muted-foreground">A live snapshot of every school on CHUO.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpi.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase font-bold text-muted-foreground">{k.label}</p>
                <k.icon className="h-4 w-4 text-primary" />
              </div>
              <p className="text-3xl font-black mt-2">{k.value}</p>
              {k.sub && <p className="text-xs text-muted-foreground mt-1">{k.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <h3 className="font-bold mb-3">Subscription mix</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {["trial","active","past_due","locked","cancelled"].map((s) => (
                <div key={s} className="rounded-lg border p-3">
                  <div className="text-[11px] uppercase font-semibold text-muted-foreground">{s.replace("_"," ")}</div>
                  <div className="text-2xl font-black">{subs[s] || 0}</div>
                  {totalSubs > 0 && <div className="text-[11px] text-muted-foreground">{Math.round(((subs[s] || 0) / totalSubs) * 100)}%</div>}
                </div>
              ))}
            </div>
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              <div className="rounded-lg border p-3">
                <div className="text-[11px] uppercase font-semibold text-muted-foreground">This month — paid</div>
                <div className="text-2xl font-black">{fmt(data.revenue.mtd_paid)}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-[11px] uppercase font-semibold text-muted-foreground">This month — pending</div>
                <div className="text-2xl font-black">{fmt(data.revenue.mtd_pending)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold flex items-center gap-2"><Clock className="h-4 w-4 text-warning" /> Trials ending in 7 days</h3>
              <Badge variant="secondary">{data.trialsEndingSoon.length}</Badge>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data.trialsEndingSoon.length === 0 && <p className="text-sm text-muted-foreground">All trials are stable.</p>}
              {data.trialsEndingSoon.map((t) => (
                <Link key={t.id} to={`/admin/schools/${t.id}`} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                  <div>
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground">ends {new Date(t.trial_ends_at).toLocaleDateString()}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">New schools (last 30 days)</h3>
            <span className="text-sm text-muted-foreground">{data.signups30d.reduce((a, x) => a + Number(x.c), 0)} total</span>
          </div>
          <div className="mt-4 flex items-end gap-1 h-32">
            {data.signups30d.length === 0 && <p className="text-sm text-muted-foreground">No signups yet.</p>}
            {data.signups30d.map((d) => {
              const max = Math.max(...data.signups30d.map((x) => Number(x.c)), 1);
              const h = Math.max(4, (Number(d.c) / max) * 100);
              return <div key={d.d} title={`${d.d}: ${d.c}`} className="flex-1 bg-primary/70 hover:bg-primary rounded-t" style={{ height: `${h}%` }} />;
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button asChild variant="outline"><Link to="/admin/schools">View all schools <ArrowRight className="h-4 w-4 ml-1" /></Link></Button>
      </div>
    </div>
  );
}