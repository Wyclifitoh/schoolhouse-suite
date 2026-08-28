import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HELP_CATEGORIES, TROUBLESHOOTING } from "@/lib/help/content";
import { EmptyState } from "@/components/help/EmptyState";
import { ArrowLeft, LifeBuoy, Search } from "lucide-react";

export default function TroubleshootingIndex() {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return TROUBLESHOOTING;
    return TROUBLESHOOTING.filter((t) =>
      `${t.title} ${t.problem} ${(t.keywords || []).join(" ")}`
        .toLowerCase()
        .includes(s),
    );
  }, [q]);

  const groups = HELP_CATEGORIES.map((c) => ({
    category: c,
    items: filtered.filter((t) => t.category === c.id),
  })).filter((g) => g.items.length > 0);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/help">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Help Center
          </Link>
        </Button>

        <header>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <LifeBuoy className="h-5 w-5 text-primary" aria-hidden="true" />
            Troubleshooting
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Practical answers to the issues schools hit most often.
          </p>
        </header>

        <div className="relative max-w-xl">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search troubleshooting"
            placeholder="Search — e.g. balance, publish, import"
            className="pl-9"
          />
        </div>

        {groups.length === 0 ? (
          <EmptyState
            icon={LifeBuoy}
            compact
            title="Nothing matched your search"
            description="Try a different word, or report the problem so we can help directly."
            actions={[{ label: "Open Help Center", to: "/help", variant: "outline" }]}
          />
        ) : (
          groups.map((g) => (
            <section key={g.category.id} className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {g.category.title}
              </h2>
              <Card>
                <CardContent className="divide-y p-0">
                  {g.items.map((t) => (
                    <Link
                      key={t.slug}
                      to={`/help/t/${t.slug}`}
                      className="block px-4 py-3 text-sm hover:bg-muted/50"
                    >
                      <span className="font-medium">{t.title}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {t.problem}
                      </span>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </section>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
