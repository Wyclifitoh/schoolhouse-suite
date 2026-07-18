import { PortalShell } from "@/components/portal/PortalShell";
import { useSelectedChild } from "@/contexts/SelectedChildContext";
import { usePortalProfile } from "@/hooks/usePortalApiExtended";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";

export default function ProfilePage() {
  return (
    <PortalShell title="Student Profile" subtitle="Personal & academic details">
      <Body />
    </PortalShell>
  );
}

function Field({ label, value }: { label: string; value?: any }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{label}</p>
      <p className="text-sm font-semibold">{value ?? "—"}</p>
    </div>
  );
}

function Body() {
  const { selected } = useSelectedChild();
  const { data: p, isLoading } = usePortalProfile(selected?.id);
  if (isLoading) return <Skeleton className="h-72 w-full" />;
  if (!p) return null;
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b">
          <div className="h-24 w-24 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl font-black text-primary overflow-hidden">
            {p.photo_url ? (
              <img src={p.photo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <User className="h-10 w-10" />
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-black">{p.full_name}</h2>
            <p className="text-sm text-muted-foreground">{p.admission_number}</p>
            <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
              <Badge variant="outline">{p.grade_name || "—"}</Badge>
              {p.stream_name && <Badge variant="outline">{p.stream_name}</Badge>}
              {p.house && <Badge variant="outline">House: {p.house}</Badge>}
              <Badge variant={p.status === "active" ? "default" : "secondary"} className="capitalize">
                {p.status || "—"}
              </Badge>
            </div>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-6">
          <Field label="Gender" value={p.gender} />
          <Field label="Date of Birth" value={p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString() : "—"} />
          <Field label="Nationality" value={p.nationality} />
          <Field label="Religion" value={p.religion} />
          <Field label="UPI (CBE)" value={p.upi} />
          <Field label="Admission Date" value={p.admission_date ? new Date(p.admission_date).toLocaleDateString() : "—"} />
          <Field label="Class" value={p.grade_name} />
          <Field label="Stream" value={p.stream_name} />
          <Field label="House" value={p.house} />
          <Field label="Primary Contact" value={p.parent_name} />
          <Field label="Contact Phone" value={p.parent_phone} />
        </div>
      </CardContent>
    </Card>
  );
}