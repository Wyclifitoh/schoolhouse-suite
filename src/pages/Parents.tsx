import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { parents } from "@/data/mockData";
import { Search, Plus, Download, Users, Phone, MoreHorizontal, Eye, Mail } from "lucide-react";

const Parents = () => {
  const [search, setSearch] = useState("");

  const filtered = parents.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search)
  );

  const activeCount = parents.filter((p) => p.status === "active").length;

  return (
    <DashboardLayout title="Parents" subtitle="Manage parent and guardian records">
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Parents</p>
              <p className="text-2xl font-bold text-foreground">{parents.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <Users className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-foreground">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
              <Phone className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">SMS Enabled</p>
              <p className="text-2xl font-bold text-foreground">{parents.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-base font-semibold">Parent Directory</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1.5" />
                Export
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add Parent
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add New Parent</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input placeholder="Full name" />
                      </div>
                      <div className="space-y-2">
                        <Label>ID Number</Label>
                        <Input placeholder="National ID" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input placeholder="0712345678" />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input placeholder="email@example.com" type="email" />
                      </div>
                    </div>
                    <Button className="w-full mt-2">Register Parent</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-xs mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone..."
              className="pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Parent</TableHead>
                  <TableHead className="font-semibold">Phone</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">ID Number</TableHead>
                  <TableHead className="font-semibold">Children</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                          {p.full_name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <p className="font-medium text-foreground">{p.full_name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{p.phone}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{p.email}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{p.id_number}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        {p.children.map((c) => (
                          <span key={c} className="text-sm text-foreground">{c}</span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={p.status === "active" ? "default" : "secondary"}
                        className={p.status === "active" ? "bg-success/10 text-success border-0 hover:bg-success/20" : ""}
                      >
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />View Profile</DropdownMenuItem>
                          <DropdownMenuItem><Mail className="h-4 w-4 mr-2" />Send SMS</DropdownMenuItem>
                          <DropdownMenuItem>Edit Details</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {filtered.length} of {parents.length} parents
            </p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Parents;
