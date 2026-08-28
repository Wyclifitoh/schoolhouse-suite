import { PortalShell } from "@/components/portal/PortalShell";
import { useSelectedChild } from "@/contexts/SelectedChildContext";
import { usePortalHomework } from "@/hooks/usePortalApiExtended";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpenCheck, Paperclip } from "lucide-react";
import { EmptyState } from "@/components/portal/StatCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useState } from "react";

const TONE: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  submitted: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  overdue: "bg-rose-500/15 text-rose-700 border-rose-500/30",
};

export default function HomeworkPage() {
  return (
    <PortalShell title="Homework" subtitle="Track assigned tasks & due dates">
      <Body />
    </PortalShell>
  );
}

function Body() {
  const { selected } = useSelectedChild();
  const { data: hw = [] } = usePortalHomework(selected?.id);
  const [tab, setTab] = useState("all");

  const filtered = hw.filter((h) =>
    tab === "all" ? true : h.computed_status === tab,
  );

  if (!hw.length) {
    return (
      <EmptyState
        icon={BookOpenCheck}
        title="No homework assigned"
        description="Once teachers assign homework, it will show up here."
      />
    );
  }

  return (
    <Tabs value={tab} onValueChange={setTab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="all">All ({hw.length})</TabsTrigger>
        <TabsTrigger value="pending">Pending</TabsTrigger>
        <TabsTrigger value="submitted">Submitted</TabsTrigger>
        <TabsTrigger value="overdue">Overdue</TabsTrigger>
      </TabsList>
      <TabsContent value={tab} className="space-y-3">
        {filtered.map((h) => (
          <Card key={h.id}>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black truncate">{h.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {h.subject} · {h.teacher_name || "Teacher"} · Due {new Date(h.due_date).toLocaleDateString()}
                  </p>
                  {h.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{h.description}</p>
                  )}
                </div>
                <Badge variant="outline" className={`capitalize ${TONE[h.computed_status]}`}>
                  {h.computed_status}
                </Badge>
              </div>
              {h.attachment_url && (
                <Button asChild size="sm" variant="ghost" className="mt-2 -ml-2">
                  <a href={h.attachment_url} target="_blank" rel="noreferrer">
                    <Paperclip className="h-3.5 w-3.5 mr-1" /> Attachment
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </TabsContent>
    </Tabs>
  );
}