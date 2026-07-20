import { PortalShell } from "@/components/portal/PortalShell";
import { useSelectedChild } from "@/contexts/SelectedChildContext";
import { usePortalReportCards } from "@/hooks/usePortalApi";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { EmptyState } from "@/components/portal/StatCard";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function AcademicsPage() {
  return (
    <PortalShell title="Academics" subtitle="Published results & performance trends">
      <Body />
    </PortalShell>
  );
}

function Body() {
  const { selected } = useSelectedChild();
  const navigate = useNavigate();
  const { data: cards = [] } = usePortalReportCards(selected?.id);

  const trend = useMemo(
    () =>
      [...cards]
        .reverse()
        .filter((c) => c.payload?.percentage != null)
        .map((c) => ({
          name: c.assessment_name.slice(0, 14),
          percentage: Number(c.payload?.percentage),
        })),
    [cards],
  );

  if (!cards.length) {
    return (
      <EmptyState
        icon={FileText}
        title="No published results yet"
        description="Once the school publishes report cards, they'll appear here."
      />
    );
  }

  return (
    <div className="space-y-5">
      {trend.length > 1 && (
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-black mb-3">Performance Trend</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="percentage" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((c) => (
          <Card key={c.id} className="hover:shadow-md transition">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-black truncate">{c.assessment_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Published {new Date(c.published_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="outline" className="text-base font-black px-3 py-1">
                  {c.payload?.percentage ?? "—"}%
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-2">
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Grade</p>
                  <p className="text-sm font-black">{c.payload?.overall_band || c.payload?.overall_al || "—"}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Class Pos</p>
                  <p className="text-sm font-black">{c.payload?.class_position ?? "—"}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Subjects</p>
                  <p className="text-sm font-black">{c.payload?.subjects?.length ?? 0}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/portal/parent/children/${selected?.id}?report=${c.id}`)}
              >
                <Download className="h-4 w-4 mr-2" /> View / Download
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}