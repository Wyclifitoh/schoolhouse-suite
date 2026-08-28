import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Global header search. Submitting sends the user to the Students screen
 * with the query pre-applied (admission number, name, phone, etc.).
 */
export function GlobalSearch({ className }: { className?: string }) {
  const [value, setValue] = useState("");
  const navigate = useNavigate();

  const submit = () => {
    const q = value.trim();
    if (!q) return;
    navigate(`/students?search=${encodeURIComponent(q)}`);
  };

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        placeholder="Search students, staff, invoices..."
        aria-label="Search students"
        className="h-10 rounded-lg border-border bg-background/80 pl-9 pr-14 text-[13px] shadow-none transition-colors focus-visible:border-primary/50 focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/20"

      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-border/70 bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground sm:block">
        ⏎
      </kbd>
    </div>
  );
}
