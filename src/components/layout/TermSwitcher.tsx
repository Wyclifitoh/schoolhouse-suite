import { useState } from "react";
import { useTerm, type Term } from "@/contexts/TermContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, AlertCircle, ShieldAlert, Info } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface TermSwitcherProps {
  /** Compact = top-header style; otherwise sidebar style */
  compact?: boolean;
}

export function TermSwitcher({ compact = false }: TermSwitcherProps) {
  const { selectedTerm, terms, switchTerm, isViewingCurrentTerm, currentTerm } = useTerm();
  const [pendingTerm, setPendingTerm] = useState<Term | null>(null);
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  if (terms.length === 0) return null;

  const handleSelect = (termId: string) => {
    if (termId === selectedTerm?.id) return;
    const target = terms.find(t => t.id === termId);
    if (!target) return;
    setPendingTerm(target);
    setPassword("");
    setAcknowledged(false);
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
      setAcknowledged(false);
    } catch (err: any) {
      toast.error(err?.message || "Incorrect password");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <>
      {compact ? (
        <div className="flex items-center gap-2">
          <Select value={selectedTerm?.id || ""} onValueChange={handleSelect}>
            <SelectTrigger className="h-9 w-[170px] text-xs rounded-lg border-border/60 bg-card">
              <Calendar className="h-3.5 w-3.5 mr-1.5 shrink-0 text-primary" />
              <SelectValue placeholder="Select Term" />
            </SelectTrigger>
            <SelectContent align="end">
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
            <Badge variant="outline" className="hidden md:inline-flex h-7 gap-1 text-[10px] text-warning border-warning/30">
              <AlertCircle className="h-3 w-3" /> Past term
            </Badge>
          )}
        </div>
      ) : (
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
      )}

      <Dialog open={!!pendingTerm} onOpenChange={(o) => { if (!o) { setPendingTerm(null); setPassword(""); setAcknowledged(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-warning" />
              Confirm Term Switch
            </DialogTitle>
            <DialogDescription>
              You are about to switch the entire system to <strong>{pendingTerm?.name}</strong>.
              All modules — students, fees, attendance, exams and reports — will display data for this term.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 space-y-2">
              <div className="flex items-center gap-2 text-warning font-semibold text-sm">
                <Info className="h-4 w-4" /> Before you switch — please check
              </div>
              <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
                <li>All students who should advance to the next term must already be promoted in <strong>Students → Promotion</strong>.</li>
                <li>Fees for the current term should be assigned and any pending term-closing entries finalized.</li>
                <li>Attendance and exam records for the term you are leaving should be saved.</li>
                <li>You can switch back to any term at any time — historical data is preserved.</li>
              </ul>
              <label className="flex items-start gap-2 text-xs cursor-pointer pt-1">
                <input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} className="mt-0.5" />
                <span>I have promoted students and reviewed term-closing tasks.</span>
              </label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="term-switch-pwd">Your Password</Label>
              <Input
                id="term-switch-pwd"
                type="password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && acknowledged) confirmSwitch(); }}
                placeholder="Enter your account password"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setPendingTerm(null); setPassword(""); setAcknowledged(false); }} disabled={verifying}>
              Cancel
            </Button>
            <Button onClick={confirmSwitch} disabled={verifying || !password || !acknowledged}>
              {verifying ? "Verifying..." : "Confirm Switch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
