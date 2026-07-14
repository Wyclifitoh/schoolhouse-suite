// 8-4-4 default grading scale + remarks. Used when no per-school grading
// scale has been configured.
const DEFAULT_844 = [
  { min: 80, max: 100, code: "A", points: 12, remark: "Excellent" },
  { min: 75, max: 79, code: "A-", points: 11, remark: "Very good" },
  { min: 70, max: 74, code: "B+", points: 10, remark: "Good" },
  { min: 65, max: 69, code: "B", points: 9, remark: "Above average" },
  { min: 60, max: 64, code: "B-", points: 8, remark: "Average" },
  { min: 55, max: 59, code: "C+", points: 7, remark: "Fairly good" },
  { min: 50, max: 54, code: "C", points: 6, remark: "Average; can improve" },
  { min: 45, max: 49, code: "C-", points: 5, remark: "Below average" },
  { min: 40, max: 44, code: "D+", points: 4, remark: "Weak — needs effort" },
  {
    min: 35,
    max: 39,
    code: "D",
    points: 3,
    remark: "Poor — needs more practice",
  },
  { min: 30, max: 34, code: "D-", points: 2, remark: "Very poor" },
  {
    min: 0,
    max: 29,
    code: "E",
    points: 1,
    remark: "Fail — serious effort required",
  },
];

function gradeFor844(pct) {
  if (pct == null || isNaN(pct)) return null;
  const p = Math.max(0, Math.min(100, Number(pct)));
  return DEFAULT_844.find((g) => p >= g.min && p <= g.max) || null;
}

// Reverse lookup — mean grade from accumulated mean points (KCSE style).
function gradeByPoints844(meanPoints) {
  if (meanPoints == null || isNaN(meanPoints)) return null;
  const pts = Math.max(1, Math.min(12, Math.round(Number(meanPoints))));
  return DEFAULT_844.find((g) => g.points === pts) || null;
}

module.exports = { DEFAULT_844, gradeFor844, gradeByPoints844 };
