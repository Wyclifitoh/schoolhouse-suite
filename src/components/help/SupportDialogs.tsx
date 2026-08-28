import { useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldHint } from "@/components/help/HelpPrimitives";
import { Bug, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export const APP_VERSION = "2026.08";

interface SupportPayload {
  kind: "problem" | "feedback";
  message: string;
  intent?: string;
  subject?: string;
  rating?: number;
  route: string;
  module: string;
  app_version: string;
  user_agent: string;
  viewport: string;
}

function useSubmitSupport() {
  const [saving, setSaving] = useState(false);
  const submit = async (payload: SupportPayload) => {
    setSaving(true);
    try {
      const res = await api.post<{ reference_id?: string }>(
        "/support/reports",
        payload,
      );
      const ref =
        (res as any)?.reference_id || (res as any)?.data?.reference_id || null;
      toast.success(
        payload.kind === "problem"
          ? ref
            ? `Report received — reference ${ref}`
            : "Report received"
          : "Thank you for your feedback",
      );
      return true;
    } catch {
      toast.error(
        "We couldn't send that just now. Please check your connection and try again.",
      );
      return false;
    } finally {
      setSaving(false);
    }
  };
  return { submit, saving };
}

/**
 * REPORT A PROBLEM
 * Captures the technical context automatically so the user only has to say
 * what went wrong.
 */
export function ReportProblemDialog({
  open,
  onOpenChange,
  errorReference,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  errorReference?: string;
}) {
  const location = useLocation();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [intent, setIntent] = useState("");
  const { submit, saving } = useSubmitSupport();

  const context = {
    route: location.pathname,
    module: location.pathname.split("/")[1] || "dashboard",
    app_version: APP_VERSION,
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    viewport:
      typeof window !== "undefined"
        ? `${window.innerWidth}x${window.innerHeight}`
        : "",
  };

  const handleSubmit = async () => {
    if (!message.trim()) return;
    const ok = await submit({
      kind: "problem",
      subject: errorReference ? `Error ${errorReference}` : undefined,
      message,
      intent,
      ...context,
    });
    if (ok) {
      setMessage("");
      setIntent("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-4 w-4 text-destructive" aria-hidden="true" />
            Report a problem
          </DialogTitle>
          <DialogDescription>
            Tell us what went wrong. Chuo attaches the page, your account and
            device details automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="report-what">What went wrong?</Label>
            <Textarea
              id="report-what"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe what you saw..."
            />
          </div>
          <div>
            <Label htmlFor="report-intent">
              What were you trying to do?{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="report-intent"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              placeholder="e.g. Recording a payment for a Grade 5 student"
            />
          </div>
          <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Attached automatically</p>
            <ul className="mt-1 space-y-0.5">
              <li>Page: {context.route}</li>
              <li>User: {user?.email || user?.id || "signed-in user"}</li>
              <li>Version: {APP_VERSION}</li>
              <li>Screen: {context.viewport}</li>
              {errorReference && <li>Reference: {errorReference}</li>}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !message.trim()}>
            {saving ? "Sending..." : "Send report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** GIVE FEEDBACK — deliberately lightweight, never auto-prompted. */
export function FeedbackDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const location = useLocation();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const { submit, saving } = useSubmitSupport();

  const handleSubmit = async () => {
    if (!rating && !comment.trim()) return;
    const ok = await submit({
      kind: "feedback",
      message: comment.trim() || `Rated ${rating} of 5`,
      rating: rating || undefined,
      route: location.pathname,
      module: location.pathname.split("/")[1] || "dashboard",
      app_version: APP_VERSION,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      viewport:
        typeof window !== "undefined"
          ? `${window.innerWidth}x${window.innerHeight}`
          : "",
    });
    if (ok) {
      setRating(0);
      setComment("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>How is Chuo working for you?</DialogTitle>
          <DialogDescription>
            Your feedback goes to your school's Chuo team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div
            className="flex items-center gap-1"
            role="radiogroup"
            aria-label="Rating out of five"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                onClick={() => setRating(n)}
                className="rounded p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Star
                  className={cn(
                    "h-6 w-6",
                    n <= rating
                      ? "fill-primary text-primary"
                      : "text-muted-foreground",
                  )}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
          <div>
            <Label htmlFor="feedback-comment">
              Tell us what could be better{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="feedback-comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <FieldHint>
              Please don't include passwords or payment card details.
            </FieldHint>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || (!rating && !comment.trim())}
          >
            {saving ? "Sending..." : "Send feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
