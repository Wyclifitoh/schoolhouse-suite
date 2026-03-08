import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { useParents, useCreateParent } from "@/hooks/useParents";
import { Search, Plus, Download, Users, Phone, MoreHorizontal, Eye, Mail } from "lucide-react";

const Parents = () => {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "", email: "", id_number: "" });

  const { data: parentsList = [], isLoading } = useParents(search);
  const createParent = useCreateParent();

  const handleCreate = () => {
    if (!form.first_name || !form.last_name || !form.phone) return;
    createParent.mutate(form, {
      onSuccess: () => {
        setShowAdd(false);
        setForm({ first_name: "", last_name: "", phone: "", email: "", id_number: "" });
      },
    });
  };

  return (
    <DashboardLayout title="Parents" subtitle="Manage parent and guardian records">
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Total Parents</p>
              {isLoading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold text-foreground">{parentsList.length}</p>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10"><Users className="h-5 w-5 text-success" /></div>
            <div>
              <p className="text-sm text-muted-foreground">With Accounts</p>
              {isLoading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold text-foreground">{parentsList.filter((p: any) => p.user_id).length}</p>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10"><Phone className="h-5 w-5 text-info" /></div>
            <div>
              <p className="text-sm text-muted-foreground">SMS Enabled</p>
              {isLoading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold text-foreground">{parentsList.filter((p: any) => p.phone).length}</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-base font-semibold">Parent Directory</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
              <Dialog open={showAdd} onOpenChange={setShowAdd}>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add Parent</Button></DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader><DialogTitle>Add New Parent</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>First Name</Label><Input value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} /></div>
                      <div className="space-y-2"><Label>Last Name</Label><Input value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Phone Number</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="0712345678" /></div>
                      <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} type="email" /></div>
                    </div>
                    <div className="space-y-2"><Label>ID Number</Label><Input value={form.id_number} onChange={e => setForm({...form, id_number: e.target.value})} /></div>
                    <Button className="w-full mt-2" onClick={handleCreate} disabled={createParent.isPending}>
                      {createParent.isPending ? "Registering..." : "Register Parent"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-xs mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or phone..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Parent</TableHead>
                  <TableHead className="font-semibold">Phone</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">ID Number</TableHead>
                  <TableHead className="font-semibold">Occupation</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [1,2,3].map(i => (
                    <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                  ))
                ) : parentsList.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No parents found</TableCell></TableRow>
                ) : (
                  parentsList.map((p: any) => (
                    <TableRow key={p.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                            {p.first_name?.[0]}{p.last_name?.[0]}
                          </div>
                          <p className="font-medium text-foreground">{p.first_name} {p.last_name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">{p.phone}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{p.email || "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{p.id_number || "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{p.occupation || "—"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />View Profile</DropdownMenuItem>
                            <DropdownMenuItem><Mail className="h-4 w-4 mr-2" />Send SMS</DropdownMenuItem>
                            <DropdownMenuItem>Edit Details</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">Showing {parentsList.length} parents</p>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Parents;
