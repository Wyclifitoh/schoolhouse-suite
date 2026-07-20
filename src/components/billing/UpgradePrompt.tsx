import { Link } from "react-router-dom";
import { Lock, Sparkles, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  module: string;
  reason?: string;
}

const LABELS: Record<string, string> = {
  assessments: "Assessments & Report Cards",
  finance: "Finance & Payments",
  inventory: "Inventory & Library",
  hr: "HR & Payroll",
  communication: "Communication",
  portal: "Parent / Student Portal",
};

export function UpgradePrompt({ module, reason }: Props) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="max-w-lg w-full border-primary/30 shadow-xl">
        <CardContent className="p-8 text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Lock className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-black">
              {LABELS[module] || module} is locked
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              {reason || "This module is not included in your current plan. Upgrade or renew to unlock it for your school."}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="font-semibold">
              <Link to="/settings/billing">
                <Sparkles className="mr-2 h-4 w-4" />
                View plans & upgrade
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
