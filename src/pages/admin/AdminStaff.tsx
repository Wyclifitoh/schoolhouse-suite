import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { usePlatformStaff, useCreateStaff } from "@/hooks/usePlatform";
import { toast } from "@/hooks/use-toast";

export default function AdminStaff() {
  const { data = [], isLoading } = usePlatformStaff();
  const create = useCreateStaff();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ email: "", full_name: "", password: "", role: "platform_support" });

  return (
    <div className="p-6 space-y-6 max-w-[1100px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">Platform staff</h1>
          <p className="text-muted-foreground">Internal CHUO accounts with access to this console.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Invite staff</Button>
      </div>
      <Card><CardContent className="p-0 overflow-x-auto">
        {isLoading ? <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground border-b bg-muted/30">
              <tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Active</th><th className="p-3">Last login</th></tr>
            </thead>
            <tbody>
              {data.map((u: any) => (
                <tr key={u.id} className="border-b">
                  <td className="p-3 font-medium">{u.full_name}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3"><span className="text-xs uppercase font-bold">{u.role}</span></td>
                  <td className="p-3">{u.is_active ? "yes" : "no"}</td>
                  <td className="p-3 text-xs">{u.last_login_at ? new Date(u.last_login_at).toLocaleString() : "never"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invite platform staff</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Full name</Label><Input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></div>
            <div><Label>Email</Label><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
            <div><Label>Temporary password</Label><Input type="text" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
            <div><Label>Role</Label>
              <Select value={f.role} onValueChange={(v) => setF({ ...f, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="platform_support">Support</SelectItem>
                  <SelectItem value="platform_admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              try { await create.mutateAsync(f); toast({ title: "Staff invited" }); setOpen(false); setF({ email: "", full_name: "", password: "", role: "platform_support" }); }
              catch (e: any) { toast({ title: "Failed", description: e.message, variant: "destructive" }); }
            }}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}