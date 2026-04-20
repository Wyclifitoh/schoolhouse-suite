import { format, parseISO, isValid } from "date-fns";

/**
 * Formats an ISO string to a readable date: April 19, 2026
 */
export const formatDate = (
  dateString: string | Date | null | undefined,
): string => {
  if (!dateString) return "—";
  const date =
    typeof dateString === "string" ? parseISO(dateString) : dateString;

  return isValid(date) ? format(date, "MMMM d, yyyy") : "Invalid Date";
};

/**
 * Formats an ISO string to date and time: April 19, 2026 09:00 PM
 */
export const formatDateTime = (
  dateString: string | Date | null | undefined,
): string => {
  if (!dateString) return "—";
  const date =
    typeof dateString === "string" ? parseISO(dateString) : dateString;

  return isValid(date) ? format(date, "MMMM d, yyyy hh:mm a") : "Invalid Date";
};

/**
 * Formats to a short version: 19/04/2026
 */
export const formatShortDate = (
  dateString: string | Date | null | undefined,
): string => {
  if (!dateString) return "—";
  const date =
    typeof dateString === "string" ? parseISO(dateString) : dateString;

  return isValid(date) ? format(date, "dd/MM/yyyy") : "Invalid Date";
};
