import { useTerm } from "@/contexts/TermContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function TermSwitcher() {
  const { selectedTerm, terms, switchTerm, isViewingCurrentTerm, currentTerm } = useTerm();

  if (terms.length === 0) return null;

  return (
    <div className="mx-4 mb-2 px-1 space-y-1">
      <Select value={selectedTerm?.id || ""} onValueChange={switchTerm}>
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
  );
}
