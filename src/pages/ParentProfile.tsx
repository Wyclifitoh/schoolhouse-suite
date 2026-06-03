import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PermissionGate } from "@/components/PermissionGate";
import {
  useParentWithChildren, useParentPortalAccount,
  useCreatePortalAccount, useResetPortalPin, useTogglePortalAccount,
} from "@/hooks/useParents";
import {
  ArrowLeft, Mail, Phone, MapPin, Briefcase, IdCard,
  KeyRound, UserPlus, Power, ShieldCheck, ShieldOff, User,
} from "lucide-react";

const ParentProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: parent, isLoading } = useParentWithChildren(id);
  const { data: account } = useParentPortalAccount(id);
  const createAcct = useCreatePortalAccount();
  const resetPin = useResetPortalPin();
  const toggleAcct = useTogglePortalAccount();

  const p: any = (parent as any)?.data ?? parent;
  const children = p?.children || [];

  return (
    <DashboardLayout title="Parent Profile" subtitle="View parent details and linked students">
      <Button variant="ghost" size="sm" onClick={() => navigate("/parents")} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Parents
      </Button>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : !p ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">Parent not found</CardContent></Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardContent className="pt-6 text-center">
              <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                {p.first_name?.[0]}{p.last_name?.[0]}
              </div>
              <h2 className="mt-3 text-xl font-bold">{p.first_name} {p.last_name}</h2>
              <p className="text-sm text-muted-foreground">{p.occupation || "Parent / Guardian"}</p>
              <div className="mt-4 space-y-2 text-sm text-left">
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{p.phone}</div>
                {p.alt_phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{p.alt_phone}</div>}
                {p.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{p.email}</div>}
                {p.id_number && <div className="flex items-center gap-2"><IdCard className="h-4 w-4 text-muted-foreground" />{p.id_number}</div>}
                {p.employer && <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-muted-foreground" />{p.employer}</div>}
                {p.address && <div className="flex items-start gap-2"><MapPin className="h-4 w-4 text-muted-foreground mt-0.5" /><span className="flex-1">{p.address}</span></div>}
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
                            <Badge className="bg-success/15 text-success border-0"><ShieldCheck className="h-3 w-3 mr-1" />Active</Badge>
                          ) : (
                            <Badge variant="destructive"><ShieldOff className="h-3 w-3 mr-1" />Disabled</Badge>
                          )}
                          {account.must_change_pin ? <Badge variant="outline">Must change PIN</Badge> : null}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">{account.identifier}</p>
                        {account.last_login_at && (
                          <p className="text-xs text-muted-foreground">Last login: {new Date(account.last_login_at).toLocaleString()}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => resetPin.mutate(p.id)}>
                          <KeyRound className="h-3.5 w-3.5 mr-1.5" /> Reset PIN
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => toggleAcct.mutate(p.id)}>
                          <Power className="h-3.5 w-3.5 mr-1.5" /> {account.is_active ? "Disable" : "Enable"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <p className="text-sm text-muted-foreground">No portal account yet. Create one so the parent can log in at <code>/userLogin</code>.</p>
                      <Button size="sm" onClick={() => createAcct.mutate(p.id)} disabled={createAcct.isPending}>
                        <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Create Account
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </PermissionGate>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" /> Linked Students ({children.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {children.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-6 text-center">No linked students.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
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
                          className="cursor-pointer hover:bg-muted/30"
                          onClick={() => navigate(`/students/${c.id}`)}
                        >
                          <TableCell className="font-medium">{c.full_name || `${c.first_name} ${c.last_name}`}</TableCell>
                          <TableCell className="font-mono text-xs">{c.admission_number}</TableCell>
                          <TableCell>{c.grade || "—"} {c.stream ? `· ${c.stream}` : ""}</TableCell>
                          <TableCell className="capitalize">
                            {c.relationship}
                            {c.is_primary_contact ? <Badge variant="outline" className="ml-2 text-[10px]">Primary</Badge> : null}
                          </TableCell>
                          <TableCell><Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status}</Badge></TableCell>
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
    </DashboardLayout>
  );
};

export default ParentProfile;
