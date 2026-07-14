import { useTerm } from "@/contexts/TermContext";

/**
 * Unified accessor for the global Academic Context.
 *
 * - `active*` = the school's operational (year, term) — what new records
 *   get stamped with. Read from `TermContext.currentTerm/currentAcademicYear`.
 * - `viewing*` = the (year, term) the logged-in user is currently browsing.
 *   Read from `TermContext.selectedTerm/selectedAcademicYear`.
 * - `isHistorical` is TRUE whenever viewing ≠ active. Every mutating UI
 *   surface in CHUO should hide/disable itself when this flag is true.
 */
export function useAcademicContext() {
  const {
    currentTerm,
    currentAcademicYear,
    selectedTerm,
    selectedAcademicYear,
    isViewingCurrentTerm,
    isLoading,
  } = useTerm();

  return {
    activeYear: currentAcademicYear,
    activeTerm: currentTerm,
    viewingYear: selectedAcademicYear,
    viewingTerm: selectedTerm,
    isHistorical: !isViewingCurrentTerm && !!selectedTerm,
    isCurrent: isViewingCurrentTerm,
    isLoading,
  };
}

/** Convenience hook: `true` when the user is viewing a past/other term. */
export function useIsHistoricalView() {
  return useAcademicContext().isHistorical;
}