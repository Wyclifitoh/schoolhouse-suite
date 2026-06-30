import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useAudit } from "@/hooks/usePlatform";

export default function AdminAudit() {
  const { data = [], isLoading } = useAudit();
  return (
    <div className="p-6 space-y-6 max-w-[1200px]">
      <div>
        <h1 className="text-3xl font-black">Platform audit log</h1>
        <p className="text-muted-foreground">Every action taken from this console.</p>
      </div>
      <Card><CardContent className="p-0 overflow-x-auto">
        {isLoading ? <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground border-b bg-muted/30">
              <tr><th className="p-3">When</th><th className="p-3">Actor</th><th className="p-3">Action</th><th className="p-3">School</th><th className="p-3">Payload</th></tr>
            </thead>
            <tbody>
              {data.map((e: any) => (
                <tr key={e.id} className="border-b">
                  <td className="p-3 text-xs">{new Date(e.created_at).toLocaleString()}</td>
                  <td className="p-3 text-xs">{e.actor_email || e.actor_id}</td>
                  <td className="p-3 font-medium">{e.action}</td>
                  <td className="p-3 text-xs">{e.target_school_id || "—"}</td>
                  <td className="p-3 text-xs font-mono">{e.payload ? JSON.stringify(e.payload) : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent></Card>
    </div>
  );
}
