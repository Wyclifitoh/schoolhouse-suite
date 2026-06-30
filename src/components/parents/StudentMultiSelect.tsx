import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStudents, type StudentRow } from "@/hooks/useStudents";
import { cn } from "@/lib/utils";

interface Props {
  value: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  excludeIds?: string[];
  className?: string;
}

export function StudentMultiSelect({
  value,
  onChange,
  placeholder = "Select students...",
  excludeIds = [],
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data: students = [], isLoading } = useStudents({
    search: search || undefined,
    status: "active",
  });

  const excludeSet = useMemo(() => new Set(excludeIds), [excludeIds]);
  const visible = useMemo(
    () => (students as StudentRow[]).filter((s) => !excludeSet.has(s.id)),
    [students, excludeSet],
  );

  const selectedMap = useMemo(() => {
    const map = new Map<string, StudentRow>();
    (students as StudentRow[]).forEach((s) => {
      if (value.includes(s.id)) map.set(s.id, s);
    });
    return map;
  }, [students, value]);

  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else onChange([...value, id]);
  };

  const removeOne = (id: string) => onChange(value.filter((v) => v !== id));

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-between font-normal"
          >
            {value.length === 0
              ? placeholder
              : `${value.length} student${value.length > 1 ? "s" : ""} selected`}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
        >
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or admission no..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9"
                autoFocus
              />
            </div>
          </div>
          <ScrollArea className="h-64">
            <div className="p-1">
              {isLoading ? (
                <p className="p-3 text-sm text-muted-foreground">Loading...</p>
              ) : visible.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground text-center">
                  No students found
                </p>
              ) : (
                visible.map((s) => {
                  const selected = value.includes(s.id);
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => toggle(s.id)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent text-left",
                        selected && "bg-accent/50",
                      )}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4",
                          selected ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">
                          {s.full_name || `${s.first_name} ${s.last_name}`}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {s.admission_number} · {s.grade || "—"}
                          {s.stream ? ` · ${s.stream}` : ""}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((id) => {
            const s = selectedMap.get(id);
            return (
              <Badge key={id} variant="secondary" className="pl-2 pr-1 gap-1">
                <span className="truncate max-w-[12rem]">
                  {s
                    ? s.full_name || `${s.first_name} ${s.last_name}`
                    : id.slice(0, 6)}
                </span>
                <button
                  type="button"
                  onClick={() => removeOne(id)}
                  className="hover:bg-muted-foreground/20 rounded"
                  aria-label="Remove"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default StudentMultiSelect;