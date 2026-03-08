import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FinanceError, FINANCE_ERROR_MESSAGES } from "@/lib/errors";

interface FinanceErrorAlertProps {
  error: FinanceError | Error | string;
}

export function FinanceErrorAlert({ error }: FinanceErrorAlertProps) {
  const message =
    error instanceof FinanceError
      ? FINANCE_ERROR_MESSAGES[error.code] || error.message
      : error instanceof Error
        ? error.message
        : String(error);

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Transaction Failed</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
