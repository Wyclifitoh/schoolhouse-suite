import { useParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpBlocks } from "./helpUi";
import {
  PRINTABLE_GUIDES,
  articleBySlug,
  type HelpArticle,
} from "@/lib/help/content";
import { useSchoolProfile } from "@/hooks/useSettings";
import { Printer, ArrowLeft } from "lucide-react";

/** A printable guide assembled from existing articles — no duplicated text. */
export default function PrintableGuidePage() {
  const { slug = "" } = useParams();
  const guide = PRINTABLE_GUIDES.find((g) => g.slug === slug);
  const { data: school } = useSchoolProfile();

  if (!guide) {
    return (
      <DashboardLayout>
        <Card className="mx-auto max-w-lg">
          <CardContent className="space-y-3 p-6 text-center">
            <p className="text-sm font-medium">Guide not found</p>
            <Button size="sm" variant="outline" asChild>
              <Link to="/help">Back to Help Center</Link>
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const articles = guide.articles
    .map((s) => articleBySlug(s))
    .filter((a): a is HelpArticle => Boolean(a));

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/help">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Help Center
            </Link>
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="mr-1.5 h-4 w-4" /> Print / Save as PDF
          </Button>
        </div>

        <header>
          <h1 className="text-2xl font-semibold tracking-tight">{guide.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            For {guide.audience}
            {school?.name ? ` · ${school.name}` : ""}
          </p>
        </header>

        <Card className="print:border-0 print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Contents</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
              {articles.map((a) => (
                <li key={a.slug}>{a.title}</li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {articles.map((a, i) => (
          <section key={a.slug} className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">
                {i + 1}. {a.title}
              </h2>
              <p className="text-sm text-muted-foreground">{a.summary}</p>
            </div>
            <HelpBlocks blocks={a.blocks} />
          </section>
        ))}
      </div>
    </DashboardLayout>
  );
}
