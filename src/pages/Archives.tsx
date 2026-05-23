import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTerm } from "@/contexts/TermContext";
import { Archive, Eye, Lock } from "lucide-react";

/**
 * Read-only browser for past academic sessions. Switching the dropdown
 * pipes the chosen (year, term) into TermContext, which auto-invalidates
 * every cached query so the rest of the app reloads in that session.
 */
const Archives = () => {
  const {
    academicYears, terms,
    selectedAcademicYear, selectedTerm,
    switchAcademicYear, switchTerm,
    currentAcademicYear, currentTerm,
    isViewingCurrentTerm,
  } = useTerm();

  const [year, setYear] = useState<string>(selectedAcademicYear?.id || "");
  const [term, setTerm] = useState<string>(selectedTerm?.id || "");

  const yearTerms = year ? terms.filter(t => t.academic_year_id === year) : terms;

  const apply = () => {
    if (year) switchAcademicYear(year);
    if (term) switchTerm(term);
  };

  return (
    <DashboardLayout title="Archives" subtitle="Browse past academic sessions in read-only mode">
      <Card className="mb-4">
        <CardHeader className="pb-3 flex flex-row items-center gap-2">
          <Archive className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Select session to browse</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4 items-end">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Academic Year</label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
              <SelectContent>
                {academicYears.map(y => (
                  <SelectItem key={y.id} value={y.id}>
                    {y.name}{y.id === currentAcademicYear?.id ? " (Current)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Term</label>
            <Select value={term} onValueChange={setTerm} disabled={!year}>
              <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
              <SelectContent>
                {yearTerms.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}{t.id === currentTerm?.id ? " (Current)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={apply} disabled={!year || !term} className="gap-1">
            <Eye className="h-4 w-4" /> Open session
          </Button>
          <div className="text-xs text-muted-foreground">
            {isViewingCurrentTerm
              ? "Currently on the active session."
              : <span className="text-warning font-medium">Viewing archived session — writes are blocked.</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-semibold">Read-only access</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>While viewing an archived session, every page in the system displays only that session's data:</p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>Students &amp; enrollments as they were in that term</li>
            <li>Fees, payments and balances from that period</li>
            <li>Attendance, exams, marks and reports for that session</li>
          </ul>
          <div className="flex items-center gap-2 pt-2">
            <Badge variant="outline" className="text-warning border-warning/30">Writes blocked</Badge>
            <span className="text-xs">Mutations against archived sessions return HTTP 409.</span>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Archives;
