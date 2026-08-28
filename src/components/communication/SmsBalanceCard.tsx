import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Wallet } from "lucide-react";
import {
  useSmsBalance,
  useRefreshSmsBalance,
} from "@/hooks/useCommunicationHub";
import { Skeleton } from "@/components/ui/skeleton";

export function SmsBalanceCard() {
  const { data, isLoading, isError } = useSmsBalance();
  const refresh = useRefreshSmsBalance();
  const paybill = data?.paybill || "4116251";
  const account = data?.account || null;
  const configured = data?.configured !== false;
  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-primary/0 to-primary/5">
      <CardContent className="p-5 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-primary">
              <Wallet className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">
                SMS Balance
              </span>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              disabled={refresh.isPending}
              onClick={() => refresh.mutate()}
              title="Refresh balance"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${refresh.isPending ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : isError ? (
            <div className="text-sm text-destructive">Unable to fetch</div>
          ) : !configured ? (
            <div>
              <p className="text-sm text-muted-foreground">
                SMS account not yet provisioned by the platform.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-3xl font-bold text-foreground">
                {data?.balance != null
                  ? Number(data.balance).toLocaleString()
                  : "—"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                credits available · updates every 5 minutes
              </p>
            </div>
          )}
        </div>

        {/* Top-up via M-Pesa */}
        <div className="rounded-md bg-background/70 border p-3 space-y-1.5">
          <p className="text-[11px] uppercase text-muted-foreground tracking-wide font-semibold">
            Top up via M-Pesa
          </p>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Paybill</span>
            <span className="font-mono font-semibold">{paybill}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Account</span>
            <span className="font-mono font-semibold">
              {account || (
                <span className="text-muted-foreground italic">not set</span>
              )}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground pt-1">
            {account
              ? "Balance reflects within minutes after payment."
              : "Ask the platform admin to assign your SMS account number."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
