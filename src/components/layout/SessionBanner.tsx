import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTerm } from "@/contexts/TermContext";

/**
 * Sticky global banner shown when the user is viewing a session other than
 * the school's current (year, term). One click returns to "today".
 */
export function SessionBanner() {
  const {
    isViewingCurrentTerm,
    selectedTerm,
    selectedAcademicYear,
    currentTerm,
    currentAcademicYear,
    switchTerm,
    switchAcademicYear,
  } = useTerm();

  if (isViewingCurrentTerm || !selectedTerm) return null;

  const handleReturn = () => {
    if (currentAcademicYear) switchAcademicYear(currentAcademicYear.id);
    if (currentTerm) switchTerm(currentTerm.id);
  };

  return (
    <div className="sticky top-14 z-40 border-b border-warning/30 bg-warning/10 backdrop-blur">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3 px-3 sm:px-6 py-2 text-xs">
        <div className="flex items-center gap-2 text-warning">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span className="font-semibold">
            Viewing historical session: {selectedAcademicYear?.name || "—"} ·{" "}
            {selectedTerm.name}
          </span>
          <span className="hidden sm:inline text-muted-foreground font-normal">
            — all academic and finance data is from this session.
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1 border-warning/40 hover:bg-warning/20"
          onClick={handleReturn}
        >
          <ArrowLeft className="h-3 w-3" /> Back to current
        </Button>
      </div>
    </div>
  );
}
