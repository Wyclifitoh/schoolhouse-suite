/**
 * Centralized subject-mark calculation engine.
 *
 * Given the papers configured for a subject (with their max marks and
 * types) and the scores a student received per paper, computes the
 * final subject percentage according to the subject's
 * `calculation_type`:
 *
 *   GENERAL  — final% = sum(scores) / sum(max) * 100
 *   SCIENCE  — theory papers scaled to theoryWeight (default 60),
 *              practical/oral/project papers added raw, capped at
 *              practicalWeight (default 40). Result is a percentage.
 *   LANGUAGE — weighted sum across papers (weights from
 *              config.weights keyed by paper id/name, default 1).
 *   CUSTOM   — falls back to GENERAL (placeholder for future formula
 *              DSL).
 *
 * Returns a deterministic object the caller can persist into
 * `exam_marks` (score / out_of) plus a `breakdown` for UI debugging.
 *
 * The engine is intentionally pure (no DB / IO) so it is trivially
 * testable and reusable from PDF generation, rankings, analytics, etc.
 */

const num = (v) => (v == null || v === "" ? null : Number(v));

function computeGeneral(papers, marks) {
  let total = 0;
  let outOf = 0;
  for (const p of papers) {
    const score = num(marks[p.id]);
    outOf += Number(p.max_marks);
    if (score != null) total += score;
  }
  const percentage = outOf > 0 ? round2((total / outOf) * 100) : 0;
  return { total: round2(total), outOf: round2(outOf), percentage };
}

function computeScience(papers, marks, config = {}) {
  const theoryWeight = Number(config.theoryWeight ?? 60);
  const practicalWeight = Number(config.practicalWeight ?? 40);

  const theoryPapers = papers.filter((p) => p.paper_type === "THEORY");
  const otherPapers = papers.filter((p) => p.paper_type !== "THEORY");

  let theoryScore = 0;
  let theoryMax = 0;
  for (const p of theoryPapers) {
    const s = num(marks[p.id]);
    theoryMax += Number(p.max_marks);
    if (s != null) theoryScore += s;
  }

  let practicalScore = 0;
  let practicalMax = 0;
  for (const p of otherPapers) {
    const s = num(marks[p.id]);
    practicalMax += Number(p.max_marks);
    if (s != null) practicalScore += s;
  }

  const theoryPct = theoryMax > 0 ? (theoryScore / theoryMax) * theoryWeight : 0;
  // Practical is added on its own scale, then proportionally weighted
  // into the practicalWeight bucket. e.g. /40 raw stays /40 when
  // practicalWeight=40 and practicalMax=40.
  const practicalPct =
    practicalMax > 0 ? (practicalScore / practicalMax) * practicalWeight : 0;

  const percentage = round2(theoryPct + practicalPct);
  return {
    total: round2(theoryScore + practicalScore),
    outOf: round2(theoryMax + practicalMax),
    percentage,
    breakdown: {
      theory: { score: round2(theoryScore), max: theoryMax, pct: round2(theoryPct) },
      practical: { score: round2(practicalScore), max: practicalMax, pct: round2(practicalPct) },
      theoryWeight,
      practicalWeight,
    },
  };
}

function computeLanguage(papers, marks, config = {}) {
  const weights = config.weights || {};
  let weighted = 0;
  let weightedMax = 0;
  for (const p of papers) {
    const w = Number(weights[p.id] ?? weights[p.name] ?? 1);
    const s = num(marks[p.id]);
    weightedMax += Number(p.max_marks) * w;
    if (s != null) weighted += s * w;
  }
  const percentage = weightedMax > 0 ? round2((weighted / weightedMax) * 100) : 0;
  // Surface the un-weighted total/out-of for display parity with general subjects.
  let total = 0;
  let outOf = 0;
  for (const p of papers) {
    const s = num(marks[p.id]);
    outOf += Number(p.max_marks);
    if (s != null) total += s;
  }
  return { total: round2(total), outOf: round2(outOf), percentage };
}

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

/**
 * @param {Object} args
 * @param {Array}  args.papers           Paper rows: {id, name, paper_type, max_marks}
 * @param {Object} args.marks            Map of paperId -> score (number|null)
 * @param {string} args.calculationType  GENERAL | SCIENCE | LANGUAGE | CUSTOM
 * @param {Object} [args.config]         Per-subject calc config (JSON)
 */
function computeSubjectScore({ papers = [], marks = {}, calculationType = "GENERAL", config = {} }) {
  if (!papers.length) {
    return { total: 0, outOf: 0, percentage: 0, breakdown: { empty: true } };
  }
  const cfg = config || {};
  switch (String(calculationType || "GENERAL").toUpperCase()) {
    case "SCIENCE":
      return computeScience(papers, marks, cfg);
    case "LANGUAGE":
      return computeLanguage(papers, marks, cfg);
    case "CUSTOM":
    case "GENERAL":
    default:
      return computeGeneral(papers, marks);
  }
}

module.exports = { computeSubjectScore };