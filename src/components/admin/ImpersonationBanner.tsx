import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getImpersonation,
  endImpersonation,
  ImpersonationMeta,
} from "@/lib/impersonation";
import { useQueryClient } from "@tanstack/react-query";

export function ImpersonationBanner() {
  const [meta, setMeta] = useState<ImpersonationMeta | null>(() =>
    getImpersonation(),
  );
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    // re-check on route changes / storage updates
    const sync = () => setMeta(getImpersonation());
    window.addEventListener("storage", sync);
    const t = setInterval(sync, 30_000);
    return () => {
      window.removeEventListener("storage", sync);
      clearInterval(t);
    };
  }, []);

  if (!meta) return null;

  const exit = () => {
    endImpersonation();
    qc.clear();
    navigate("/admin/schools", { replace: true });
    // Hard reload to fully drop any school-scoped state.
    setTimeout(() => window.location.reload(), 50);
  };

  return (
    <div className="sticky top-0 z-[60] w-full bg-rose-600 text-white shadow-md">
      <div className="max-w-[1500px] mx-auto flex items-center gap-3 px-4 py-2 text-sm">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="font-bold">Impersonating</span>{" "}
          <span className="opacity-90">
            {meta.school_name} · signed in as {meta.as_email}
          </span>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="h-7 bg-white/95 text-rose-700 hover:bg-white"
          onClick={exit}
        >
          <LogOut className="h-3 w-3 mr-1" />
          Exit impersonation
        </Button>
      </div>
    </div>
  );
}