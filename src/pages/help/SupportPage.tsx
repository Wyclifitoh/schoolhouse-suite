import { useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FeedbackDialog,
  ReportProblemDialog,
  APP_VERSION,
} from "@/components/help/SupportDialogs";
import { useSchoolProfile } from "@/hooks/useSettings";
import { useAuth } from "@/contexts/AuthContext";
import { Bug, MessageSquare, LifeBuoy, BookOpen, Sparkles } from "lucide-react";

/** Get help — support entry point with the context our team needs. */
export default function SupportPage() {
  const [report, setReport] = useState(false);
  const [feedback, setFeedback] = useState(false);
  const { data: school } = useSchoolProfile();
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Get help</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Report a problem, send feedback, or browse the guides first — most
            questions are answered there.
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Bug className="h-4 w-4 text-muted-foreground" /> Report a problem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Something not working as expected? We automatically attach the
                page, your school and the app version so you don't have to
                explain the technical details.
              </p>
              <Button size="sm" onClick={() => setReport(true)}>
                Report a problem
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <MessageSquare className="h-4 w-4 text-muted-foreground" /> Send
                feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <p className="text-xs leading-relaxed text-muted-foreground">
                Ideas, wording that confused you, or a workflow you wish were
                faster — it all helps shape Chuo.
              </p>
              <Button size="sm" variant="outline" onClick={() => setFeedback(true)}>
                Give feedback
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Before you write in</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 pt-0 sm:grid-cols-3">
            <Button variant="ghost" className="justify-start" asChild>
              <Link to="/help/troubleshooting">
                <LifeBuoy className="mr-2 h-4 w-4" /> Troubleshooting
              </Link>
            </Button>
            <Button variant="ghost" className="justify-start" asChild>
              <Link to="/help">
                <BookOpen className="mr-2 h-4 w-4" /> Help Center
              </Link>
            </Button>
            <Button variant="ghost" className="justify-start" asChild>
              <Link to="/whats-new">
                <Sparkles className="mr-2 h-4 w-4" /> What's new
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Your details</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <dl className="grid gap-2 text-xs sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">School</dt>
                <dd className="font-medium">{school?.name || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Signed in as</dt>
                <dd className="font-medium">{user?.email || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">App version</dt>
                <dd className="font-medium">{APP_VERSION}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              These details are attached automatically to anything you send.
            </p>
          </CardContent>
        </Card>
      </div>

      <ReportProblemDialog open={report} onOpenChange={setReport} />
      <FeedbackDialog open={feedback} onOpenChange={setFeedback} />
    </DashboardLayout>
  );
}
