import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowRight, Star, Sparkles } from "lucide-react";
import {
  REPORT_CATEGORIES,
  REPORTS,
  reportsByCategory,
  searchReports,
} from "@/lib/reportCatalog";

export default function ReportCenter() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const results = useMemo(() => (query ? searchReports(query) : []), [query]);
  const popular = REPORTS.filter((r) => r.popular);

  return (
    <DashboardLayout
      title="Report Center"
      subtitle="School intelligence, analytics and operational reporting"
    >
      {/* Search */}
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reports — try “fee”, “attendance”, “payroll”…"
            className="h-11 pl-9"
            aria-label="Search reports"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {REPORTS.length} reports across {REPORT_CATEGORIES.length} categories
        </p>
      </div>

      {query ? (
        <section>
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.09em] text-muted-foreground">
            {results.length} result{results.length === 1 ? "" : "s"} for “
            {query}”
          </h2>
          {results.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No reports match your search.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((r) => (
                <Card
                  key={r.id}
                  onClick={() => navigate(r.url)}
                  className="group cursor-pointer transition-all hover:border-primary/30 hover:shadow-md"
                >
                  <CardContent className="flex items-start gap-3 p-4">
                    {r.icon && (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <r.icon className="h-4 w-4" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold">{r.title}</p>
                        <Badge
                          variant="secondary"
                          className="shrink-0 text-[10px]"
                        >
                          {
                            REPORT_CATEGORIES.find((c) => c.id === r.category)
                              ?.label
                          }
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {r.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          {/* Popular */}
          <section className="mb-9">
            <h2 className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.09em] text-muted-foreground">
              <Star className="h-3.5 w-3.5" /> Frequently used
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {popular.map((r) => (
                <button
                  key={r.id}
                  onClick={() => navigate(r.url)}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 text-left transition-all hover:border-primary/30 hover:shadow-md"
                >
                  {r.icon && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <r.icon className="h-4 w-4" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{r.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.description}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </button>
              ))}
            </div>
          </section>

          {/* Categories */}
          <section>
            <h2 className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.09em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" /> Report categories
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {REPORT_CATEGORIES.map((c) => {
                const count = reportsByCategory(c.id).length;
                return (
                  <Card
                    key={c.id}
                    onClick={() => navigate(`/reports/c/${c.id}`)}
                    className="group cursor-pointer transition-all hover:border-primary/30 hover:shadow-md"
                  >
                    <CardContent className="flex h-full flex-col p-5">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <c.icon className="h-5 w-5" />
                      </div>
                      <p className="text-[15px] font-semibold">{c.label}</p>
                      <p className="mt-1 flex-1 text-xs text-muted-foreground">
                        {c.description}
                      </p>
                      <div className="mt-4 flex items-center justify-between">
                        <Badge variant="secondary" className="text-[10px]">
                          {count} report{count === 1 ? "" : "s"}
                        </Badge>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                          View reports
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </CardContent>
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
