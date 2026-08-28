import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/help/EmptyState";
import { ReportProblemDialog } from "@/components/help/SupportDialogs";
import { useTrackRecent } from "@/components/help/RecentlyViewed";
import {
  HELP_ARTICLES,
  articleBySlug,
  troubleshootingBySlug,
} from "@/lib/help/content";
import { HelpBlocks, categoryTitle } from "./helpUi";
import { ArrowLeft, BookOpen, Printer } from "lucide-react";

/** A single help article, with related reading. */
export function HelpArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? articleBySlug(slug) : undefined;

  useTrackRecent(
    article
      ? {
          to: `/help/a/${article.slug}`,
          title: article.title,
          kind: "page",
          subtitle: "Help",
        }
      : null,
  );

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/help">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Help Center
          </Link>
        </Button>

        {!article ? (
          <EmptyState
            icon={BookOpen}
            title="We couldn't find that article"
            description="The link may be out of date. Search the Help Center for what you need."
            actions={[{ label: "Open Help Center", to: "/help" }]}
          />
        ) : (
          <article className="max-w-3xl space-y-4">
            <header>
              <Badge variant="secondary" className="text-[10px]">
                {categoryTitle(article.category)}
              </Badge>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                {article.title}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {article.summary}
              </p>
            </header>

            <HelpBlocks blocks={article.blocks} />

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
              >
                <Printer className="mr-1.5 h-4 w-4" /> Print
              </Button>
            </div>

            {article.related && article.related.length > 0 && (
              <section className="pt-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Related
                </h2>
                <Card className="mt-2">
                  <CardContent className="divide-y p-0">
                    {article.related.map((r) => {
                      const a = articleBySlug(r);
                      const t = troubleshootingBySlug(r);
                      if (!a && !t) return null;
                      return (
                        <Link
                          key={r}
                          to={a ? `/help/a/${r}` : `/help/t/${r}`}
                          className="block px-4 py-3 text-sm hover:bg-muted/50"
                        >
                          <span className="font-medium">
                            {a?.title || t?.title}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {a?.summary || t?.problem}
                          </span>
                        </Link>
                      );
                    })}
                  </CardContent>
                </Card>
              </section>
            )}
          </article>
        )}
      </div>
    </DashboardLayout>
  );
}

/** Problem → cause → solution → what to check next → support. */
export function TroubleshootingArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const item = slug ? troubleshootingBySlug(slug) : undefined;
  const [report, setReport] = useState(false);

  useTrackRecent(
    item
      ? {
          to: `/help/t/${item.slug}`,
          title: item.title,
          kind: "page",
          subtitle: "Help",
        }
      : null,
  );

  const related = item
    ? HELP_ARTICLES.filter((a) => a.category === item.category).slice(0, 4)
    : [];

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/help/troubleshooting">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Troubleshooting
          </Link>
        </Button>

        {!item ? (
          <EmptyState
            icon={BookOpen}
            title="We couldn't find that guide"
            description="The link may be out of date. Browse troubleshooting for the issue you're facing."
            actions={[{ label: "Open troubleshooting", to: "/help/troubleshooting" }]}
          />
        ) : (
          <article className="max-w-3xl space-y-4">
            <header>
              <Badge variant="secondary" className="text-[10px]">
                {categoryTitle(item.category)}
              </Badge>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                {item.title}
              </h1>
            </header>

            <Section title="Problem">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {item.problem}
              </p>
            </Section>
            <Section title="Possible causes">
              <Bullets items={item.causes} />
            </Section>
            <Section title="Solution">
              <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
                {item.solution.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </Section>
            <Section title="What to check next">
              <Bullets items={item.checkNext} />
            </Section>

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <p className="text-sm">Still not resolved?</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setReport(true)}>
                    Report a problem
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <Link to="/help/support">Contact support</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {related.length > 0 && (
              <section className="pt-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Related articles
                </h2>
                <Card className="mt-2">
                  <CardContent className="divide-y p-0">
                    {related.map((a) => (
                      <Link
                        key={a.slug}
                        to={`/help/a/${a.slug}`}
                        className="block px-4 py-3 text-sm hover:bg-muted/50"
                      >
                        <span className="font-medium">{a.title}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {a.summary}
                        </span>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              </section>
            )}
          </article>
        )}
      </div>
      <ReportProblemDialog open={report} onOpenChange={setReport} />
    </DashboardLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-1.5">{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}
