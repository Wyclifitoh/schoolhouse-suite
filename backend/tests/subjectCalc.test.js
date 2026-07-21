/**
 * Subject calculation engine tests (8-4-4).
 * Run with: node --test tests
 */
const test = require("node:test");
const assert = require("node:assert/strict");

const { computeSubjectScore } = require("../src/modules/examinations/subjectCalc");

test("GENERAL: sum/max * 100", () => {
  const papers = [
    { id: "p1", name: "Paper 1", paper_type: "THEORY", max_marks: 100 },
    { id: "p2", name: "Paper 2", paper_type: "THEORY", max_marks: 100 },
  ];
  const r = computeSubjectScore({
    papers,
    marks: { p1: 80, p2: 60 },
    calculationType: "GENERAL",
  });
  assert.equal(r.total, 140);
  assert.equal(r.outOf, 200);
  assert.equal(r.percentage, 70);
});

test("SCIENCE: Biology — (60+70)/200*60 + 30/40*40 = 69", () => {
  const papers = [
    { id: "t1", name: "Paper 1", paper_type: "THEORY", max_marks: 100 },
    { id: "t2", name: "Paper 2", paper_type: "THEORY", max_marks: 100 },
    { id: "pr", name: "Practical", paper_type: "PRACTICAL", max_marks: 40 },
  ];
  const r = computeSubjectScore({
    papers,
    marks: { t1: 60, t2: 70, pr: 30 },
    calculationType: "SCIENCE",
  });
  assert.equal(r.percentage, 69);
  assert.equal(r.breakdown.theory.pct, 39);
  assert.equal(r.breakdown.practical.pct, 30);
});

test("SCIENCE: missing practical still computes theory portion", () => {
  const papers = [
    { id: "t1", name: "Paper 1", paper_type: "THEORY", max_marks: 100 },
    { id: "pr", name: "Practical", paper_type: "PRACTICAL", max_marks: 40 },
  ];
  const r = computeSubjectScore({
    papers,
    marks: { t1: 80 },
    calculationType: "SCIENCE",
  });
  // theory 80/100 * 60 = 48; no practical => 0
  assert.equal(r.percentage, 48);
});

test("LANGUAGE: weighted papers", () => {
  const papers = [
    { id: "p1", name: "Paper 1", paper_type: "THEORY", max_marks: 60 },
    { id: "p2", name: "Paper 2", paper_type: "THEORY", max_marks: 80 },
    { id: "p3", name: "Paper 3", paper_type: "ORAL", max_marks: 60 },
  ];
  const r = computeSubjectScore({
    papers,
    marks: { p1: 30, p2: 40, p3: 45 },
    calculationType: "LANGUAGE",
    config: { weights: { p1: 1, p2: 1, p3: 1 } },
  });
  // equal weights => same as GENERAL
  assert.equal(r.percentage, 57.5);
});

test("empty papers => zero scores, no NaN", () => {
  const r = computeSubjectScore({ papers: [], marks: {}, calculationType: "GENERAL" });
  assert.equal(r.percentage, 0);
  assert.equal(r.outOf, 0);
});

test("CUSTOM falls back to GENERAL", () => {
  const papers = [{ id: "p1", name: "P1", paper_type: "THEORY", max_marks: 50 }];
  const r = computeSubjectScore({
    papers,
    marks: { p1: 25 },
    calculationType: "CUSTOM",
  });
  assert.equal(r.percentage, 50);
});