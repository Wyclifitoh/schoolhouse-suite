import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAssessmentsList } from "@/hooks/useAssessments";
import { useGrades, useStreams } from "@/hooks/useGrades";
import { Download, FileText, Layers } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export default function SummativeReports() {
  const { data: assessments = [] } = useAssessmentsList();
  const { data: grades = [] } = useGrades();
  
  const [gradeId, setGradeId] = useState("");
  const [streamId, setStreamId] = useState("");
  const { data: streams = [] } = useStreams(gradeId || undefined);
  
  const [selectedAssessments, setSelectedAssessments] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState("Summative Term Report");
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleAssessment = (id: string) => {
    const next = new Set(selectedAssessments);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedAssessments(next);
  };

  const generateReport = async () => {
    if (!gradeId) return toast.error("Please select a class.");
    if (selectedAssessments.size < 2) return toast.error("Please select at least 2 assessments to combine.");

    setIsGenerating(true);
    toast.loading("Generating summative reports...", { id: "summative" });
    try {
      const token = api.getToken();
      const schoolId = localStorage.getItem("chuo-school-id") || "";
      const response = await fetch(`${import.meta.env.VITE_API_URL || "https://chuoapi.wikiteq.co.ke/api/v1"}/assessments/summative-report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "X-School-ID": schoolId
        },
        body: JSON.stringify({
          assessmentIds: Array.from(selectedAssessments),
          gradeId,
          streamId: streamId || undefined,
          title
        })
      });
      
      if (!response.ok) {
        let msg = "Failed to generate report";
        try { const err = await response.json(); msg = err.error || msg; } catch (e) {}
        throw new Error(msg);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${title.replace(/\s+/g, "_")}_${new Date().getTime()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      
      toast.success("Summative reports generated successfully!", { id: "summative" });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to generate reports. Please try again.", { id: "summative" });
    } finally {
      setIsGenerating(false);
    }
  };

  // Group assessments by academic year and term to make selection easier
  // For simplicity, we just list them out sorted by newest first
  const sortedAssessments = [...assessments].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

  return (
    <DashboardLayout
      title="Summative Reports"
      subtitle="Combine multiple assessments into a single comprehensive report card (Term or Year reports)"
    >
      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Select Assessments to Combine
              </CardTitle>
              <CardDescription>
                Choose the assessments you want to aggregate. The scores will be averaged to produce a final summative grade.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {sortedAssessments.map((a) => (
                  <div key={a.id} className="flex items-start space-x-3 p-3 rounded-md border hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => toggleAssessment(a.id)}>
                    <Checkbox id={`a-${a.id}`} checked={selectedAssessments.has(a.id)} onCheckedChange={() => toggleAssessment(a.id)} className="mt-1" />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={`a-${a.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {a.name}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {a.status} • {a.created_at ? new Date(a.created_at).toLocaleDateString() : ""}
                      </p>
                    </div>
                  </div>
                ))}
                {assessments.length === 0 && (
                  <div className="text-center p-4 text-muted-foreground">No assessments available.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Report Title</label>
                <Select value={title} onValueChange={setTitle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Summative Term Report">Summative Term Report</SelectItem>
                    <SelectItem value="Summative Year Report">Summative Year Report</SelectItem>
                    <SelectItem value="End of Term Report">End of Term Report</SelectItem>
                    <SelectItem value="End of Year Report">End of Year Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Target Class</label>
                <Select value={gradeId} onValueChange={(v) => { setGradeId(v); setStreamId(""); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class..." />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map(g => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Target Stream (Optional)</label>
                <Select value={streamId || "all"} onValueChange={(v) => setStreamId(v === "all" ? "" : v)} disabled={!gradeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="All streams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All streams</SelectItem>
                    {streams.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t">
                <div className="text-sm text-muted-foreground mb-4">
                  Selected: <strong>{selectedAssessments.size}</strong> assessments
                </div>
                <Button className="w-full" onClick={generateReport} disabled={isGenerating || selectedAssessments.size < 2 || !gradeId}>
                  {isGenerating ? "Generating..." : <><Download className="h-4 w-4 mr-2" /> Download PDF</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
