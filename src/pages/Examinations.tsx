import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { exams, examSchedules, marksRegister, gradingSystem, classes } from "@/data/mockData";
import {
  ClipboardCheck, Plus, Calendar, Award, BookOpen, FileText, Download,
  TrendingUp, Users, BarChart3, Medal, Layers, GraduationCap, Target,
  Star, Palette, Globe, Calculator, FlaskConical, BookMarked, Music,
} from "lucide-react";

// ===== KENYAN CBC CURRICULUM DATA =====
const cbcLevels = [
  { id: "pp", name: "Pre-Primary", grades: ["PP1", "PP2"], years: "4-6 yrs", color: "bg-pink-500/10 text-pink-600" },
  { id: "lower", name: "Lower Primary", grades: ["Grade 1", "Grade 2", "Grade 3"], years: "6-9 yrs", color: "bg-primary/10 text-primary" },
  { id: "upper", name: "Upper Primary", grades: ["Grade 4", "Grade 5", "Grade 6"], years: "9-12 yrs", color: "bg-info/10 text-info" },
  { id: "junior", name: "Junior Secondary", grades: ["Grade 7", "Grade 8", "Grade 9"], years: "12-15 yrs", color: "bg-success/10 text-success" },
  { id: "senior", name: "Senior Secondary", grades: ["Grade 10", "Grade 11", "Grade 12"], years: "15-18 yrs", color: "bg-warning/10 text-warning" },
];

const cbcLearningAreas = {
  "Pre-Primary": [
    { id: "la1", name: "Language Activities", icon: BookOpen, strands: ["Listening & Speaking", "Reading", "Writing", "Book & Print Awareness"], assessment: "Rubric" },
    { id: "la2", name: "Mathematical Activities", icon: Calculator, strands: ["Number Concepts", "Geometry", "Measurement", "Patterns"], assessment: "Rubric" },
    { id: "la3", name: "Environmental Activities", icon: Globe, strands: ["Living Things", "Non-Living Things", "Weather", "Safety"], assessment: "Rubric" },
    { id: "la4", name: "Psychomotor & Creative Activities", icon: Palette, strands: ["Physical Education", "Art & Craft", "Music"], assessment: "Rubric" },
    { id: "la5", name: "Religious Education", icon: Star, strands: ["CRE", "IRE", "HRE"], assessment: "Rubric" },
  ],
  "Lower Primary": [
    { id: "la6", name: "English Language", icon: BookOpen, strands: ["Listening & Speaking", "Reading", "Writing", "Language Structure"], assessment: "Rubric" },
    { id: "la7", name: "Kiswahili / KSL", icon: BookMarked, strands: ["Kusikiliza na Kuzungumza", "Kusoma", "Kuandika", "Sarufi"], assessment: "Rubric" },
    { id: "la8", name: "Mathematics", icon: Calculator, strands: ["Numbers", "Geometry", "Measurement", "Data Handling"], assessment: "Rubric" },
    { id: "la9", name: "Environmental Activities", icon: Globe, strands: ["Social Environment", "Physical Environment", "Biological Environment"], assessment: "Rubric" },
    { id: "la10", name: "Hygiene & Nutrition", icon: FlaskConical, strands: ["Personal Hygiene", "Food & Nutrition", "Safety"], assessment: "Rubric" },
    { id: "la11", name: "Religious Education", icon: Star, strands: ["CRE", "IRE", "HRE"], assessment: "Rubric" },
    { id: "la12", name: "Movement & Creative Activities", icon: Palette, strands: ["PE", "Art & Craft", "Music"], assessment: "Rubric" },
    { id: "la13", name: "Indigenous Languages", icon: Music, strands: ["Oral Skills", "Reading", "Writing"], assessment: "Rubric" },
  ],
  "Upper Primary": [
    { id: "la14", name: "English Language", icon: BookOpen, strands: ["Listening & Speaking", "Reading", "Writing", "Grammar", "Literature"], assessment: "Formative + Summative" },
    { id: "la15", name: "Kiswahili / KSL", icon: BookMarked, strands: ["Kusikiliza na Kuzungumza", "Kusoma", "Kuandika", "Sarufi", "Fasihi"], assessment: "Formative + Summative" },
    { id: "la16", name: "Mathematics", icon: Calculator, strands: ["Numbers", "Algebra", "Geometry", "Measurement", "Statistics"], assessment: "Formative + Summative" },
    { id: "la17", name: "Science & Technology", icon: FlaskConical, strands: ["Living Things", "Energy", "Matter", "Environment", "Technology"], assessment: "Formative + Summative" },
    { id: "la18", name: "Social Studies", icon: Globe, strands: ["Citizenship", "History", "Geography", "Economics"], assessment: "Formative + Summative" },
    { id: "la19", name: "Religious Education", icon: Star, strands: ["Faith", "Morals", "Community"], assessment: "Formative + Summative" },
    { id: "la20", name: "Creative Arts", icon: Palette, strands: ["Visual Arts", "Performing Arts", "Music"], assessment: "Portfolio + Rubric" },
    { id: "la21", name: "Agriculture & Nutrition", icon: Globe, strands: ["Crop Production", "Livestock", "Nutrition"], assessment: "Formative + Summative" },
    { id: "la22", name: "Physical & Health Education", icon: Target, strands: ["Movement", "Games", "Health", "First Aid"], assessment: "Practical + Rubric" },
  ],
  "Junior Secondary": [
    { id: "la23", name: "English", icon: BookOpen, strands: ["Listening & Speaking", "Reading", "Writing", "Grammar", "Literature"], assessment: "Formative + KNEC" },
    { id: "la24", name: "Kiswahili", icon: BookMarked, strands: ["Kusikiliza na Kuzungumza", "Kusoma", "Kuandika", "Sarufi", "Fasihi"], assessment: "Formative + KNEC" },
    { id: "la25", name: "Mathematics", icon: Calculator, strands: ["Numbers", "Algebra", "Geometry & Measurement", "Statistics & Probability"], assessment: "Formative + KNEC" },
    { id: "la26", name: "Integrated Science", icon: FlaskConical, strands: ["Scientific Investigation", "Physics Concepts", "Chemistry Concepts", "Biology Concepts"], assessment: "Formative + KNEC" },
    { id: "la27", name: "Health Education", icon: Target, strands: ["Health", "Nutrition", "Substance Abuse"], assessment: "Formative" },
    { id: "la28", name: "Pre-Technical Studies", icon: Layers, strands: ["Design", "Technology", "Engineering"], assessment: "Project-Based" },
    { id: "la29", name: "Social Studies", icon: Globe, strands: ["Citizenship", "Governance", "History", "Geography"], assessment: "Formative + KNEC" },
    { id: "la30", name: "Religious Education", icon: Star, strands: ["CRE / IRE / HRE"], assessment: "Formative + KNEC" },
    { id: "la31", name: "Business Studies", icon: TrendingUp, strands: ["Entrepreneurship", "Commerce", "Financial Literacy"], assessment: "Formative + KNEC" },
    { id: "la32", name: "Agriculture", icon: Globe, strands: ["Crop Husbandry", "Animal Husbandry", "Farm Management"], assessment: "Formative + Practical" },
    { id: "la33", name: "Creative Arts & Sports", icon: Palette, strands: ["Visual Arts", "Music", "Drama", "Sports"], assessment: "Portfolio" },
    { id: "la34", name: "Computer Science", icon: Layers, strands: ["Programming", "Data", "Networks", "Cyber Security"], assessment: "Practical + KNEC" },
  ],
};

const cbcAssessmentRubrics = [
  { level: "Exceeding Expectations (EE)", score: "4", description: "Learner demonstrates exceptional competence beyond grade level", color: "bg-success/10 text-success" },
  { level: "Meeting Expectations (ME)", score: "3", description: "Learner demonstrates competence as expected at grade level", color: "bg-info/10 text-info" },
  { level: "Approaching Expectations (AE)", score: "2", description: "Learner demonstrates partial competence, needs support", color: "bg-warning/10 text-warning" },
  { level: "Below Expectations (BE)", score: "1", description: "Learner demonstrates minimal competence, needs significant support", color: "bg-destructive/10 text-destructive" },
];

const gradingSystem844 = [
  { grade: "A", min: 80, max: 100, points: 12, remark: "Excellent" },
  { grade: "A-", min: 75, max: 79, points: 11, remark: "Very Good" },
  { grade: "B+", min: 70, max: 74, points: 10, remark: "Good" },
  { grade: "B", min: 65, max: 69, points: 9, remark: "Good" },
  { grade: "B-", min: 60, max: 64, points: 8, remark: "Fairly Good" },
  { grade: "C+", min: 55, max: 59, points: 7, remark: "Average" },
  { grade: "C", min: 50, max: 54, points: 6, remark: "Average" },
  { grade: "C-", min: 45, max: 49, points: 5, remark: "Below Average" },
  { grade: "D+", min: 40, max: 44, points: 4, remark: "Below Average" },
  { grade: "D", min: 35, max: 39, points: 3, remark: "Poor" },
  { grade: "D-", min: 30, max: 34, points: 2, remark: "Poor" },
  { grade: "E", min: 0, max: 29, points: 1, remark: "Very Poor" },
];

const Examinations = () => {
  const [selectedExam, setSelectedExam] = useState(exams[0]);
  const [selectedLevel, setSelectedLevel] = useState("Upper Primary");
  const [curriculumType, setCurriculumType] = useState<"cbc" | "844">("cbc");

  const currentAreas = cbcLearningAreas[selectedLevel as keyof typeof cbcLearningAreas] || [];

  return (
    <DashboardLayout title="Examinations & Curriculum" subtitle="Kenyan CBC & 8-4-4 curriculum, exam management, marks & reports">
      <Tabs defaultValue="curriculum" className="space-y-6">
        <TabsList className="tab-modern flex-wrap h-auto gap-1">
          <TabsTrigger value="curriculum" className="gap-1.5 rounded-lg"><GraduationCap className="h-3.5 w-3.5" />Curriculum</TabsTrigger>
          <TabsTrigger value="learning-areas" className="gap-1.5 rounded-lg"><Layers className="h-3.5 w-3.5" />Learning Areas</TabsTrigger>
          <TabsTrigger value="assessment" className="gap-1.5 rounded-lg"><Target className="h-3.5 w-3.5" />Assessment</TabsTrigger>
          <TabsTrigger value="exams" className="gap-1.5 rounded-lg"><ClipboardCheck className="h-3.5 w-3.5" />Exams</TabsTrigger>
          <TabsTrigger value="schedule" className="gap-1.5 rounded-lg"><Calendar className="h-3.5 w-3.5" />Schedule</TabsTrigger>
          <TabsTrigger value="marks" className="gap-1.5 rounded-lg"><BookOpen className="h-3.5 w-3.5" />Marks</TabsTrigger>
          <TabsTrigger value="grades" className="gap-1.5 rounded-lg"><Award className="h-3.5 w-3.5" />Grading</TabsTrigger>
          <TabsTrigger value="report" className="gap-1.5 rounded-lg"><BarChart3 className="h-3.5 w-3.5" />Report Card</TabsTrigger>
        </TabsList>

        {/* CBC CURRICULUM STRUCTURE */}
        <TabsContent value="curriculum" className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold text-foreground">Competency Based Curriculum (CBC)</h3>
            <Badge className="bg-primary/10 text-primary border-0 rounded-lg">2-6-3-3-3 System</Badge>
          </div>
          <p className="text-sm text-muted-foreground max-w-3xl mb-6">
            Kenya's CBC replaces the 8-4-4 system with a 2-6-3-3-3 structure emphasizing competency-based learning,
            formative assessment, and learner-centered pedagogy aligned with KICD standards.
          </p>

          <div className="space-y-4">
            {cbcLevels.map(level => (
              <Card key={level.id} className="glass-card-hover">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${level.color}`}>
                        <GraduationCap className="h-7 w-7" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-foreground">{level.name}</h4>
                        <p className="text-sm text-muted-foreground">{level.years}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {level.grades.map(g => (
                        <Badge key={g} variant="secondary" className="rounded-lg font-medium px-3 py-1">{g}</Badge>
                      ))}
                    </div>
                  </div>
                  {(cbcLearningAreas[level.name as keyof typeof cbcLearningAreas] || []).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Learning Areas</p>
                      <div className="flex flex-wrap gap-2">
                        {(cbcLearningAreas[level.name as keyof typeof cbcLearningAreas] || []).map(la => (
                          <Badge key={la.id} variant="secondary" className="rounded-lg font-normal text-xs gap-1.5 py-1">
                            <la.icon className="h-3 w-3" />{la.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* LEARNING AREAS WITH STRANDS */}
        <TabsContent value="learning-areas" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h3 className="text-lg font-bold text-foreground">Learning Areas & Strands</h3>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-56 rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.keys(cbcLearningAreas).map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {currentAreas.map(area => (
              <Card key={area.id} className="glass-card-hover">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                      <area.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-foreground">{area.name}</h4>
                      <Badge variant="secondary" className="mt-1 rounded-lg text-[10px]">{area.assessment}</Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Strands & Sub-Strands</p>
                    <div className="flex flex-wrap gap-1.5">
                      {area.strands.map(s => (
                        <Badge key={s} variant="outline" className="rounded-lg text-xs font-normal border-border/50">{s}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ASSESSMENT RUBRICS */}
        <TabsContent value="assessment" className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold text-foreground">Assessment Framework</h3>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="glass-card-hover">
              <CardHeader><CardTitle className="text-base font-bold flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />CBC Competency Rubric
              </CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {cbcAssessmentRubrics.map(r => (
                  <div key={r.level} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                    <Badge className={`${r.color} border-0 rounded-lg font-bold min-w-[32px] justify-center`}>{r.score}</Badge>
                    <div><p className="font-semibold text-sm text-foreground">{r.level}</p><p className="text-xs text-muted-foreground mt-0.5">{r.description}</p></div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass-card-hover">
              <CardHeader><CardTitle className="text-base font-bold flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />CBC Core Competencies
              </CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: "Communication & Collaboration", icon: Users },
                    { name: "Critical Thinking & Problem Solving", icon: Target },
                    { name: "Creativity & Imagination", icon: Palette },
                    { name: "Citizenship", icon: Globe },
                    { name: "Digital Literacy", icon: Layers },
                    { name: "Learning to Learn", icon: BookOpen },
                    { name: "Self-Efficacy", icon: Star },
                  ].map(c => (
                    <div key={c.name} className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/30">
                      <c.icon className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm font-medium text-foreground">{c.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 glass-card-hover">
              <CardHeader><CardTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />Formative Assessment Tools (KICD Aligned)
              </CardTitle></CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { tool: "Portfolio Assessment", desc: "Collection of learner's best work samples across strands", usage: "All Levels" },
                    { tool: "Observation Checklist", desc: "Teacher records competency demonstration in real-time", usage: "PP1 – Grade 6" },
                    { tool: "Rubric Scoring", desc: "Criteria-based scoring (EE, ME, AE, BE) for each strand", usage: "All Levels" },
                    { tool: "Oral Assessment", desc: "Verbal tests for language & communication competencies", usage: "PP1 – Grade 3" },
                    { tool: "Project-Based Tasks", desc: "Applied learning tasks integrating multiple competencies", usage: "Grade 4 – Grade 9" },
                    { tool: "KNEC Summative Tests", desc: "National standardized assessments at transition points", usage: "Grade 6, 9, 12" },
                  ].map(t => (
                    <div key={t.tool} className="p-4 rounded-xl bg-muted/30">
                      <h5 className="font-bold text-sm text-foreground mb-1">{t.tool}</h5>
                      <p className="text-xs text-muted-foreground mb-2">{t.desc}</p>
                      <Badge variant="secondary" className="rounded-lg text-[10px]">{t.usage}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* EXAMS LIST */}
        <TabsContent value="exams" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              { title: "Total Exams", value: exams.length, icon: ClipboardCheck, color: "bg-primary/10 text-primary" },
              { title: "Completed", value: exams.filter(e => e.status === "completed").length, icon: ClipboardCheck, color: "bg-success/10 text-success" },
              { title: "Upcoming", value: exams.filter(e => e.status === "upcoming").length, icon: Calendar, color: "bg-info/10 text-info" },
              { title: "Avg Pass Rate", value: "82%", icon: TrendingUp, color: "bg-warning/10 text-warning" },
            ].map(s => (
              <Card key={s.title} className="stat-card"><CardContent className="flex items-center gap-4 p-5 relative">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.color}`}><s.icon className="h-5 w-5" /></div>
                <div><p className="text-sm text-muted-foreground">{s.title}</p><p className="text-2xl font-bold">{s.value}</p></div>
              </CardContent></Card>
            ))}
          </div>

          <Card className="glass-card-hover">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">Examinations</CardTitle>
                <Dialog><DialogTrigger asChild><Button size="sm" className="rounded-lg"><Plus className="h-4 w-4 mr-1.5" />Create Exam</Button></DialogTrigger>
                  <DialogContent><DialogHeader><DialogTitle>Create Examination</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2"><Label>Exam Name</Label><Input placeholder="e.g. Mid-Term 1" /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Type</Label>
                          <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent><SelectItem value="cat">CAT</SelectItem><SelectItem value="mid_term">Mid-Term</SelectItem><SelectItem value="end_term">End-Term</SelectItem><SelectItem value="mock">Mock</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label>Term</Label>
                          <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent><SelectItem value="t1">Term 1 2024</SelectItem><SelectItem value="t2">Term 2 2024</SelectItem><SelectItem value="t3">Term 3 2024</SelectItem></SelectContent></Select></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Start Date</Label><Input type="date" /></div>
                        <div className="space-y-2"><Label>End Date</Label><Input type="date" /></div>
                      </div>
                      <div className="space-y-2"><Label>Classes</Label>
                        <div className="grid grid-cols-3 gap-2">{classes.map(c => (
                          <label key={c.id} className="flex items-center gap-2 text-sm p-2 rounded-lg border cursor-pointer hover:bg-muted/50"><input type="checkbox" className="rounded" />{c.name}</label>
                        ))}</div></div>
                      <Button className="w-full mt-2 rounded-lg">Create Examination</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="table-modern mx-6 mb-6">
                <Table><TableHeader><TableRow className="bg-muted/40">
                  <TableHead className="font-semibold">Exam Name</TableHead><TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Term</TableHead><TableHead className="font-semibold">Dates</TableHead>
                  <TableHead className="font-semibold">Classes</TableHead><TableHead className="font-semibold">Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>{exams.map(e => (
                  <TableRow key={e.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-semibold">{e.name}</TableCell>
                    <TableCell><Badge variant="secondary" className="capitalize rounded-lg">{e.type.replace("_"," ")}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{e.term}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{e.start_date} → {e.end_date}</TableCell>
                    <TableCell><div className="flex gap-1 flex-wrap">{e.classes.map(c => <Badge key={c} variant="secondary" className="text-xs rounded-md">{c}</Badge>)}</div></TableCell>
                    <TableCell><Badge className={
                      e.status === "completed" ? "bg-success/10 text-success border-0 rounded-lg" :
                      e.status === "upcoming" ? "bg-info/10 text-info border-0 rounded-lg" :
                      "bg-warning/10 text-warning border-0 rounded-lg"
                    }>{e.status}</Badge></TableCell>
                  </TableRow>
                ))}</TableBody></Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SCHEDULE */}
        <TabsContent value="schedule" className="space-y-6">
          <Card className="glass-card-hover">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-base font-bold">Exam Schedule</CardTitle>
                <div className="flex items-center gap-3">
                  <Select value={selectedExam.id} onValueChange={v => setSelectedExam(exams.find(e => e.id === v) || exams[0])}>
                    <SelectTrigger className="w-56 h-9 rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>{exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="table-modern">
                <Table><TableHeader><TableRow className="bg-muted/40">
                  <TableHead className="font-semibold">Subject</TableHead><TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Time</TableHead><TableHead className="font-semibold">Room</TableHead>
                  <TableHead className="font-semibold">Full Marks</TableHead><TableHead className="font-semibold">Pass Marks</TableHead>
                </TableRow></TableHeader>
                <TableBody>{examSchedules.map(s => (
                  <TableRow key={s.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-semibold">{s.subject}</TableCell>
                    <TableCell className="text-muted-foreground">{s.date}</TableCell>
                    <TableCell className="text-muted-foreground">{s.start_time} - {s.end_time}</TableCell>
                    <TableCell><Badge variant="secondary" className="rounded-lg">{s.room}</Badge></TableCell>
                    <TableCell className="font-bold">{s.full_marks}</TableCell>
                    <TableCell className="text-muted-foreground">{s.pass_marks}</TableCell>
                  </TableRow>
                ))}</TableBody></Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MARKS REGISTER */}
        <TabsContent value="marks" className="space-y-6">
          <Card className="glass-card-hover">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-base font-bold">Marks Register — Mid-Term 1 (Grade 8 East)</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="rounded-lg"><Download className="h-4 w-4 mr-1.5" />Export</Button>
                  <Button size="sm" className="rounded-lg"><Plus className="h-4 w-4 mr-1.5" />Enter Marks</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="table-modern overflow-x-auto">
                <Table><TableHeader><TableRow className="bg-muted/40">
                  <TableHead className="font-semibold">Rank</TableHead><TableHead className="font-semibold">Student</TableHead><TableHead className="font-semibold">Adm No.</TableHead>
                  <TableHead className="font-semibold text-center">Math</TableHead><TableHead className="font-semibold text-center">Eng</TableHead>
                  <TableHead className="font-semibold text-center">Kis</TableHead><TableHead className="font-semibold text-center">Sci</TableHead>
                  <TableHead className="font-semibold text-center">SST</TableHead><TableHead className="font-semibold text-center">CRE</TableHead>
                  <TableHead className="font-semibold text-center">Total</TableHead><TableHead className="font-semibold text-center">%</TableHead>
                  <TableHead className="font-semibold text-center">Grade</TableHead>
                </TableRow></TableHeader>
                <TableBody>{marksRegister.sort((a, b) => a.rank - b.rank).map(m => (
                  <TableRow key={m.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell><div className="flex items-center gap-1">
                      {m.rank <= 3 && <Medal className={`h-4 w-4 ${m.rank === 1 ? "text-yellow-500" : m.rank === 2 ? "text-gray-400" : "text-orange-400"}`} />}
                      <span className="font-bold">{m.rank}</span>
                    </div></TableCell>
                    <TableCell className="font-semibold">{m.student}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{m.admission_no}</TableCell>
                    {[m.math, m.english, m.kiswahili, m.science, m.social_studies, m.cre].map((mark, i) => (
                      <TableCell key={i} className={`text-center font-medium ${mark < 40 ? "text-destructive" : mark >= 80 ? "text-success font-bold" : ""}`}>{mark}</TableCell>
                    ))}
                    <TableCell className="text-center font-bold">{m.total}/600</TableCell>
                    <TableCell className="text-center font-bold">{m.percentage}%</TableCell>
                    <TableCell className="text-center"><Badge className={
                      m.grade.startsWith("A") ? "bg-success/10 text-success border-0 rounded-lg" :
                      m.grade.startsWith("B") ? "bg-info/10 text-info border-0 rounded-lg" :
                      m.grade.startsWith("C") ? "bg-warning/10 text-warning border-0 rounded-lg" :
                      "bg-destructive/10 text-destructive border-0 rounded-lg"
                    }>{m.grade}</Badge></TableCell>
                  </TableRow>
                ))}</TableBody></Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GRADING SYSTEM */}
        <TabsContent value="grades" className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Button variant={curriculumType === "cbc" ? "default" : "outline"} size="sm" className="rounded-lg" onClick={() => setCurriculumType("cbc")}>CBC Rubric</Button>
            <Button variant={curriculumType === "844" ? "default" : "outline"} size="sm" className="rounded-lg" onClick={() => setCurriculumType("844")}>8-4-4 Grading</Button>
          </div>

          {curriculumType === "cbc" ? (
            <Card className="glass-card-hover">
              <CardHeader><CardTitle className="text-base font-bold">CBC Competency-Based Assessment Rubric</CardTitle>
                <p className="text-sm text-muted-foreground">KICD-aligned 4-level rubric for formative assessment</p></CardHeader>
              <CardContent>
                <div className="table-modern">
                  <Table><TableHeader><TableRow className="bg-muted/40">
                    <TableHead className="font-semibold">Level</TableHead><TableHead className="font-semibold">Score</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>{cbcAssessmentRubrics.map(r => (
                    <TableRow key={r.level} className="hover:bg-muted/30 transition-colors">
                      <TableCell><Badge className={`${r.color} border-0 rounded-lg`}>{r.level}</Badge></TableCell>
                      <TableCell className="font-bold text-lg">{r.score}</TableCell>
                      <TableCell className="text-muted-foreground">{r.description}</TableCell>
                    </TableRow>
                  ))}</TableBody></Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-card-hover">
              <CardHeader><CardTitle className="text-base font-bold">8-4-4 Grading System (KCPE / KCSE)</CardTitle>
                <p className="text-sm text-muted-foreground">Traditional letter grading with 12-point scale</p></CardHeader>
              <CardContent>
                <div className="table-modern">
                  <Table><TableHeader><TableRow className="bg-muted/40">
                    <TableHead className="font-semibold">Grade</TableHead><TableHead className="font-semibold">Min</TableHead>
                    <TableHead className="font-semibold">Max</TableHead><TableHead className="font-semibold">Points</TableHead>
                    <TableHead className="font-semibold">Remark</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>{gradingSystem844.map(g => (
                    <TableRow key={g.grade} className="hover:bg-muted/30 transition-colors">
                      <TableCell><Badge className={
                        g.grade.startsWith("A") ? "bg-success/10 text-success border-0 rounded-lg" :
                        g.grade.startsWith("B") ? "bg-info/10 text-info border-0 rounded-lg" :
                        g.grade.startsWith("C") ? "bg-warning/10 text-warning border-0 rounded-lg" :
                        "bg-destructive/10 text-destructive border-0 rounded-lg"
                      }>{g.grade}</Badge></TableCell>
                      <TableCell className="font-bold">{g.min}</TableCell>
                      <TableCell className="font-bold">{g.max}</TableCell>
                      <TableCell className="font-bold">{g.points}</TableCell>
                      <TableCell className="text-muted-foreground">{g.remark}</TableCell>
                    </TableRow>
                  ))}</TableBody></Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* PROGRESS REPORT */}
        <TabsContent value="report" className="space-y-6">
          <Card className="glass-card-hover">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-base font-bold">Student Progress Report Card</CardTitle>
                <div className="flex gap-2">
                  <Select><SelectTrigger className="w-44 h-9 rounded-lg"><SelectValue placeholder="Select Student" /></SelectTrigger>
                    <SelectContent>{marksRegister.map(m => <SelectItem key={m.id} value={m.id}>{m.student}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="rounded-lg"><Download className="h-4 w-4 mr-1.5" />Print</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border border-border/50 rounded-xl p-8 space-y-6 max-w-2xl mx-auto premium-shadow">
                <div className="text-center space-y-1 border-b border-border/50 pb-5">
                  <h2 className="text-xl font-extrabold text-foreground tracking-tight">CHUO ACADEMY</h2>
                  <p className="text-sm text-muted-foreground">P.O. Box 12345, Nairobi | Tel: 020-1234567</p>
                  <p className="text-sm font-bold text-primary mt-2 tracking-wide">STUDENT PROGRESS REPORT</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Student: </span><span className="font-bold">Catherine Muthoni</span></div>
                  <div><span className="text-muted-foreground">Adm No: </span><span className="font-bold font-mono">ADM-2024-003</span></div>
                  <div><span className="text-muted-foreground">Class: </span><span className="font-bold">Grade 8 East</span></div>
                  <div><span className="text-muted-foreground">Exam: </span><span className="font-bold">Mid-Term 1 2024</span></div>
                </div>
                <div className="table-modern">
                  <Table><TableHeader><TableRow className="bg-muted/40">
                    <TableHead className="font-semibold">Subject</TableHead><TableHead className="font-semibold text-center">Marks</TableHead>
                    <TableHead className="font-semibold text-center">Grade</TableHead><TableHead className="font-semibold">Remark</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {[
                      { subject: "Mathematics", marks: 92, grade: "A", remark: "Excellent" },
                      { subject: "English", marks: 88, grade: "A", remark: "Excellent" },
                      { subject: "Kiswahili", marks: 85, grade: "A", remark: "Excellent" },
                      { subject: "Science & Technology", marks: 90, grade: "A", remark: "Excellent" },
                      { subject: "Social Studies", marks: 82, grade: "A", remark: "Excellent" },
                      { subject: "CRE", marks: 88, grade: "A", remark: "Excellent" },
                    ].map(s => (
                      <TableRow key={s.subject} className="hover:bg-muted/30">
                        <TableCell className="font-semibold">{s.subject}</TableCell>
                        <TableCell className="text-center font-bold">{s.marks}</TableCell>
                        <TableCell className="text-center"><Badge className="bg-success/10 text-success border-0 rounded-lg">{s.grade}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{s.remark}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/30 font-bold">
                      <TableCell className="font-bold">TOTAL</TableCell><TableCell className="text-center font-bold">525/600</TableCell>
                      <TableCell className="text-center"><Badge className="bg-success/10 text-success border-0 rounded-lg">A</Badge></TableCell>
                      <TableCell className="font-bold">Rank: 1st out of 45</TableCell>
                    </TableRow>
                  </TableBody></Table>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm border-t border-border/50 pt-4">
                  <div><span className="text-muted-foreground">Mean Grade: </span><span className="font-bold text-success">A (87.5%)</span></div>
                  <div><span className="text-muted-foreground">Position: </span><span className="font-bold">1 / 45</span></div>
                </div>
                <div className="text-sm border-t border-border/50 pt-4 space-y-2">
                  <div><span className="text-muted-foreground">Class Teacher: </span><span className="italic">Outstanding performance. Keep it up!</span></div>
                  <div><span className="text-muted-foreground">Principal: </span><span className="italic">Excellent work. A role model student.</span></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Examinations;
