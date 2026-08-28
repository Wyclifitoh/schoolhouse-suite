import { useState } from "react";
import { useTerm } from "@/contexts/TermContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, AlertCircle, ArrowLeftRight } from "lucide-react";
import { AcademicSwitchWizard } from "@/components/academic-switch/AcademicSwitchWizard";

interface TermSwitcherProps {
  /** Compact = top-header style; otherwise sidebar style */
  compact?: boolean;
  /** Show the "Switch period" action (lives in Settings for the header). */
  showSwitchButton?: boolean;
}

export function TermSwitcher({
  compact = false,
  showSwitchButton = true,
}: TermSwitcherProps) {
  const { selectedTerm, terms, switchTerm, isViewingCurrentTerm, currentTerm } =
    useTerm();
  const [wizardOpen, setWizardOpen] = useState(false);

  if (terms.length === 0) return null;

  // Changing the term dropdown only changes the VIEWING context (read-only
  // for historical). Actually promoting the school into a new operational
  // period goes through the multi-step wizard.
  const handleSelectView = (termId: string) => {
    if (termId === selectedTerm?.id) return;
    switchTerm(termId);
  };

  return (
    <>
      {compact ? (
        <div className="flex items-center gap-2">
          <Select
            value={selectedTerm?.id || ""}
            onValueChange={handleSelectView}
          >
            <SelectTrigger className="h-10 w-[185px] text-xs rounded-xl border-border/70 bg-card">
              <Calendar className="h-3.5 w-3.5 mr-1.5 shrink-0 text-primary" />
              <SelectValue placeholder="Select Term" />
            </SelectTrigger>
            <SelectContent align="end">
              {terms.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  <span className="flex items-center gap-2">
                    {t.name}
                    {t.id === currentTerm?.id && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 h-4 bg-success/10 text-success border-0"
                      >
                        Current
                      </Badge>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {showSwitchButton && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs"
              onClick={() => setWizardOpen(true)}
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Switch period
            </Button>
          )}
          {!isViewingCurrentTerm && selectedTerm && (
            <Badge
              variant="outline"
              className="hidden md:inline-flex h-7 gap-1 text-[10px] text-warning border-warning/30"
            >
              <AlertCircle className="h-3 w-3" /> Past term
            </Badge>
          )}
        </div>
      ) : (
        <div className="mx-4 mb-2 px-1 space-y-1">
          <Select
            value={selectedTerm?.id || ""}
            onValueChange={handleSelectView}
          >
            <SelectTrigger className="h-8 text-xs bg-sidebar-accent/50 border-sidebar-border/50 text-sidebar-accent-foreground rounded-lg">
              <Calendar className="h-3 w-3 mr-1.5 shrink-0" />
              <SelectValue placeholder="Select Term" />
            </SelectTrigger>
            <SelectContent>
              {terms.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  <span className="flex items-center gap-2">
                    {t.name}
                    {t.id === currentTerm?.id && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 h-4 bg-success/10 text-success border-0"
                      >
                        Current
                      </Badge>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {showSwitchButton && (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs gap-1.5"
              onClick={() => setWizardOpen(true)}
            >
              <ArrowLeftRight className="h-3 w-3" />
              Switch period
            </Button>
          )}
          {!isViewingCurrentTerm && selectedTerm && (
            <div className="flex items-center gap-1.5 px-1">
              <AlertCircle className="h-3 w-3 text-warning shrink-0" />
              <span className="text-[10px] text-warning font-medium">
                Viewing past term data
              </span>
            </div>
          )}
        </div>
      )}

      <AcademicSwitchWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </>
  );
}
