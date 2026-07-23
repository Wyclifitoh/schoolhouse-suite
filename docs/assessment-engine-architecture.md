# CHUO Assessment Engine — Architecture

_Last updated: Phase 8 (July 2026)_

This document describes the enterprise-grade, curriculum-agnostic assessment
engine that powers CHUO. It is intentionally generic so it can serve CBC/CBE,
8-4-4 (transitional), and future Senior School CBC pathways without permanent
curriculum-specific tables.

## Design principles

1. **One permanent template per subject.** The `subjects` +
   `subject_papers` tables are the only long-lived source of truth for how a
   subject is scored by default.
2. **Assessment snapshot is authoritative.** Every assessment freezes its own
   copy of subject + paper configuration at creation time. Marks entry,
   calculations, results, report cards and analytics all read from the
   snapshot — never from live subject configuration.
3. **Grade is a first-class snapshot dimension.** All snapshot tables
   (`assessment_subjects`, `assessment_subject_papers`) are keyed by
   `(assessment_id, grade_id, subject_id)`. This allows the same subject to
   have different structures across grades within one assessment (e.g. Form 4
   Biology has 3 papers; Form 3 Biology has 1 composite paper).
4. **Assessment-scoped customisation, not a permanent grade template.**
   Administrators can customise the snapshot _inside a specific assessment_
   after it is created. Customisations never modify the master Subject
   Configuration. This is called **Assessment Subject Configuration**.
5. **Snapshot freezes on first mark.** Once a mark is written for a given
   `(assessment, grade, subject)` triple, its snapshot rows lock. Further
   customisation is refused; unlocking requires an admin to first clear the
   affected marks.
6. **Reporting stays subject-centric.** Paper-level detail is teacher-facing
   only (marks entry, analysis drill-downs). Student report cards display
   a single row per subject: percentage, grade, points.
7. **Curriculum-agnostic.** The engine has no hard-coded assumptions about
   "CBC" vs "8-4-4". Curriculum-specific behaviour (KCSE Best Seven, CBE
   levels) is driven by configurable grading systems, KCSE aggregate rules
   and subject categories.

## Data model

```text
subjects ─────────────────────────┐   (permanent template)
  └── subject_papers              │
                                  │  copied at assessment creation
                                  ▼
assessments
  └── assessment_subjects (grade_id, subject_id, calc_type, grading_system_id,
  │       uses_papers, is_customized, locked_at, customized_at, customized_by)
  └── assessment_subject_papers (grade_id, subject_id, name, max_marks,
  │       contribution_pct, paper_type, display_order)
  └── assessment_marks (student_id, subject_id, score, grade_code, points,
          paper_scores JSON)
```

## Lifecycle

1. **Assessment creation.** Backend copies each attached subject's default
   template into `assessment_subjects` (+ `assessment_subject_papers` if the
   subject uses papers) once per attached grade.
2. **Customise (optional).** Admin opens
   `Assessments → <assessment> → Subject configuration`, selects a subject +
   grade, and edits the snapshot only. `is_customized = 1`, `customized_at`
   and `customized_by` are recorded. The master subject is untouched.
3. **Marks entry.** `PaperMarksGrid` reads the snapshot for the student's
   grade, renders paper columns dynamically, and posts to
   `POST /assessments/marks/bulk-papers`. The backend recomputes final
   percentage / grade / points from the snapshot and marks the snapshot rows
   `locked_at = NOW()`.
4. **Results.** `results.repository` aggregates strictly per grade using
   snapshot `out_of` and grading systems. 8-4-4 assessments additionally
   compute KCSE aggregate (Best Seven) using configurable rules.
5. **Report cards.** One row per subject: final `score`, `grade_code`,
   `points`. No paper columns.
6. **Analytics.** May drill down to `paper_scores` for teacher views.

## Locking semantics

- A subject snapshot is _locked_ when any `assessment_marks` row exists for
  that `(assessment, grade, subject)`.
- `PUT /assessments/:id/subject-config/:gradeId/:subjectId` refuses writes
  when locked.
- `POST .../reset` restores the master default and clears `is_customized`.

## Why not permanent `subject_grade_templates`?

Introducing a third permanent layer between `subjects` and `assessments`
would add a maintenance burden that only benefits transitional 8-4-4
scenarios. The snapshot-with-override model captures the same flexibility
per assessment without requiring schools to keep a fourth configuration
source in sync. When 8-4-4 sunsets, the override surface remains useful for
one-off Senior School CBC assessments (e.g. project weeks with atypical
component splits).

## Future-proofing checklist

- New curriculum types plug in as `assessments.curriculum_type` values with
  their own grading system(s) and (optionally) aggregate rules.
- Subject categories + grading system inheritance means new pathways just
  register new categories.
- All snapshot reads must key by `(assessment_id, grade_id, subject_id)` —
  never by `subject_id` alone. This invariant is verified by
  `expectedSubjects.js`, `marks.repository.js` and `results.repository.js`.