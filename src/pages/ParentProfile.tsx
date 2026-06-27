import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState, useMemo } from "react";
import { PermissionGate } from "@/components/PermissionGate";
import {
  useParentWithChildren,
  useParentPortalAccount,
  useParentChildren,
  useUnlinkStudentsFromParent,
  useTransferStudentsToParent,
  useParents,
  useCreatePortalAccount,
  useResetPortalPin,
  useTogglePortalAccount,
} from "@/hooks/useParents";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  IdCard,
  KeyRound,
  UserPlus,
  Power,
  ShieldCheck,
  ShieldOff,
  User,
  Unlink2,
  ArrowRightLeft,
  AlertTriangle,
  Check,
  ChevronsUpDown,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ParentProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: parent, isLoading } = useParentWithChildren(id);
  const { data: account } = useParentPortalAccount(id);
  const { data: childrenResp } = useParentChildren(id);
  const createAcct = useCreatePortalAccount();
  const resetPin = useResetPortalPin();
  const toggleAcct = useTogglePortalAccount();
  const unlinkMut = useUnlinkStudentsFromParent();
  const transferMut = useTransferStudentsToParent();

  const p: any = (parent as any)?.data ?? parent;
  const cr: any = (childrenResp as any)?.data ?? childrenResp;
  const children: any[] = cr?.children?.length
    ? cr.children
    : p?.children || [];
  const childCount: number = cr?.count ?? children.length;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [unlinkOpen, setUnlinkOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  const allChecked = children.length > 0 && selected.size === children.length;
  const toggleAll = () =>
    setSelected(
      allChecked ? new Set() : new Set(children.map((c: any) => c.id)),
    );
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  return (
    <DashboardLayout
      title="Parent Profile"
      subtitle="View parent details and linked students"
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/parents")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Parents
      </Button>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : !p ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Parent not found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardContent className="pt-6 text-center">
              <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                {p.first_name?.[0]}
                {p.last_name?.[0]}
              </div>
              <h2 className="mt-3 text-xl font-bold">
                {p.first_name} {p.last_name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {p.occupation || "Parent / Guardian"}
              </p>
              <div className="mt-4 space-y-2 text-sm text-left">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {p.phone}
                </div>
                {p.alt_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {p.alt_phone}
                  </div>
                )}
                {p.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {p.email}
                  </div>
                )}
                {p.id_number && (
                  <div className="flex items-center gap-2">
                    <IdCard className="h-4 w-4 text-muted-foreground" />
                    {p.id_number}
                  </div>
                )}
                {p.employer && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    {p.employer}
                  </div>
                )}
                {p.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="flex-1">{p.address}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <PermissionGate role={["super_admin", "admin", "school_admin"]}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-primary" /> Portal Account
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {account ? (
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {account.is_active ? (
                            <Badge className="bg-success/15 text-success border-0">
                              <ShieldCheck className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <ShieldOff className="h-3 w-3 mr-1" />
                              Disabled
                            </Badge>
                          )}
                          {account.must_change_pin ? (
                            <Badge variant="outline">Must change PIN</Badge>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
                          {account.identifier}
                        </p>
                        {account.last_login_at && (
                          <p className="text-xs text-muted-foreground">
                            Last login:{" "}
                            {new Date(account.last_login_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resetPin.mutate(p.id)}
                        >
                          <KeyRound className="h-3.5 w-3.5 mr-1.5" /> Reset PIN
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleAcct.mutate(p.id)}
                        >
                          <Power className="h-3.5 w-3.5 mr-1.5" />{" "}
                          {account.is_active ? "Disable" : "Enable"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <p className="text-sm text-muted-foreground">
                        No portal account yet. Create one so the parent can log
                        in at <code>/userLogin</code>.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => createAcct.mutate(p.id)}
                        disabled={createAcct.isPending}
                      >
                        <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Create
                        Account
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </PermissionGate>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" /> Linked Students (
                    {childCount})
                  </CardTitle>
                  {selected.size > 0 && (
                    <PermissionGate
                      role={["super_admin", "admin", "school_admin"]}
                    >
                      <div className="flex gap-2">
                        <Badge variant="secondary">
                          {selected.size} selected
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setTransferOpen(true)}
                        >
                          <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />{" "}
                          Transfer
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setUnlinkOpen(true)}
                        >
                          <Unlink2 className="h-3.5 w-3.5 mr-1.5" /> Unlink
                        </Button>
                      </div>
                    </PermissionGate>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {children.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-6 text-center">
                    No linked students.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-10">
                          <Checkbox
                            checked={allChecked}
                            onCheckedChange={toggleAll}
                            aria-label="Select all"
                          />
                        </TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Adm #</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Relationship</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {children.map((c: any) => (
                        <TableRow
                          key={c.id}
                          className={cn(
                            "hover:bg-muted/30",
                            selected.has(c.id) && "bg-primary/5",
                          )}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selected.has(c.id)}
                              onCheckedChange={() => toggleOne(c.id)}
                              aria-label="Select student"
                            />
                          </TableCell>
                          <TableCell
                            className="font-medium cursor-pointer"
                            onClick={() => navigate(`/students/${c.id}`)}
                          >
                            {c.full_name || `${c.first_name} ${c.last_name}`}
                            {c.is_primary_contact ? (
                              <Badge
                                variant="outline"
                                className="ml-2 text-[10px] gap-1"
                              >
                                <Crown className="h-2.5 w-2.5" /> Primary
                              </Badge>
                            ) : null}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {c.admission_number}
                          </TableCell>
                          <TableCell>
                            {c.grade || "—"} {c.stream ? `· ${c.stream}` : ""}
                          </TableCell>
                          <TableCell className="capitalize">
                            {c.relationship}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                c.status === "active" ? "default" : "secondary"
                              }
                            >
                              {c.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── Unlink confirmation ─────────────────────────────── */}
      <UnlinkDialog
        open={unlinkOpen}
        onClose={() => setUnlinkOpen(false)}
        count={selected.size}
        loading={unlinkMut.isPending}
        onConfirm={async () => {
          if (!id) return;
          await unlinkMut.mutateAsync({
            parentId: id,
            studentIds: selectedIds,
          });
          setSelected(new Set());
          setUnlinkOpen(false);
        }}
      />

      {/* ── Transfer dialog ─────────────────────────────────── */}
      <TransferDialog
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        count={selected.size}
        loading={transferMut.isPending}
        currentParentId={id || ""}
        onConfirm={async ({ targetId, relationship, keepPrimary }) => {
          if (!id) return;
          await transferMut.mutateAsync({
            parentId: id,
            studentIds: selectedIds,
            targetParentId: targetId,
            relationship,
            keepPrimary,
          });
          setSelected(new Set());
          setTransferOpen(false);
        }}
      />
    </DashboardLayout>
  );
};

export default ParentProfile;

/* ───────────────────────── Unlink dialog ───────────────────────── */
function UnlinkDialog({
  open,
  onClose,
  count,
  onConfirm,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  count: number;
  onConfirm: () => void;
  loading: boolean;
}) {
  const [confirm, setConfirm] = useState("");
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" /> Unlink{" "}
            {count} student{count === 1 ? "" : "s"}?
          </DialogTitle>
          <DialogDescription>
            This removes this parent's link to the selected student(s). If this
            parent was the
            <strong> primary guardian</strong>, another linked guardian (mother
            → father → guardian) is automatically promoted. Students with no
            other guardian will be left without a primary contact.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label className="text-xs">
            Type <span className="font-mono font-bold">UNLINK</span> to confirm
          </Label>
          <Input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="UNLINK"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setConfirm("");
              onConfirm();
            }}
            disabled={loading || confirm !== "UNLINK"}
          >
            {loading ? "Unlinking…" : `Unlink ${count}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ───────────────────────── Transfer dialog ─────────────────────── */
function TransferDialog({
  open,
  onClose,
  count,
  currentParentId,
  onConfirm,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  count: number;
  currentParentId: string;
  loading: boolean;
  onConfirm: (v: {
    targetId: string;
    relationship: "father" | "mother" | "guardian" | "other";
    keepPrimary: boolean;
  }) => void;
}) {
  const [search, setSearch] = useState("");
  const [targetId, setTargetId] = useState("");
  const [targetLabel, setTargetLabel] = useState("");
  const [relationship, setRelationship] = useState<
    "father" | "mother" | "guardian" | "other"
  >("father");
  const [keepPrimary, setKeepPrimary] = useState(true);
  const [openCmd, setOpenCmd] = useState(false);
  const { data: parents = [] } = useParents(search);
  const filtered = (parents as any[])
    .filter((p) => p.id !== currentParentId)
    .slice(0, 50);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" /> Transfer {count}{" "}
            student{count === 1 ? "" : "s"}
          </DialogTitle>
          <DialogDescription>
            Move the selected student(s) from this guardian to a different one.
            The old link is removed and a new guardian is auto-promoted to
            primary on each student if needed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Target guardian</Label>
            <Popover open={openCmd} onOpenChange={setOpenCmd}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between font-normal"
                >
                  {targetLabel || "Search a parent by name or phone…"}
                  <ChevronsUpDown className="h-4 w-4 opacity-50 ml-2" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0"
                align="start"
              >
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Search…"
                    value={search}
                    onValueChange={setSearch}
                  />
                  <CommandList>
                    <CommandEmpty>No parents found</CommandEmpty>
                    <CommandGroup>
                      {filtered.map((p: any) => (
                        <CommandItem
                          key={p.id}
                          value={p.id}
                          onSelect={() => {
                            setTargetId(p.id);
                            setTargetLabel(
                              `${p.first_name} ${p.last_name} · ${p.phone}`,
                            );
                            setOpenCmd(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "h-4 w-4 mr-2",
                              targetId === p.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <div>
                            <div className="font-medium">
                              {p.first_name} {p.last_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {p.phone} {p.email ? `· ${p.email}` : ""}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Relationship for new guardian</Label>
              <Select
                value={relationship}
                onValueChange={(v: any) => setRelationship(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="father">Father</SelectItem>
                  <SelectItem value="mother">Mother</SelectItem>
                  <SelectItem value="guardian">Guardian</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Primary contact</Label>
              <Select
                value={keepPrimary ? "yes" : "no"}
                onValueChange={(v) => setKeepPrimary(v === "yes")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">
                    Make target primary (recommended)
                  </SelectItem>
                  <SelectItem value="no">Don't change primary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm({ targetId, relationship, keepPrimary })}
            disabled={loading || !targetId}
          >
            {loading ? "Transferring…" : `Transfer ${count}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
