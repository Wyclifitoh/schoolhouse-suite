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
import { toast } from "sonner";

interface TermSwitcherProps {
  /** Compact = top-header style; otherwise sidebar style */
  compact?: boolean;
}

export function TermSwitcher({ compact = false }: TermSwitcherProps) {
  const { selectedTerm, terms, switchTerm, isViewingCurrentTerm, currentTerm } = useTerm();

  if (terms.length === 0) return null;

  const handleSelect = (termId: string) => {
    if (termId === selectedTerm?.id) return;
    const target = terms.find(t => t.id === termId);
    if (!target) return;
    switchTerm(termId);
    toast.success(`Switched view to ${target.name}`);
  };

  const isUpcoming = selectedTerm && currentTerm && new Date(selectedTerm.start_date) > new Date(currentTerm.end_date);

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
              <AlertCircle className="h-3 w-3" /> {isUpcoming ? "Upcoming term" : "Past term"}
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
              <span className="text-[10px] text-warning font-medium">Viewing {isUpcoming ? "upcoming" : "past"} term data</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}
