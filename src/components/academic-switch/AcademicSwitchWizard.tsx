import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Check, AlertTriangle, XCircle, Loader2, ArrowRight, ArrowLeft,
  ShieldAlert, CalendarClock, FileCheck, Users, Play, PartyPopper,
} from "lucide-react";
import { useTerm } from "@/contexts/TermContext";
import { api } from "@/lib/api";
import { toast } from "sonner";

type Status = "pass" | "warning" | "error";
interface ReadinessCheck { category: string; label: string; status: Status; detail: string | null }

const STEPS = [
  { id: 1, label: "Destination", icon: CalendarClock },
  { id: 2, label: "Readiness", icon: FileCheck },
  { id: 3, label: "Carry Forward", icon: Users },
  { id: 4, label: "Summary", icon: ShieldAlert },
  { id: 5, label: "Execute", icon: Play },
];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function AcademicSwitchWizard({ open, onOpenChange }: Props) {
  const {
    terms, academicYears, currentTerm, currentAcademicYear,
  } = useTerm();

  const [step, setStep] = useState(1);

  // Destination
  const [toYearId, setToYearId] = useState<string>("");
  const [toTermId, setToTermId] = useState<string>("");

  // Readiness
  const [checks, setChecks] = useState<ReadinessCheck[]>([]);
  const [canProceed, setCanProceed] = useState(false);
  const [loadingReadiness, setLoadingReadiness] = useState(false);

  // Options
  const [opts, setOpts] = useState({
    carryBalances: true,
    copyFeeStructures: true,
    copyDiscounts: true,
    archivePrevious: true,
    promote: "auto" as "auto" | "none",
    graduateFinal: false,
  });

  // Confirmation
  const [password, setPassword] = useState("");
  const [ack, setAck] = useState(false);
  const [typedConfirm, setTypedConfirm] = useState("");

  // Execution
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);

  useEffect(() => {
    if (open) {
      setStep(1);
      setToYearId(currentAcademicYear?.id || "");
      setToTermId("");
      setChecks([]);
      setJobId(null);
      setJobStatus(null);
      setPassword("");
      setAck(false);
      setTypedConfirm("");
    }
  }, [open, currentAcademicYear?.id]);

  const availableTerms = useMemo(
    () => terms.filter((t) => t.academic_year_id === toYearId),
    [terms, toYearId],
  );

  const isYearSwitch = toYearId !== currentAcademicYear?.id;
  const isSameAsCurrent = toTermId === currentTerm?.id && toYearId === currentAcademicYear?.id;

  const toYear = academicYears.find((a) => a.id === toYearId);
  const toTerm = terms.find((t) => t.id === toTermId);

  // Load readiness when entering step 2
  useEffect(() => {
    if (step !== 2 || !toTermId || !toYearId) return;
    setLoadingReadiness(true);
    api
      .get<{ checks: ReadinessCheck[]; canProceed: boolean }>(
        `/academic-switch/readiness?fromTermId=${currentTerm?.id || ""}&toAcademicYearId=${toYearId}&toTermId=${toTermId}`,
      )
      .then((res) => {
        setChecks(res.checks);
        setCanProceed(res.canProceed);
      })
      .catch((e) => toast.error(e?.message || "Failed to load readiness"))
      .finally(() => setLoadingReadiness(false));
  }, [step, toTermId, toYearId, currentTerm?.id]);

  // Poll execution
  useEffect(() => {
    if (!jobId || jobStatus?.status === "completed" || jobStatus?.status === "failed") return;
    const t = setInterval(async () => {
      try {
        const j = await api.get<any>(`/academic-switch/progress/${jobId}`);
        setJobStatus(j);
      } catch (_) { /* keep polling */ }
    }, 800);
    return () => clearInterval(t);
  }, [jobId, jobStatus?.status]);

  const startExecute = async () => {
    try {
      await api.post("/auth/verify-password", { password });
    } catch (e: any) {
      toast.error(e?.message || "Incorrect password");
      return;
    }
    try {
      const res = await api.post<{ jobId: string }>("/academic-switch/execute", {
        from: { academicYearId: currentAcademicYear?.id, termId: currentTerm?.id },
        to: { academicYearId: toYearId, termId: toTermId },
        options: { ...opts, promote: isYearSwitch ? opts.promote : "none" },
      });
      setJobId(res.jobId);
    } catch (e: any) {
      toast.error(e?.message || "Failed to start migration");
    }
  };

  const finish = () => {
    onOpenChange(false);
    // Full reload so every module refetches under the new active session.
    window.location.reload();
  };

  const stepValid = () => {
    if (step === 1) return !!toYearId && !!toTermId && !isSameAsCurrent;
    if (step === 2) return canProceed;
    if (step === 3) return true;
    if (step === 4) return password.length > 0 && ack && typedConfirm.trim().toUpperCase() === "SWITCH";
    return false;
  };

  const iconFor = (s: Status) =>
    s === "pass" ? <Check className="h-4 w-4 text-success" /> :
    s === "warning" ? <AlertTriangle className="h-4 w-4 text-warning" /> :
    <XCircle className="h-4 w-4 text-destructive" />;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            Switch Academic Period
          </DialogTitle>
          <DialogDescription>
            Guided migration to a new term or academic year. Historical data is preserved.
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center gap-2 py-2 overflow-x-auto">
          {STEPS.map((s, i) => {
            const active = step === s.id;
            const done = step > s.id;
            const Icon = s.icon;
            return (
              <div key={s.id} className="flex items-center gap-2 shrink-0">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 ${
                  done ? "bg-success text-success-foreground border-success" :
                  active ? "bg-primary text-primary-foreground border-primary" :
                  "bg-muted text-muted-foreground border-border"
                }`}>
                  {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span className={`text-xs font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
                {i < STEPS.length - 1 && <div className="w-4 h-px bg-border" />}
              </div>
            );
          })}
        </div>

        <div className="py-2 min-h-[280px]">
          {step === 1 && (
            <div className="space-y-4">
              <div className="rounded-lg border p-3 bg-muted/30 text-xs">
                <div className="text-muted-foreground">Current active period</div>
                <div className="font-semibold">
                  {currentAcademicYear?.name || "—"} · {currentTerm?.name || "—"}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Destination Academic Year</Label>
                <Select value={toYearId} onValueChange={(v) => { setToYearId(v); setToTermId(""); }}>
                  <SelectTrigger><SelectValue placeholder="Select academic year" /></SelectTrigger>
                  <SelectContent>
                    {academicYears.map((y) => (
                      <SelectItem key={y.id} value={y.id}>
                        <span className="flex items-center gap-2">
                          {y.name}
                          {y.is_current && <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-success/10 text-success border-0">Current</Badge>}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Destination Term</Label>
                <Select value={toTermId} onValueChange={setToTermId} disabled={!toYearId}>
                  <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
                  <SelectContent>
                    {availableTerms.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <span className="flex items-center gap-2">
                          {t.name}
                          {t.is_current && <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-success/10 text-success border-0">Current</Badge>}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {isSameAsCurrent && (
                <div className="text-xs text-warning flex items-center gap-1"><AlertTriangle className="h-3 w-3" />This is already the active period.</div>
              )}
              {isYearSwitch && toYearId && (
                <div className="rounded-md border border-primary/30 bg-primary/5 p-2 text-xs">
                  Switching into a new academic year — student promotion options will appear in Step 3.
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              {loadingReadiness ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Running checks…</div>
              ) : (
                <>
                  {["finance", "academic", "setup"].map((cat) => {
                    const rows = checks.filter((c) => c.category === cat);
                    if (!rows.length) return null;
                    return (
                      <div key={cat} className="rounded-lg border">
                        <div className="px-3 py-2 border-b bg-muted/40 text-xs font-semibold uppercase tracking-wider">{cat}</div>
                        <div className="divide-y">
                          {rows.map((c, i) => (
                            <div key={i} className="px-3 py-2 flex items-start gap-2 text-sm">
                              <div className="mt-0.5">{iconFor(c.status)}</div>
                              <div className="flex-1 min-w-0">
                                <div>{c.label}</div>
                                {c.detail && <div className="text-xs text-muted-foreground">{c.detail}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {!canProceed && (
                    <div className="rounded-md border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive flex items-center gap-2">
                      <XCircle className="h-4 w-4" />Resolve blocking errors before continuing.
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              {[
                ["carryBalances", "Bring forward outstanding fee balances", "Uses the system 'Previous Balance' fee — never duplicates."],
                ["copyFeeStructures", "Copy fee structures to destination term", "Non-system fees are cloned; existing same-named fees are kept."],
                ["copyDiscounts", "Copy fee discounts", "Copies active discount rules if the module is enabled."],
                ["archivePrevious", "Archive previous term automatically", "Locks the previous term into read-only historical mode."],
              ].map(([key, label, hint]) => (
                <label key={key} className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/40">
                  <Checkbox
                    checked={(opts as any)[key]}
                    onCheckedChange={(v) => setOpts((o) => ({ ...o, [key]: !!v }))}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{label}</div>
                    <div className="text-xs text-muted-foreground">{hint}</div>
                  </div>
                </label>
              ))}

              {isYearSwitch && (
                <div className="rounded-md border p-3 space-y-2">
                  <div className="text-sm font-medium">Student promotion</div>
                  <RadioGroup value={opts.promote} onValueChange={(v) => setOpts((o) => ({ ...o, promote: v as any }))}>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <RadioGroupItem value="auto" id="promote-auto" />
                      Promote all students automatically (by grade order)
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <RadioGroupItem value="none" id="promote-none" />
                      Do not promote now
                    </label>
                  </RadioGroup>
                  {opts.promote === "auto" && (
                    <label className="flex items-center gap-2 text-xs cursor-pointer pt-1">
                      <Checkbox
                        checked={opts.graduateFinal}
                        onCheckedChange={(v) => setOpts((o) => ({ ...o, graduateFinal: !!v }))}
                      />
                      Graduate students in the final grade (marks as transferred)
                    </label>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <div className="rounded-lg border p-3 bg-muted/30 space-y-1">
                <div className="text-xs text-muted-foreground">Destination</div>
                <div className="font-semibold text-lg">{toYear?.name} · {toTerm?.name}</div>
              </div>
              <div className="rounded-lg border p-3 space-y-1 text-sm">
                <div className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-1">Actions</div>
                <ul className="list-disc pl-5 space-y-0.5 text-sm">
                  {opts.carryBalances && <li>Bring forward outstanding balances</li>}
                  {opts.copyFeeStructures && <li>Copy fee structures</li>}
                  {opts.copyDiscounts && <li>Copy fee discounts</li>}
                  {isYearSwitch && opts.promote === "auto" && (
                    <li>Promote students automatically{opts.graduateFinal ? ", graduate final grade" : ""}</li>
                  )}
                  {opts.archivePrevious && <li>Archive previous term</li>}
                  <li>Activate destination as the school's current period</li>
                </ul>
              </div>
              <div className="rounded-md border border-warning/40 bg-warning/5 p-3 space-y-2 text-xs">
                <div className="flex items-center gap-1 text-warning font-semibold">
                  <ShieldAlert className="h-4 w-4" />This action reshapes the school's operational context.
                </div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <Checkbox checked={ack} onCheckedChange={(v) => setAck(!!v)} />
                  <span>I have reviewed readiness checks and understand historical records will remain intact.</span>
                </label>
              </div>
              <div className="space-y-2">
                <Label>Type <span className="font-mono">SWITCH</span> to confirm</Label>
                <Input value={typedConfirm} onChange={(e) => setTypedConfirm(e.target.value)} placeholder="SWITCH" />
              </div>
              <div className="space-y-2">
                <Label>Your account password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3">
              {!jobStatus && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />Starting migration…
                </div>
              )}
              {jobStatus && (
                <>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium capitalize">{String(jobStatus.stage || "").replace(/_/g, " ")}</span>
                      <span className="text-muted-foreground">{jobStatus.progress}%</span>
                    </div>
                    <Progress value={jobStatus.progress || 0} />
                  </div>
                  <div className="rounded-md border bg-muted/30 max-h-56 overflow-y-auto p-2 space-y-0.5 text-xs font-mono">
                    {(jobStatus.log || []).map((l: any, i: number) => (
                      <div key={i}>· {l.msg}</div>
                    ))}
                  </div>
                  {jobStatus.status === "completed" && (
                    <div className="rounded-md border border-success/40 bg-success/5 p-3 text-sm flex items-start gap-2">
                      <PartyPopper className="h-5 w-5 text-success shrink-0" />
                      <div>
                        <div className="font-semibold text-success">Migration completed</div>
                        <div className="text-xs text-muted-foreground">
                          {toYear?.name} · {toTerm?.name} is now the active period.
                        </div>
                      </div>
                    </div>
                  )}
                  {jobStatus.status === "failed" && (
                    <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                      <div className="font-semibold">Migration failed</div>
                      <div className="text-xs">{jobStatus.error}</div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 flex-wrap">
          {step < 5 && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              {step > 1 && (
                <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
                  <ArrowLeft className="h-4 w-4 mr-1" />Back
                </Button>
              )}
              {step < 4 && (
                <Button onClick={() => setStep((s) => s + 1)} disabled={!stepValid()}>
                  Next<ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
              {step === 4 && (
                <Button
                  onClick={() => { setStep(5); startExecute(); }}
                  disabled={!stepValid()}
                >
                  <Play className="h-4 w-4 mr-1" />Execute migration
                </Button>
              )}
            </>
          )}
          {step === 5 && jobStatus?.status === "completed" && (
            <Button onClick={finish}>Done</Button>
          )}
          {step === 5 && jobStatus?.status === "failed" && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
