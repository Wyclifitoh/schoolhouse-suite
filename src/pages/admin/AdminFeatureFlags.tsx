import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ToggleRight, Search, ShieldCheck } from "lucide-react";
import {
  KNOWN_MODULES,
  useAllEntitlements,
  useSetSchoolEntitlements,
  useBulkEntitlements,
  useAudit,
  type EntitlementRow,
} from "@/hooks/usePlatform";
import { toast } from "@/hooks/use-toast";

const MODULE_LABELS: Record<string, string> = {
  assessments: "Assessments",
  finance: "Finance",
  inventory: "Inventory",
  hr: "HR & Payroll",
  communication: "Communication",
  portal: "Parent Portal",
};

export default function AdminFeatureFlags() {
  const { data, isLoading } = useAllEntitlements();
  const setOne = useSetSchoolEntitlements();
  const bulk = useBulkEntitlements();
  const { data: audit } = useAudit();

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkModule, setBulkModule] = useState<string>("finance");

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data || []).filter((r) =>
      !q ? true : r.name?.toLowerCase().includes(q),
    );
  }, [data, search]);

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.school_id));

  const toggleModule = (row: EntitlementRow, mod: string, on: boolean) => {
    const next = new Set(row.modules);
    if (on) next.add(mod);
    else next.delete(mod);
    setOne.mutate(
      { schoolId: row.school_id, modules: [...next] },
      {
        onSuccess: () =>
          toast({
            title: on ? "Module enabled" : "Module disabled",
            description: `${MODULE_LABELS[mod]} for ${row.name}`,
          }),
        onError: (e: any) =>
          toast({ title: "Failed", description: e.message, variant: "destructive" }),
      },
    );
  };

  const runBulk = (op: "add" | "remove") => {
    if (!selected.size) return;
    bulk.mutate(
      {
        school_ids: [...selected],
        add: op === "add" ? [bulkModule] : [],
        remove: op === "remove" ? [bulkModule] : [],
      },
      {
        onSuccess: () => {
          toast({
            title: op === "add" ? "Modules enabled" : "Modules disabled",
            description: `${MODULE_LABELS[bulkModule]} • ${selected.size} school(s)`,
          });
          setSelected(new Set());
        },
        onError: (e: any) =>
          toast({ title: "Bulk failed", description: e.message, variant: "destructive" }),
      },
    );
  };

  const history = useMemo(
    () =>
      (audit || [])
        .filter((a: any) =>
          ["entitlements.update", "entitlements.bulk"].includes(a.action),
        )
        .slice(0, 25),
    [audit],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 text-primary p-2">
          <ToggleRight className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Feature Flags</h1>
          <p className="text-sm text-muted-foreground">
            Per-school module entitlements with bulk actions and change history.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">Schools × Modules</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8 h-9 w-64"
                placeholder="Search school…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
              <span className="text-sm font-medium">
                {selected.size} selected
              </span>
              <span className="text-muted-foreground text-sm">•</span>
              <Select value={bulkModule} onValueChange={setBulkModule}>
                <SelectTrigger className="h-8 w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KNOWN_MODULES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {MODULE_LABELS[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={() => runBulk("add")}
                disabled={bulk.isPending}
              >
                Enable
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => runBulk("remove")}
                disabled={bulk.isPending}
              >
                Disable
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelected(new Set())}
              >
                Clear
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={(v) => {
                          if (v) setSelected(new Set(rows.map((r) => r.school_id)));
                          else setSelected(new Set());
                        }}
                      />
                    </TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    {KNOWN_MODULES.map((m) => (
                      <TableHead key={m} className="text-center">
                        {MODULE_LABELS[m]}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.school_id}>
                      <TableCell>
                        <Checkbox
                          checked={selected.has(r.school_id)}
                          onCheckedChange={(v) => {
                            setSelected((prev) => {
                              const next = new Set(prev);
                              if (v) next.add(r.school_id);
                              else next.delete(r.school_id);
                              return next;
                            });
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.plan_name || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {r.sub_status || "no_sub"}
                        </Badge>
                      </TableCell>
                      {KNOWN_MODULES.map((m) => (
                        <TableCell key={m} className="text-center">
                          <Switch
                            checked={r.modules?.includes(m) || false}
                            onCheckedChange={(v) => toggleModule(r, m, v)}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {!rows.length && (
                    <TableRow>
                      <TableCell
                        colSpan={4 + KNOWN_MODULES.length}
                        className="text-center py-10 text-muted-foreground"
                      >
                        No schools match your search.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" /> Change history
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              No entitlement changes yet.
            </div>
          ) : (
            <div className="divide-y">
              {history.map((h: any) => (
                <div key={h.id} className="py-2 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">
                      {h.action === "entitlements.bulk"
                        ? "Bulk update"
                        : "Per-school update"}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {h.actor_email} • {new Date(h.created_at).toLocaleString()}
                    </div>
                    {h.payload && (
                      <div className="text-xs text-muted-foreground mt-1 font-mono">
                        {typeof h.payload === "string" ? h.payload : JSON.stringify(h.payload)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}