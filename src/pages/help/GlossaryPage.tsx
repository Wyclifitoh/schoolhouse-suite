import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GLOSSARY } from "@/lib/help/content";
import { ArrowLeft, BookMarked, Search } from "lucide-react";

export default function GlossaryPage() {
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get("term") || "");
  const highlight = params.get("term");

  const items = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = s
      ? GLOSSARY.filter((g) =>
          `${g.term} ${g.definition}`.toLowerCase().includes(s),
        )
      : GLOSSARY;
    return [...list].sort((a, b) => a.term.localeCompare(b.term));
  }, [q]);

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
            <BookMarked className="h-5 w-5 text-primary" aria-hidden="true" />
            Glossary
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Plain-language meanings of the terms Chuo uses.
          </p>
        </header>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search glossary"
            placeholder="Search terms — e.g. B/F, allocation"
            className="pl-9"
          />
        </div>

        <Card>
          <CardContent className="divide-y p-0">
            {items.map((g) => (
              <div
                key={g.term}
                className={
                  highlight && highlight.toLowerCase() === g.term.toLowerCase()
                    ? "bg-primary/5 px-4 py-3"
                    : "px-4 py-3"
                }
              >
                <p className="text-sm font-semibold">{g.term}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                  {g.definition}
                </p>
              </div>
            ))}
            {items.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                No term matched “{q.trim()}”.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
