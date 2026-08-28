import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface StudentLinkProps {
  studentId?: string | null;
  name?: string | null;
  className?: string;
  /** Optional secondary line, e.g. admission number */
  subtitle?: string | null;
}

/**
 * Shortcut link to a student profile. Used anywhere a student's name is shown
 * in a list so staff can jump straight to the profile.
 */
export function StudentLink({
  studentId,
  name,
  className,
  subtitle,
}: StudentLinkProps) {
  const label = name || "—";
  if (!studentId) return <span className={className}>{label}</span>;
  return (
    <Link
      to={`/students/${studentId}`}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline",
        className,
      )}
      title={`Open ${label}'s profile`}
    >
      {label}
      {subtitle ? (
        <span className="ml-1 text-xs text-muted-foreground">{subtitle}</span>
      ) : null}
    </Link>
  );
}
