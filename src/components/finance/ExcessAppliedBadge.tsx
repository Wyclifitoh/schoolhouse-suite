import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const money = (v: number) =>
  Number(v || 0).toLocaleString("en-KE", { maximumFractionDigits: 2 });

interface Props {
  /** How much of this row was funded by previously banked excess credit. */
  amount?: number;
  /** Optional term the credit originally came from. */
  fromTerm?: string | null;
  className?: string;
}

/**
 * Marks money that did NOT arrive as a new transaction: it was an
 * overpayment banked as excess credit earlier and later applied to a fee.
 * Without this badge the same shilling looks like two separate payments.
 */
export function ExcessAppliedBadge({ amount, fromTerm, className }: Props) {
  if (!amount || Number(amount) <= 0) return null;
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`gap-1 border-primary/40 bg-primary/10 text-[10px] font-medium text-primary ${className || ""}`}
          >
            <Sparkles className="h-3 w-3" />
            From excess
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-[260px] text-xs">
          KES {money(Number(amount))} of this was not a new payment — it is
          excess (overpayment)
          {fromTerm ? ` carried from ${fromTerm}` : " carried from an earlier term"}{" "}
          that was applied to this fee. The original receipt stays unchanged.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
