/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { useStudents } from "@/hooks/useStudents";
import {
  useSponsorshipGroup,
  useSponsorshipGroups,
  useSponsorshipGroupMutations,
} from "@/hooks/useSponsorshipGroups";

const formatKES = (n: number) => `KES ${Number(n || 0).toLocaleString()}`;

function GroupDialog({
  groupId,
  open,
  onOpenChange,
}: {
  groupId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: group } = useSponsorshipGroup(open ? groupId : null);
  const { create, update, setMembers } = useSponsorshipGroupMutations();

  const [name, setName] = useState("");
  const [sponsor, setSponsor] = useState("");
  const [contact, setContact] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<Record<string, string>>({}); // studentId -> amount

  const { data: students = [] } = useStudents({ search });

  useEffect(() => {
    if (!open) return;
    if (groupId && group) {
      setName(group.name || "");
      setSponsor(group.sponsor_name || "");
      setContact(group.sponsor_contact || "");
      setDescription(group.description || "");
      const next: Record<string, string> = {};
      (group.members || []).forEach((m) => {
        next[m.student_id] = String(m.default_amount ?? "");
      });
      setPicked(next);
    } else if (!groupId) {
      setName(""); setSponsor(""); setContact(""); setDescription(""); setPicked({});
    }
  }, [open, groupId, group]);

  const memberIds = useMemo(() => Object.keys(picked), [picked]);
  const total = useMemo(
    () => memberIds.reduce((s, id) => s + Number(picked[id] || 0), 0),
    [memberIds, picked],
  );

  // Show picked students that the current search does not return, so selections
  // are never silently lost while filtering.
  const rows = useMemo(() => {
    const byId = new Map<string, any>();
    (students as any[]).forEach((s) => byId.set(s.id, s));
    (group?.members || []).forEach((m) => {
      if (!byId.has(m.student_id))
        byId.set(m.student_id, {
          id: m.student_id,
          full_name: m.student_name,
          admission_number: m.admission_number,
        });
    });
    return Array.from(byId.values());
  }, [students, group]);

  const toggle = (id: string, on: boolean) =>
    setPicked((prev) => {
      const next = { ...prev };
      if (on) next[id] = next[id] ?? "";
      else delete next[id];
      return next;
    });

  const submit = async () => {
    if (!name.trim()) return toast.error("Group name is required");
    const members = memberIds.map((id) => ({
      student_id: id,
      default_amount: picked[id] === "" ? null : Number(picked[id]),
    }));
    try {
      if (groupId) {
        await update.mutateAsync({
          id: groupId,
          name,
          sponsor_name: sponsor || null,
          sponsor_contact: contact || null,
          description: description || null,
        });
        await setMembers.mutateAsync({ id: groupId, members });
        toast.success("Group updated");
      } else {
        await create.mutateAsync({
          name,
          sponsor_name: sponsor || null,
          sponsor_contact: contact || null,
          description: description || null,
          members,
        });
        toast.success("Group created");
      }
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Failed to save group");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{groupId ? "Edit Sponsorship Group" : "New Sponsorship Group"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Group Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Equity Wings To Fly 2026" />
            </div>
            <div className="space-y-2">
              <Label>Sponsor</Label>
              <Input value={sponsor} onChange={(e) => setSponsor(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Sponsor Contact</Label>
              <Input value={contact} onChange={(e) => setContact(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Description</Label>
              <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Members ({memberIds.length})</Label>
              <span className="text-sm text-muted-foreground">
                Default total: <b>{formatKES(total)}</b>
              </span>
            </div>
            <Input
              placeholder="Search students by name or admission no…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="border rounded max-h-[320px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>Student</TableHead>
                    <TableHead>Adm No</TableHead>
                    <TableHead className="text-right w-40">Default Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 300).map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <Checkbox
                          checked={s.id in picked}
                          onCheckedChange={(v) => toggle(s.id, !!v)}
                        />
                      </TableCell>
                      <TableCell>{s.full_name}</TableCell>
                      <TableCell>{s.admission_number}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min={0}
                          className="w-32 ml-auto text-right"
                          disabled={!(s.id in picked)}
                          value={picked[s.id] ?? ""}
                          onChange={(e) =>
                            setPicked((p) => ({ ...p, [s.id]: e.target.value }))
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending || update.isPending}>
            {create.isPending || update.isPending ? "Saving…" : "Save Group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SponsorshipGroups() {
  const { data: groups = [], isLoading } = useSponsorshipGroups();
  const { remove } = useSponsorshipGroupMutations();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" /> Sponsorship Groups
        </CardTitle>
        <Button size="sm" onClick={() => { setEditId(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> New Group
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Group</TableHead>
              <TableHead>Sponsor</TableHead>
              <TableHead className="text-right">Students</TableHead>
              <TableHead className="text-right">Default Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Loading…</TableCell></TableRow>
            ) : groups.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                No groups yet. Create a group and assign the students it sponsors.
              </TableCell></TableRow>
            ) : groups.map((g) => (
              <TableRow key={g.id}>
                <TableCell className="font-medium">{g.name}</TableCell>
                <TableCell>{g.sponsor_name || "—"}</TableCell>
                <TableCell className="text-right">{g.member_count ?? 0}</TableCell>
                <TableCell className="text-right">{formatKES(Number(g.default_total || 0))}</TableCell>
                <TableCell>
                  <Badge variant={g.is_active === 0 ? "secondary" : "default"}>
                    {g.is_active === 0 ? "inactive" : "active"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="sm" variant="outline" onClick={() => { setEditId(g.id); setOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      remove.mutate(g.id, {
                        onSuccess: () => toast.success("Group deleted"),
                        onError: (e: any) => toast.error(e?.message || "Failed"),
                      })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <GroupDialog groupId={editId} open={open} onOpenChange={setOpen} />
    </Card>
  );
}

export default SponsorshipGroups;
