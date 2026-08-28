import { ReactNode } from "react";
import { Link } from "react-router-dom";
import * as Icons from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  HELP_CATEGORIES,
  HelpCategoryId,
  type HelpArticle,
  type HelpBlock,
  type TroubleshootingArticle,
} from "@/lib/help/content";

export function CategoryIcon({
  name,
  className = "h-4 w-4",
}: {
  name: string;
  className?: string;
}) {
  const Cmp = (Icons as unknown as Record<string, Icons.LucideIcon>)[name] ||
    Icons.BookOpen;
  return <Cmp className={className} aria-hidden="true" />;
}

export const categoryTitle = (id?: HelpCategoryId) =>
  HELP_CATEGORIES.find((c) => c.id === id)?.title || "Help";

export function HelpBlocks({ blocks }: { blocks: HelpBlock[] }) {
  return (
    <div className="space-y-3">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "heading":
            return (
              <h3 key={i} className="pt-2 text-sm font-semibold">
                {b.text}
              </h3>
            );
          case "p":
            return (
              <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                {b.text}
              </p>
            );
          case "steps":
            return (
              <ol
                key={i}
                className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground"
              >
                {b.items.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ol>
            );
          case "list":
            return (
              <ul
                key={i}
                className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground"
              >
                {b.items.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            );
          case "note":
            return (
              <div
                key={i}
                className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm leading-relaxed"
              >
                {b.text}
              </div>
            );
          case "warning":
            return (
              <div
                key={i}
                className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm leading-relaxed"
              >
                {b.text}
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

export function ArticleCard({
  to,
  title,
  summary,
  badge,
  icon,
}: {
  to: string;
  title: string;
  summary: string;
  badge?: string;
  icon?: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="h-full transition-colors hover:border-primary/40 hover:bg-muted/40">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            {icon}
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {summary}
              </p>
              {badge && (
                <Badge variant="secondary" className="mt-2 text-[10px]">
                  {badge}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export const articleHref = (a: HelpArticle) => `/help/a/${a.slug}`;
export const troubleshootingHref = (a: TroubleshootingArticle) =>
  `/help/t/${a.slug}`;
