import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { useParents, useSetPrimaryParent } from "@/hooks/useParents";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  studentId: string | null;
  studentName?: string;
}

export function PrimaryParentPicker({
  open,
  onOpenChange,
  studentId,
  studentName,
}: Props) {
  const [search, setSearch] = useState("");
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [rel, setRel] = useState("guardian");
  const { data: parents = [], isLoading } = useParents(search);
  const setPrimary = useSetPrimaryParent();

  const submit = () => {
    if (!studentId || !pickedId) return;
    setPrimary.mutate(
      { studentId, parentId: pickedId, relationship: rel },
      {
        onSuccess: () => {
          onOpenChange(false);
          setPickedId(null);
          setSearch("");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Set Primary Guardian{studentName ? ` · ${studentName}` : ""}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Search existing parents</Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <ScrollArea className="h-56 border rounded-md">
            <div className="p-1">
              {isLoading ? (
                <p className="p-3 text-sm text-muted-foreground">Loading...</p>
              ) : parents.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground text-center">
                  No parents found
                </p>
              ) : (
                parents.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setPickedId(p.id)}
                    className={`w-full text-left px-2 py-1.5 rounded hover:bg-accent ${
                      pickedId === p.id ? "bg-accent" : ""
                    }`}
                  >
                    <p className="text-sm font-medium">
                      {p.first_name} {p.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {p.phone}
                    </p>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
          <div className="space-y-1.5">
            <Label>Relationship</Label>
            <Select value={rel} onValueChange={setRel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mother">Mother</SelectItem>
                <SelectItem value="father">Father</SelectItem>
                <SelectItem value="guardian">Guardian</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!pickedId || setPrimary.isPending}
          >
            {setPrimary.isPending ? "Saving..." : "Set as Primary"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PrimaryParentPicker;