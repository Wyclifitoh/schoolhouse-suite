import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RecentlyViewed } from "@/components/help/RecentlyViewed";
import {
  FeedbackDialog,
  ReportProblemDialog,
} from "@/components/help/SupportDialogs";
import { restoreSetupChecklist } from "@/components/help/SetupChecklist";
import { usePermissionSet } from "@/hooks/usePermission";
import { useSchoolProfile } from "@/hooks/useSettings";
import {
  HELP_ARTICLES,
  HELP_CATEGORIES,
  PRINTABLE_GUIDES,
  ROLE_PRIORITY_RULES,
  TROUBLESHOOTING,
  searchHelp,
  type HelpCategoryId,
} from "@/lib/help/content";
import { ArticleCard, CategoryIcon } from "./helpUi";
import {
  Search,
  LifeBuoy,
  MessageSquare,
  Bug,
  Sparkles,
  BookMarked,
  GraduationCap,
  Printer,
  Rocket,
} from "lucide-react";
import { toast } from "sonner";

/**
 * CHUO HELP CENTER
 * Role-aware: content relevant to the permissions you hold is surfaced first.
 * Nothing is hidden — every article stays reachable by browsing or search.
 */
export default function HelpCenter() {
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState(false);
  const [report, setReport] = useState(false);
  const { has, wildcard, ready } = usePermissionSet();
  const { data: school } = useSchoolProfile();
  const navigate = useNavigate();

  const results = useMemo(() => searchHelp(query), [query]);

  const priorityCategories = useMemo<HelpCategoryId[]>(() => {
    if (!ready) return [];
    if (wildcard) return ["getting-started", "users", "finance", "assessments"];
    const out: HelpCategoryId[] = [];
    for (const rule of ROLE_PRIORITY_RULES) {
      if (has(rule.permission))
        for (const c of rule.categories) if (!out.includes(c)) out.push(c);
    }
    return out.slice(0, 4);
  }, [ready, wildcard, has]);

  const forYou = useMemo(
    () =>
      HELP_ARTICLES.filter(
        (a) =>
          priorityCategories.includes(a.category) &&
          (!a.permission || wildcard || has(a.permission)),
      ).slice(0, 6),
    [priorityCategories, has, wildcard],
  );

  const popular = HELP_ARTICLES.filter((a) => a.popular).slice(0, 6);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Help Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Guides, troubleshooting and answers for running{" "}
            {school?.name || "your school"} on Chuo.
          </p>
        </header>

        {/* Search */}
        <div className="relative max-w-xl">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search help — e.g. publish results, student balance"
            aria-label="Search help"
            className="pl-9"
          />
        </div>

        {query.trim() ? (
          <section aria-label="Search results" className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {results.length} result{results.length === 1 ? "" : "s"} for “
              {query.trim()}”
            </p>
            {results.length === 0 ? (
              <Card>
                <CardContent className="space-y-3 p-6 text-center">
                  <p className="text-sm font-medium">No help article matched</p>
                  <p className="text-xs text-muted-foreground">
                    Try a different word, browse the categories below, or contact
                    support.
                  </p>
                  <Button size="sm" variant="outline" onClick={() => setReport(true)}>
                    Report a problem
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((r) => (
                  <ArticleCard
                    key={`${r.kind}-${r.slug}`}
                    to={
                      r.kind === "article"
                        ? `/help/a/${r.slug}`
                        : r.kind === "troubleshooting"
                          ? `/help/t/${r.slug}`
                          : `/help/glossary?term=${encodeURIComponent(r.slug)}`
                    }
                    title={r.title}
                    summary={r.summary}
                    badge={
                      r.kind === "glossary"
                        ? "Glossary"
                        : r.kind === "troubleshooting"
                          ? "Troubleshooting"
                          : undefined
                    }
                  />
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            {/* Quick actions */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="justify-start" asChild>
                <Link to="/help/troubleshooting">
                  <LifeBuoy className="mr-2 h-4 w-4" /> Troubleshooting
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link to="/help/glossary">
                  <BookMarked className="mr-2 h-4 w-4" /> Glossary
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link to="/whats-new">
                  <Sparkles className="mr-2 h-4 w-4" /> What's new
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link to="/help/support">
                  <MessageSquare className="mr-2 h-4 w-4" /> Get help
                </Link>
              </Button>
            </div>

            {forYou.length > 0 && (
              <section aria-labelledby="for-you" className="space-y-3">
                <h2 id="for-you" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Recommended for your role
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {forYou.map((a) => (
                    <ArticleCard
                      key={a.slug}
                      to={`/help/a/${a.slug}`}
                      title={a.title}
                      summary={a.summary}
                    />
                  ))}
                </div>
              </section>
            )}

            <section aria-labelledby="categories" className="space-y-3">
              <h2 id="categories" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Browse by area
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {HELP_CATEGORIES.map((c) => {
                  const count =
                    c.id === "troubleshooting"
                      ? TROUBLESHOOTING.length
                      : HELP_ARTICLES.filter((a) => a.category === c.id).length;
                  return (
                    <Link
                      key={c.id}
                      to={
                        c.id === "troubleshooting"
                          ? "/help/troubleshooting"
                          : `/help/c/${c.id}`
                      }
                      className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Card className="h-full transition-colors hover:border-primary/40 hover:bg-muted/40">
                        <CardContent className="flex items-start gap-3 p-4">
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <CategoryIcon name={c.icon} />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold">
                              {c.title}
                            </span>
                            <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                              {c.description}
                            </span>
                            <Badge variant="secondary" className="mt-2 text-[10px]">
                              {count} article{count === 1 ? "" : "s"}
                            </Badge>
                          </span>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>

            <div className="grid gap-4 lg:grid-cols-3">
              <section className="space-y-3 lg:col-span-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Popular articles
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {popular.map((a) => (
                    <ArticleCard
                      key={a.slug}
                      to={`/help/a/${a.slug}`}
                      title={a.title}
                      summary={a.summary}
                    />
                  ))}
                </div>
              </section>

              <div className="space-y-4">
                <RecentlyViewed limit={5} />
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      Printable guides
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 pt-0">
                    {PRINTABLE_GUIDES.map((g) => (
                      <Link
                        key={g.slug}
                        to={`/help/guide/${g.slug}`}
                        className="flex items-center gap-2 rounded px-1.5 py-1.5 text-sm hover:bg-muted"
                      >
                        <Printer className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate">{g.title}</span>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Rocket className="h-4 w-4 text-muted-foreground" /> Getting
                      started
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    <p className="text-xs text-muted-foreground">
                      Reopen the setup checklist on your dashboard.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        restoreSetupChecklist();
                        toast.success("Setup checklist restored on your dashboard");
                        navigate("/dashboard");
                      }}
                    >
                      Show setup checklist
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="space-y-2 p-4">
                    <p className="text-sm font-semibold">Still stuck?</p>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => setReport(true)}>
                        <Bug className="mr-1.5 h-3.5 w-3.5" /> Report a problem
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setFeedback(true)}>
                        Give feedback
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>

      <ReportProblemDialog open={report} onOpenChange={setReport} />
      <FeedbackDialog open={feedback} onOpenChange={setFeedback} />
    </DashboardLayout>
  );
}
