import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import {
  REPORT_CATEGORIES,
  reportsByCategory,
  searchReports,
  type ReportCategoryId,
} from "@/lib/reportCatalog";

export default function ReportCategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const category = REPORT_CATEGORIES.find((c) => c.id === categoryId);
  const pool = useMemo(
    () => (category ? reportsByCategory(category.id as ReportCategoryId) : []),
    [category],
  );
  const list = useMemo(() => searchReports(q, pool), [q, pool]);

  if (!category) {
    return (
      <DashboardLayout title="Reports" subtitle="Unknown report category">
        <Card className="p-8 text-center text-sm text-muted-foreground">
          That report category does not exist.{" "}
          <Button variant="link" onClick={() => navigate("/reports")}>
            Back to Report Center
          </Button>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={`${category.label} Reports`}
      subtitle={category.description}
    >
      <div className="relative mb-5 max-w-lg">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${category.label.toLowerCase()} reports…`}
          className="pl-9"
        />
      </div>

      {list.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No reports found.
        </Card>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {list.map((r) => (
            <Card key={r.id} className="flex items-start gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{r.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {r.description}
                </p>
              </div>
              <Button size="sm" onClick={() => navigate(r.url)}>
                View
              </Button>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
