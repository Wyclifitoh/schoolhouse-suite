// Default 8-4-4 grading scale (matches backend/src/modules/assessments/grading844.js)
export interface Grade844 {
  min: number;
  max: number;
  code: string;
  points: number;
  remark: string;
}

export const GRADES_844: Grade844[] = [
  { min: 80, max: 100, code: "A",  points: 12, remark: "Excellent" },
  { min: 75, max: 79,  code: "A-", points: 11, remark: "Very good" },
  { min: 70, max: 74,  code: "B+", points: 10, remark: "Good" },
  { min: 65, max: 69,  code: "B",  points: 9,  remark: "Above average" },
  { min: 60, max: 64,  code: "B-", points: 8,  remark: "Average" },
  { min: 55, max: 59,  code: "C+", points: 7,  remark: "Fairly good" },
  { min: 50, max: 54,  code: "C",  points: 6,  remark: "Average; can improve" },
  { min: 45, max: 49,  code: "C-", points: 5,  remark: "Below average" },
  { min: 40, max: 44,  code: "D+", points: 4,  remark: "Weak — needs effort" },
  { min: 35, max: 39,  code: "D",  points: 3,  remark: "Poor — needs more practice" },
  { min: 30, max: 34,  code: "D-", points: 2,  remark: "Very poor" },
  { min: 0,  max: 29,  code: "E",  points: 1,  remark: "Fail — serious effort required" },
];

export function gradeFor844(pct: number | null | undefined): Grade844 | null {
  if (pct == null || isNaN(pct as number)) return null;
  const p = Math.max(0, Math.min(100, Number(pct)));
  return GRADES_844.find((g) => p >= g.min && p <= g.max) || null;
}

// Grade against a configured grading-system's levels; falls back to default 8-4-4.
export interface GSLevel { grade_code: string; min_pct: number; max_pct: number; points: number; description?: string | null }
export function gradeForLevels(
  pct: number | null | undefined,
  levels?: GSLevel[] | null,
): { code: string; points: number; remark: string } | null {
  if (pct == null || isNaN(pct as number)) return null;
  if (!levels?.length) {
    const g = gradeFor844(pct);
    return g ? { code: g.code, points: g.points, remark: g.remark } : null;
  }
  const p = Math.max(0, Math.min(100, Number(pct)));
  const hit = levels.find((l) => p >= Number(l.min_pct) && p <= Number(l.max_pct));
  return hit
    ? { code: hit.grade_code, points: Number(hit.points) || 0, remark: hit.description || "" }
    : null;
}

export interface Paper { id: string; name: string; paper_type: string; max_marks: number; contribution_pct?: number }

// Mirrors backend/src/modules/examinations/subjectCalc.js for client-side previews.
export function computeSubject844(
  papers: Paper[],
  marks: Record<string, number | null | undefined>,
  calculationType: string = "GENERAL",
  config: any = {},
): { total: number; outOf: number; percentage: number } {
  if (!papers?.length) return { total: 0, outOf: 0, percentage: 0 };
  const round = (n: number) => Math.round(n * 100) / 100;
  const num = (v: any) => (v == null || v === "" ? null : Number(v));

  // Contribution model: any paper with contribution_pct > 0 uses it.
  const usesContribution = papers.some((p) => Number((p as any).contribution_pct) > 0);
  if (usesContribution) {
    let final = 0, sumContrib = 0, total = 0, outOf = 0;
    papers.forEach((p) => {
      const s = num(marks[p.id]);
      const max = Number(p.max_marks) || 0;
      const contrib = Number((p as any).contribution_pct) || 0;
      sumContrib += contrib;
      outOf += max;
      if (s != null) {
        total += s;
        const pct = max > 0 ? s / max : 0;
        final += pct * contrib;
      }
    });
    const percentage = sumContrib > 0 ? round((final / sumContrib) * 100) : 0;
    return { total: round(total), outOf: round(outOf), percentage };
  }

  const t = String(calculationType || "GENERAL").toUpperCase();
  if (t === "SCIENCE") {
    const tw = Number(config?.theoryWeight ?? 60);
    const pw = Number(config?.practicalWeight ?? 40);
    const theory = papers.filter((p) => p.paper_type === "THEORY");
    const other = papers.filter((p) => p.paper_type !== "THEORY");
    let ts = 0, tm = 0, ps = 0, pm = 0;
    theory.forEach((p) => { const s = num(marks[p.id]); tm += +p.max_marks; if (s != null) ts += s; });
    other.forEach((p) => { const s = num(marks[p.id]); pm += +p.max_marks; if (s != null) ps += s; });
    const tp = tm > 0 ? (ts / tm) * tw : 0;
    const pp = pm > 0 ? (ps / pm) * pw : 0;
    return { total: round(ts + ps), outOf: round(tm + pm), percentage: round(tp + pp) };
  }
  if (t === "LANGUAGE") {
    const weights = config?.weights || {};
    let w = 0, wm = 0, total = 0, outOf = 0;
    papers.forEach((p) => {
      const ww = Number(weights[p.id] ?? weights[p.name] ?? 1);
      const s = num(marks[p.id]);
      wm += +p.max_marks * ww; outOf += +p.max_marks;
      if (s != null) { w += s * ww; total += s; }
    });
    return { total: round(total), outOf: round(outOf), percentage: wm > 0 ? round((w / wm) * 100) : 0 };
  }
  // GENERAL / CUSTOM
  let total = 0, outOf = 0;
  papers.forEach((p) => { const s = num(marks[p.id]); outOf += +p.max_marks; if (s != null) total += s; });
  return { total: round(total), outOf: round(outOf), percentage: outOf > 0 ? round((total / outOf) * 100) : 0 };
}