import { PortalShell } from "@/components/portal/PortalShell";
import { useSelectedChild } from "@/contexts/SelectedChildContext";
import {
  usePortalFeeItems,
  usePortalPayments,
  usePortalReportCards,
  usePortalStudentSummary,
} from "@/hooks/usePortalApi";
import {
  usePortalTimetable,
  usePortalEvents,
  usePortalAccount,
  useUpdatePortalAccount,
  useChangePortalPin,
  usePortalNotices,
} from "@/hooks/usePortalApiExtended";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatCard, EmptyState } from "@/components/portal/StatCard";
import {
  Banknote, FileText, Receipt, Clock, Megaphone, CalendarDays,
  BookMarked, Bus, Download, Pin, Settings as SettingsIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const KES = (n: number) => `KES ${Math.abs(Number(n) || 0).toLocaleString()}`;

/* ============ FINANCE ============ */
export function FinancePage() {
  return (
    <PortalShell title="Finance" subtitle="Fee statements, payments & receipts">
      <FinanceBody />
    </PortalShell>
  );
}
function FinanceBody() {
  const { selected } = useSelectedChild();
  const { data: summary } = usePortalStudentSummary(selected?.id);
  const { data: items = [] } = usePortalFeeItems(selected?.id);
  const { data: pays = [] } = usePortalPayments(selected?.id);
  const f = summary?.fees;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Billed" value={f ? KES(f.total_billed) : "—"} icon={FileText} tone="neutral" />
        <StatCard label="Total Paid" value={f ? KES(f.total_paid) : "—"} icon={Receipt} tone="success" />
        <StatCard label="Outstanding" value={f ? KES(f.balance) : "—"} icon={Banknote} tone={f && f.balance > 0 ? "warning" : "success"} />
      </div>
      <Card>
        <CardContent className="p-5">
          <p className="text-sm font-black mb-3">Fee Breakdown</p>
          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No invoices.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground uppercase">
                  <tr><th className="text-left py-2">Item</th><th className="text-right">Due</th><th className="text-right">Paid</th><th className="text-right">Balance</th></tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.id} className="border-t">
                      <td className="py-2.5 font-semibold">{i.fee_name || i.fee_category || i.ledger_type}<div className="text-xs text-muted-foreground">{i.term_name} · {i.year_name}</div></td>
                      <td className="text-right">{KES(i.amount_due)}</td>
                      <td className="text-right text-emerald-600">{KES(i.amount_paid)}</td>
                      <td className="text-right font-bold">{KES(i.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5">
          <p className="text-sm font-black mb-3">Payment History</p>
          {pays.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No payments yet.</p>
          ) : (
            <div className="divide-y">
              {pays.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold">{KES(p.amount)} <span className="text-xs font-normal text-muted-foreground">via {p.payment_method}</span></p>
                    <p className="text-xs text-muted-foreground">{p.received_at ? new Date(p.received_at).toLocaleString() : "—"} · {p.reference_number || p.mpesa_receipt || "—"}</p>
                  </div>
                  <Badge variant="outline" className="capitalize">{p.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ============ TIMETABLE ============ */
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
export function TimetablePage() {
  return (
    <PortalShell title="Timetable" subtitle="Class schedule by day & period">
      <TimetableBody />
    </PortalShell>
  );
}
function TimetableBody() {
  const { selected } = useSelectedChild();
  const { data: tt } = usePortalTimetable(selected?.id);
  if (!tt || tt.periods.length === 0) {
    return <EmptyState icon={Clock} title="No timetable yet" description="The school hasn't published a timetable for this class." />;
  }
  const grid = new Map<string, any>();
  tt.entries.forEach((e) => grid.set(`${e.day}-${e.period}`, e));
  return (
    <Card>
      <CardContent className="p-3 sm:p-5 overflow-x-auto">
        <table className="w-full text-xs sm:text-sm border-separate border-spacing-1.5 min-w-[600px]">
          <thead>
            <tr>
              <th className="text-left text-[10px] uppercase font-bold text-muted-foreground p-2">Period</th>
              {DAYS.map((d) => <th key={d} className="text-left text-[10px] uppercase font-bold text-muted-foreground p-2">{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {tt.periods.map((p) => (
              <tr key={p.id}>
                <td className="p-2 align-top">
                  <div className="font-bold">{p.label}</div>
                  <div className="text-[10px] text-muted-foreground">{p.start_time}–{p.end_time}</div>
                </td>
                {DAYS.map((d) => {
                  const e = grid.get(`${d.toLowerCase()}-${p.position}`);
                  return (
                    <td key={d} className="p-2 rounded-lg bg-muted/40 align-top">
                      {e ? (
                        <>
                          <div className="font-bold truncate">{e.subject_name || "—"}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{e.teacher_name || ""}</div>
                          {e.room && <div className="text-[10px] text-muted-foreground">Rm {e.room}</div>}
                        </>
                      ) : <span className="text-muted-foreground/50">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

/* ============ COMMUNICATION ============ */
export function CommunicationPage() {
  return (
    <PortalShell title="Communication" subtitle="School announcements & notices">
      <CommBody />
    </PortalShell>
  );
}

const PRIORITY_TONE: Record<string, string> = {
  urgent: "bg-destructive/10 text-destructive border-destructive/30",
  high: "bg-warning/10 text-warning border-warning/30",
  normal: "bg-muted text-muted-foreground border-border",
  low: "bg-muted text-muted-foreground border-border",
};

function CommBody() {
  const { data: notices = [], isLoading } = usePortalNotices();
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = notices.filter(
    (n) =>
      !q ||
      n.title.toLowerCase().includes(q.toLowerCase()) ||
      n.message.toLowerCase().includes(q.toLowerCase()),
  );
  const pinned = filtered.filter((n) => !!n.pinned);
  const rest = filtered.filter((n) => !n.pinned);
  const active = notices.find((n) => n.id === openId) || null;

  if (isLoading)
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    );

  if (!notices.length)
    return (
      <EmptyState
        icon={Megaphone}
        title="No announcements yet"
        description="Notices published by the school will appear here."
      />
    );

  const NoticeCard = ({ n }: { n: (typeof notices)[number] }) => (
    <button
      type="button"
      onClick={() => setOpenId(n.id)}
      className="text-left group rounded-xl border bg-card hover:border-primary/40 hover:shadow-md transition-all overflow-hidden flex flex-col"
    >
      <div
        className={`h-1 w-full ${n.priority === "urgent" ? "bg-destructive" : n.priority === "high" ? "bg-warning" : "bg-primary/60"}`}
      />
      <div className="p-4 sm:p-5 flex flex-col gap-2 flex-1">
        <div className="flex items-start gap-2">
          {!!n.pinned && <Pin className="h-3.5 w-3.5 mt-1 shrink-0 text-primary" />}
          <h3 className="font-bold leading-snug line-clamp-2 flex-1 group-hover:text-primary transition-colors">
            {n.title}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
          {n.message}
        </p>
        <div className="mt-auto flex items-center gap-2 flex-wrap pt-2 text-[11px] text-muted-foreground">
          <Badge
            variant="outline"
            className={`capitalize text-[10px] ${PRIORITY_TONE[n.priority] || ""}`}
          >
            {n.priority}
          </Badge>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(n.publish_at || n.created_at).toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          {n.created_by_name && <span className="truncate">· {n.created_by_name}</span>}
        </div>
      </div>
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="relative max-w-sm">
        <Megaphone className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search notices..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {pinned.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground">
            Pinned
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {pinned.map((n) => (
              <NoticeCard key={n.id} n={n} />
            ))}
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <div className="space-y-2">
          {pinned.length > 0 && (
            <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground">
              All notices
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {rest.map((n) => (
              <NoticeCard key={n.id} n={n} />
            ))}
          </div>
        </div>
      )}

      {!filtered.length && (
        <p className="text-sm text-muted-foreground text-center py-10">
          No notices match “{q}”.
        </p>
      )}

      <Dialog open={!!active} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle className="pr-6 leading-snug">{active.title}</DialogTitle>
              </DialogHeader>
              <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                <Badge
                  variant="outline"
                  className={`capitalize text-[10px] ${PRIORITY_TONE[active.priority] || ""}`}
                >
                  {active.priority}
                </Badge>
                <span>
                  {new Date(active.publish_at || active.created_at).toLocaleString()}
                </span>
                {active.created_by_name && <span>· {active.created_by_name}</span>}
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                {active.message}
              </p>
              {active.expires_at && (
                <p className="text-[11px] text-muted-foreground">
                  Valid until {new Date(active.expires_at).toLocaleDateString()}
                </p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}



/* ============ CALENDAR ============ */
export function CalendarPage() {
  return (
    <PortalShell title="School Calendar" subtitle="Events, exams & holidays">
      <CalBody />
    </PortalShell>
  );
}
function CalBody() {
  const { selected } = useSelectedChild();
  const { data: events = [] } = usePortalEvents(selected?.id);
  if (!events.length) return <EmptyState icon={CalendarDays} title="No events scheduled" />;
  const grouped: Record<string, typeof events> = {};
  events.forEach((e) => {
    const k = new Date(e.starts_at).toLocaleDateString(undefined, { month: "long", year: "numeric" });
    (grouped[k] = grouped[k] || []).push(e);
  });
  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([month, items]) => (
        <div key={month}>
          <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-2">{month}</p>
          <div className="space-y-2">
            {items.map((e) => (
              <Card key={e.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="text-center shrink-0 w-12">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">
                      {new Date(e.starts_at).toLocaleDateString(undefined, { month: "short" })}
                    </p>
                    <p className="text-xl font-black">{new Date(e.starts_at).getDate()}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate">{e.title}</p>
                    {e.location && <p className="text-xs text-muted-foreground">{e.location}</p>}
                  </div>
                  {e.category && <Badge variant="outline" className="capitalize">{e.category}</Badge>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============ LIBRARY (placeholder) ============ */
export function LibraryPage() {
  return (
    <PortalShell title="Library" subtitle="Borrowed books & due dates">
      <EmptyState icon={BookMarked} title="No active loans" description="When your child borrows books, they will appear here." />
    </PortalShell>
  );
}

/* ============ TRANSPORT (placeholder) ============ */
export function TransportPage() {
  return (
    <PortalShell title="Transport" subtitle="Route & vehicle details">
      <EmptyState icon={Bus} title="No transport assigned" description="If your child is enrolled for school transport, route details will appear here." />
    </PortalShell>
  );
}

/* ============ DOWNLOADS ============ */
export function DownloadsPage() {
  return (
    <PortalShell title="Downloads" subtitle="Report cards, statements & documents">
      <DownloadsBody />
    </PortalShell>
  );
}
function DownloadsBody() {
  const { selected } = useSelectedChild();
  const { data: cards = [] } = usePortalReportCards(selected?.id);
  if (!cards.length) return <EmptyState icon={Download} title="Nothing to download yet" />;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {cards.map((c) => (
        <Card key={c.id}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><FileText className="h-5 w-5" /></div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold truncate">{c.assessment_name}</p>
              <p className="text-xs text-muted-foreground">Report Card · {new Date(c.published_at).toLocaleDateString()}</p>
            </div>
            <Button asChild size="sm" variant="outline">
              <a href={`/portal/parent/children/${selected?.id}?report=${c.id}`}><Download className="h-4 w-4" /></a>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ============ SETTINGS ============ */
export function SettingsPage() {
  return (
    <PortalShell title="Settings" subtitle="Manage your account & preferences">
      <SettingsBody />
    </PortalShell>
  );
}
function SettingsBody() {
  const { data: acc } = usePortalAccount();
  const update = useUpdatePortalAccount();
  const changePin = useChangePortalPin();
  const [email, setEmail] = useState(acc?.email || "");
  const [phone, setPhone] = useState(acc?.phone || "");
  const [newPin, setNewPin] = useState("");

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4 text-primary" />
            <p className="text-sm font-black">Profile</p>
          </div>
          <div className="space-y-1.5"><Label>Identifier</Label><Input value={acc?.identifier || ""} disabled /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></div>
          <div className="space-y-1.5"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXXXXXXX" /></div>
          <Button
            onClick={async () => {
              try { await update.mutateAsync({ email, phone }); toast({ title: "Profile updated" }); }
              catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
            }}
            disabled={update.isPending}
          >Save Changes</Button>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5 space-y-4">
          <p className="text-sm font-black">Change PIN</p>
          <div className="space-y-1.5"><Label>New PIN</Label><Input type="password" maxLength={6} value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))} placeholder="••••" /></div>
          <Button
            disabled={newPin.length < 4 || changePin.isPending}
            onClick={async () => {
              try { await changePin.mutateAsync(newPin); setNewPin(""); toast({ title: "PIN changed" }); }
              catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
            }}
          >Update PIN</Button>
        </CardContent>
      </Card>
    </div>
  );
}