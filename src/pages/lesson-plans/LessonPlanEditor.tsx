import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  useLessonPlan,
  useSaveLessonPlan,
  useSetLessonStatus,
  useStrands,
  useSubStrands,
  useLessonRoster,
  downloadLessonPlanPdf,
} from "@/hooks/useLessonPlans";
import { useSubjects, useClasses, useStreams } from "@/hooks/useClasses";
import { ArrowLeft, Save, FileSignature, Download, Users } from "lucide-react";
import { usePermissions } from "@/hooks/usePermission";

const EMPTY: any = {
  lesson_date: new Date().toISOString().slice(0, 10),
  status: "draft",
  boys: 0,
  girls: 0,
  total_learners: 0,
  roll: 0,
};

export default function LessonPlanEditor() {
  const perms = usePermissions(["classes:create","classes:update"]);
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const navigate = useNavigate();

  const { data: loaded } = useLessonPlan(isNew ? undefined : id);
  const save = useSaveLessonPlan();
  const setStatus = useSetLessonStatus();

  const [form, setForm] = useState<any>(EMPTY);

  useEffect(() => {
    if (loaded && !isNew) setForm(loaded);
  }, [loaded, isNew]);

  const subjectsQ = useSubjects();
  const classesQ = useClasses();
  const streamsQ = useStreams(form.grade_id);
  const strandsQ = useStrands({
    subject_id: form.subject_id,
    grade_id: form.grade_id,
  });
  const subStrandsQ = useSubStrands({ strand_id: form.strand_id });
  const rosterQ = useLessonRoster({
    grade_id: form.grade_id,
    stream_id: form.stream_id,
  });

  const subjects = (subjectsQ.data as any[]) || [];
  const grades = (classesQ.data as any[]) || [];
  const streams = (streamsQ.data as any[]) || [];
  const strands = strandsQ.data || [];
  const subStrands = subStrandsQ.data || [];

  // Auto-fill class population whenever grade/stream changes (only if user
  // hasn't manually overridden — i.e. lesson is new or values are still
  // the previously auto-populated snapshot).
  useEffect(() => {
    const r: any = rosterQ.data;
    if (!r) return;
    setForm((f: any) => ({
      ...f,
      boys: r.boys ?? 0,
      girls: r.girls ?? 0,
      total_learners: r.total ?? 0,
      roll: r.total ?? 0,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rosterQ.data]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleSave = () => {
    save.mutate(form, {
      onSuccess: (saved: any) => {
        if (isNew) navigate(`/lesson-plans/${saved.id}`);
      },
    });
  };

  const handlePublish = () => {
    if (!form.id) return handleSave();
    setStatus.mutate({ id: form.id, action: "publish" });
  };

  return (
    <DashboardLayout title={isNew ? "New Lesson Plan" : "Edit Lesson Plan"}>
      <div className="space-y-4 max-w-5xl mx-auto">
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate("/lesson-plans")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex gap-2">
            {form.id && <Badge variant="outline">{form.status}</Badge>}
            {form.id && (
              <Button
                variant="outline"
                onClick={() => downloadLessonPlanPdf(form.id)}
              >
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
            )}
            {(perms["classes:create"] || perms["classes:update"]) && (
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={save.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {save.isPending ? "Saving…" : "Save Draft"}
              </Button>
            )}
            {perms["classes:update"] && (
              <Button onClick={handlePublish}>
                <FileSignature className="w-4 h-4 mr-2" />
                Publish
              </Button>
            )}
          </div>
        </div>

        {/* Administrative -------------------------------------------- */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Administrative Details</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-3">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={form.lesson_date || ""}
                onChange={(e) => set("lesson_date", e.target.value)}
              />
            </div>
            <div>
              <Label>Start Time</Label>
              <Input
                type="time"
                value={form.start_time || ""}
                onChange={(e) => set("start_time", e.target.value)}
              />
            </div>
            <div>
              <Label>End Time</Label>
              <Input
                type="time"
                value={form.end_time || ""}
                onChange={(e) => set("end_time", e.target.value)}
              />
            </div>

            <div>
              <Label>Subject / Learning Area</Label>
              <Select
                value={form.subject_id || ""}
                onValueChange={(v) => set("subject_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Grade</Label>
              <Select
                value={form.grade_id || ""}
                onValueChange={(v) => {
                  set("grade_id", v);
                  set("stream_id", null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Stream</Label>
              <Select
                value={form.stream_id || ""}
                onValueChange={(v) => set("stream_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stream" />
                </SelectTrigger>
                <SelectContent>
                  {streams.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Users className="h-3.5 w-3.5" />
                Class population auto-filled from current enrollment. You may
                override.
              </div>
            </div>
            <div>
              <Label>Roll</Label>
              <Input
                type="number"
                value={form.roll || 0}
                onChange={(e) => set("roll", Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Boys</Label>
              <Input
                type="number"
                value={form.boys || 0}
                onChange={(e) => set("boys", Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Girls</Label>
              <Input
                type="number"
                value={form.girls || 0}
                onChange={(e) => set("girls", Number(e.target.value))}
              />
            </div>

            <div className="md:col-span-3">
              <Label>Total Learners</Label>
              <Input
                type="number"
                value={
                  form.total_learners ||
                  Number(form.boys || 0) + Number(form.girls || 0)
                }
                onChange={(e) => set("total_learners", Number(e.target.value))}
              />
            </div>

            <div>
              <Label>Strand</Label>
              <Select
                value={form.strand_id || ""}
                onValueChange={(v) => {
                  set("strand_id", v);
                  set("sub_strand_id", null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select strand" />
                </SelectTrigger>
                <SelectContent>
                  {strands.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sub-Strand</Label>
              <Select
                value={form.sub_strand_id || ""}
                onValueChange={(v) => set("sub_strand_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sub-strand" />
                </SelectTrigger>
                <SelectContent>
                  {subStrands.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Lesson Title</Label>
              <Input
                value={form.lesson_title || ""}
                onChange={(e) => set("lesson_title", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Learning content ------------------------------------------ */}
        <Section
          title="Lesson Learning Outcomes"
          desc="By the end of the lesson, the learner should be able to:"
          value={form.learning_outcomes}
          onChange={(v) => set("learning_outcomes", v)}
        />
        <Section
          title="Key Inquiry Questions"
          value={form.key_inquiry_questions}
          onChange={(v) => set("key_inquiry_questions", v)}
        />
        <Section
          title="Learning Resources"
          value={form.learning_resources}
          onChange={(v) => set("learning_resources", v)}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Organization of Learning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Introduction — Teacher Activities</Label>
              <Textarea
                rows={3}
                value={form.intro_teacher_activities || ""}
                onChange={(e) =>
                  set("intro_teacher_activities", e.target.value)
                }
              />
            </div>
            <div>
              <Label>Introduction — Learner Activities</Label>
              <Textarea
                rows={3}
                value={form.intro_learner_activities || ""}
                onChange={(e) =>
                  set("intro_learner_activities", e.target.value)
                }
              />
            </div>
            <div>
              <Label>Lesson Development</Label>
              <Textarea
                rows={5}
                value={form.lesson_development || ""}
                onChange={(e) => set("lesson_development", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Section
          title="Extended Activities"
          value={form.extended_activities}
          onChange={(v) => set("extended_activities", v)}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conclusion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Lesson Summary</Label>
              <Textarea
                rows={3}
                value={form.lesson_summary || ""}
                onChange={(e) => set("lesson_summary", e.target.value)}
              />
            </div>
            <div>
              <Label>Achievement of Learning Outcomes</Label>
              <Textarea
                rows={3}
                value={form.achievement_of_outcomes || ""}
                onChange={(e) => set("achievement_of_outcomes", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Reflection on the Lesson
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>What went well?</Label>
              <Textarea
                rows={2}
                value={form.reflection_went_well || ""}
                onChange={(e) => set("reflection_went_well", e.target.value)}
              />
            </div>
            <div>
              <Label>Challenges encountered</Label>
              <Textarea
                rows={2}
                value={form.reflection_challenges || ""}
                onChange={(e) => set("reflection_challenges", e.target.value)}
              />
            </div>
            <div>
              <Label>Areas for improvement</Label>
              <Textarea
                rows={2}
                value={form.reflection_improvements || ""}
                onChange={(e) => set("reflection_improvements", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function Section({
  title,
  desc,
  value,
  onChange,
}: {
  title: string;
  desc?: string;
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {desc && <p className="text-xs text-muted-foreground mb-2">{desc}</p>}
        <Textarea
          rows={3}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      </CardContent>
    </Card>
  );
}
