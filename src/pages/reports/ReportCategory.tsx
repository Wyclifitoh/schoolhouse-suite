import { useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowLeft, ArrowRight } from "lucide-react";
import {
  categoryByKey,
  searchReports,
  ReportCategoryKey,
} from "./reportRegistry";

export default function ReportCategoryPage() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const cat = categoryByKey(category);

  const reports = useMemo(
    () => (cat ? searchReports(query, cat.key as ReportCategoryKey) : []),
    [cat, query],
  );

  if (!cat) {
    return (
      <DashboardLayout title="Reports" subtitle="Category not found">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              That report category does not exist.
            </p>
            <Button className="mt-4" onClick={() => navigate("/reports")}>
              Back to Report Center
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`${cat.label} Reports`} subtitle={cat.description}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          to="/reports"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Report Center
        </Link>
        <div className="relative sm:ml-auto sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${cat.label.toLowerCase()} reports...`}
            className="pl-9"
            aria-label={`Search ${cat.label} reports`}
          />
        </div>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No reports match your search.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {reports.map((r) => (
            <Card key={r.id} className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-start gap-3 p-4">
                {r.icon && (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <r.icon className="h-4 w-4" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {r.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {r.description}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 gap-1"
                  onClick={() => navigate(r.url)}
                >
                  View <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
