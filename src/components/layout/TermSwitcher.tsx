import { useState } from "react";
import { useTerm, type Term } from "@/contexts/TermContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, AlertCircle, ShieldAlert } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function TermSwitcher() {
  const { selectedTerm, terms, switchTerm, isViewingCurrentTerm, currentTerm } = useTerm();
  const [pendingTerm, setPendingTerm] = useState<Term | null>(null);
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);

  if (terms.length === 0) return null;

  const handleSelect = (termId: string) => {
    if (termId === selectedTerm?.id) return;
    const target = terms.find(t => t.id === termId);
    if (!target) return;
    setPendingTerm(target);
    setPassword("");
  };

  const confirmSwitch = async () => {
    if (!pendingTerm) return;
    if (!password) { toast.error("Enter your password to confirm"); return; }
    setVerifying(true);
    try {
      await api.post("/auth/verify-password", { password });
      switchTerm(pendingTerm.id);
      toast.success(`Switched to ${pendingTerm.name}`);
      setPendingTerm(null);
      setPassword("");
    } catch (err: any) {
      toast.error(err?.message || "Incorrect password");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <>
      <div className="mx-4 mb-2 px-1 space-y-1">
        <Select value={selectedTerm?.id || ""} onValueChange={handleSelect}>
          <SelectTrigger className="h-8 text-xs bg-sidebar-accent/50 border-sidebar-border/50 text-sidebar-accent-foreground rounded-lg">
            <Calendar className="h-3 w-3 mr-1.5 shrink-0" />
            <SelectValue placeholder="Select Term" />
          </SelectTrigger>
          <SelectContent>
            {terms.map(t => (
              <SelectItem key={t.id} value={t.id}>
                <span className="flex items-center gap-2">
                  {t.name}
                  {t.id === currentTerm?.id && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-success/10 text-success border-0">Current</Badge>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!isViewingCurrentTerm && selectedTerm && (
          <div className="flex items-center gap-1.5 px-1">
            <AlertCircle className="h-3 w-3 text-warning shrink-0" />
            <span className="text-[10px] text-warning font-medium">Viewing past term data</span>
          </div>
        )}
      </div>

      <Dialog open={!!pendingTerm} onOpenChange={(o) => { if (!o) { setPendingTerm(null); setPassword(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-warning" />
              Confirm Term Switch
            </DialogTitle>
            <DialogDescription>
              You are about to switch the entire system to <strong>{pendingTerm?.name}</strong>.
              All modules — students, fees, attendance, exams and reports — will display data
              for this term. You can switch back at any time. Enter your password to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="term-switch-pwd">Your Password</Label>
            <Input
              id="term-switch-pwd"
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") confirmSwitch(); }}
              placeholder="Enter your account password"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPendingTerm(null); setPassword(""); }} disabled={verifying}>
              Cancel
            </Button>
            <Button onClick={confirmSwitch} disabled={verifying || !password}>
              {verifying ? "Verifying..." : "Confirm Switch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
