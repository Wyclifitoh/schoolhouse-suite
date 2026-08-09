import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowRight, Star } from "lucide-react";
import {
  REPORTS,
  REPORT_CATEGORIES,
  reportsByCategory,
  searchReports,
} from "@/lib/reportCatalog";

export default function ReportCenter() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const results = useMemo(() => (q.trim() ? searchReports(q) : []), [q]);
  const popular = REPORTS.filter((r) => r.popular);

  return (
    <DashboardLayout
      title="Reports"
      subtitle="School intelligence, analytics and operational reporting"
    >
      <div className="relative mb-6 max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search reports…"
          className="pl-9"
        />
      </div>

      {q.trim() ? (
        <section>
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.09em] text-muted-foreground">
            {results.length} result{results.length === 1 ? "" : "s"}
          </h2>
          {results.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">
              No reports match “{q}”.
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((r) => (
                <Card
                  key={r.id}
                  className="cursor-pointer p-4 transition-shadow hover:shadow-md"
                  onClick={() => navigate(r.url)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{r.title}</p>
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {REPORT_CATEGORIES.find((c) => c.id === r.category)?.label}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.description}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          <section className="mb-8">
            <h2 className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.09em] text-muted-foreground">
              <Star className="h-3.5 w-3.5" /> Frequently used
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {popular.map((r) => (
                <Card
                  key={r.id}
                  className="cursor-pointer p-4 transition-shadow hover:shadow-md"
                  onClick={() => navigate(r.url)}
                >
                  <p className="text-sm font-semibold">{r.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.description}
                  </p>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.09em] text-muted-foreground">
              Report categories
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {REPORT_CATEGORIES.map((c) => {
                const count = reportsByCategory(c.id).length;
                return (
                  <Card
                    key={c.id}
                    className="flex cursor-pointer flex-col p-5 transition-shadow hover:shadow-md"
                    onClick={() => navigate(`/reports/c/${c.id}`)}
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <c.icon className="h-5 w-5" />
                    </div>
                    <p className="text-[15px] font-semibold">{c.label}</p>
                    <p className="mt-1 flex-1 text-xs text-muted-foreground">
                      {c.description}
                    </p>
                    <p className="mt-3 text-xs font-semibold text-foreground">
                      {count} Report{count === 1 ? "" : "s"}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-8 justify-start px-0 text-primary hover:bg-transparent"
                    >
                      View Reports <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </Card>
                );
              })}
            </div>
          </section>
        </>
      )}
    </DashboardLayout>
  );
}
