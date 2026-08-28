import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RELEASE_NOTES } from "@/lib/help/content";
import { format, isValid, parseISO } from "date-fns";

function Section({
  title,
  items,
  tone,
}: {
  title: string;
  items?: string[];
  tone?: "important";
}) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <p
        className={
          tone === "important"
            ? "text-xs font-semibold uppercase tracking-wide text-destructive"
            : "text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        }
      >
        {title}
      </p>
      <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

/** Release notes written for school staff, not developers. */
export default function WhatsNewPage() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">What's new</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Recent improvements to Chuo, in plain language.
          </p>
        </header>

        {RELEASE_NOTES.map((r) => {
          const d = parseISO(r.date);
          return (
            <Card key={r.version}>
              <CardHeader className="pb-2">
                <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                  {r.version}
                  {isValid(d) && (
                    <Badge variant="secondary" className="text-[10px]">
                      {format(d, "d MMM yyyy")}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <Section title="Highlights" items={r.highlights} />
                <Section title="New" items={r.added} />
                <Section title="Improved" items={r.improved} />
                <Section title="Fixed" items={r.fixed} />
                <Section title="Please note" items={r.important} tone="important" />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
