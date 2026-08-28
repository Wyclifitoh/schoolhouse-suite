import { Link, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/help/EmptyState";
import {
  HELP_CATEGORIES,
  articlesByCategory,
  troubleshootingByCategory,
  type HelpCategoryId,
} from "@/lib/help/content";
import { ArticleCard, CategoryIcon } from "./helpUi";
import { ArrowLeft, BookOpen } from "lucide-react";

export default function HelpCategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const category = HELP_CATEGORIES.find((c) => c.id === categoryId);
  const articles = category ? articlesByCategory(category.id as HelpCategoryId) : [];
  const guides = category
    ? troubleshootingByCategory(category.id as HelpCategoryId)
    : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/help">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Help Center
          </Link>
        </Button>

        {!category ? (
          <EmptyState
            icon={BookOpen}
            title="That help area doesn't exist"
            description="The link may be out of date. Browse the Help Center to find what you need."
            actions={[{ label: "Open Help Center", to: "/help" }]}
          />
        ) : (
          <>
            <header className="flex items-start gap-3">
              <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <CategoryIcon name={category.icon} className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {category.title}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {category.description}
                </p>
              </div>
            </header>

            {articles.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                compact
                title="No articles here yet"
                description="This area of the Help Center is still being written. Search the Help Center or contact support in the meantime."
                actions={[{ label: "Search help", to: "/help", variant: "outline" }]}
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {articles.map((a) => (
                  <ArticleCard
                    key={a.slug}
                    to={`/help/a/${a.slug}`}
                    title={a.title}
                    summary={a.summary}
                  />
                ))}
              </div>
            )}

            {guides.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Troubleshooting
                </h2>
                <Card>
                  <CardContent className="divide-y p-0">
                    {guides.map((t) => (
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
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
