import { Card } from "@/components/ui/card";
import { Mail, MessageSquare } from "lucide-react";

export function SmsPreview({ message, sender = "CHUO" }: { message: string; sender?: string }) {
  return (
    <div className="mx-auto w-full max-w-[280px]">
      <div className="rounded-[2rem] bg-slate-900 p-3 shadow-xl border-4 border-slate-800">
        <div className="bg-slate-100 rounded-[1.5rem] p-3 min-h-[320px] flex flex-col">
          <div className="text-center pb-2 border-b border-slate-200">
            <p className="text-[10px] font-medium text-slate-500">SMS</p>
            <p className="text-xs font-semibold text-slate-900">{sender}</p>
          </div>
          <div className="flex-1 py-3">
            {message ? (
              <div className="bg-white rounded-2xl rounded-tl-sm p-3 shadow-sm max-w-[85%]">
                <p className="text-xs text-slate-800 whitespace-pre-wrap break-words">{message}</p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                <MessageSquare className="h-4 w-4 mr-1.5" /> Message preview
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function EmailPreview({ subject, body, sender = "CHUO" }: { subject: string; body: string; sender?: string }) {
  return (
    <Card className="p-4 max-w-md mx-auto bg-background">
      <div className="flex items-center gap-2 pb-3 border-b">
        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <Mail className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold truncate">{sender}</p>
          <p className="text-[10px] text-muted-foreground truncate">to parent@example.com</p>
        </div>
      </div>
      <p className="text-sm font-semibold mt-3 mb-2">{subject || "(no subject)"}</p>
      {body ? (
        <div className="text-xs text-muted-foreground max-h-64 overflow-auto prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: body }} />
      ) : (
        <p className="text-xs text-muted-foreground italic">Email body preview…</p>
      )}
    </Card>
  );
}