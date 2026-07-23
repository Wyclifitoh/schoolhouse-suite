# 8-4-4 Assessment Engine

CBE remains untouched. The 8-4-4 engine activates when
`assessments.curriculum_type = '8-4-4'` and is fully snapshot-driven so
historical results are immutable.

## Data model (in order of introduction)

| Migration | Adds |
|-----------|------|
| `2026_06_17_secondary_8_4_4.sql` | `subject_papers`, `exam_paper_marks`, curriculum columns on `subjects` |
| `2026_06_17_assessments_curriculum.sql` | `assessments.curriculum_type`, `assessment_marks.paper_scores` |
| `2026_06_17_grading_scales_844.sql` | Per-school configurable grading scales (fallback: `grading844.js`) |
| `2026_07_20_grading_systems.sql` | `grading_systems`, `grading_system_levels`, `subject_categories` |
| `2026_07_21_paper_contribution.sql` | `subject_papers.contribution_pct` |
| `2026_07_22_assessment_snapshot.sql` | `assessment_subjects.grading_system_id`, `assessment_subject_papers` |
| `2026_07_23_kcse_aggregate.sql` | `kcse_aggregate_rules`, aggregate columns on `assessment_results`, `assessments.aggregate_rule_snapshot` |
| `2026_07_24_assessment_perf_indexes.sql` | Composite indexes on hot query paths |

## Snapshot flow (create assessment)

1. `assessments.repository.create` resolves, per (grade, subject):
   - Effective grading system (subject override → category default → school default → fallback).
   - Paper template with `contribution_pct`, `max_marks`, `paper_type`.
2. Snapshots are frozen into `assessment_subjects` + `assessment_subject_papers`.
3. Aggregate rule (`kcse_aggregate_rules`) is copied into
   `assessments.aggregate_rule_snapshot`.

Editing a subject afterwards never mutates history.

## Marks entry

- Roster: intersection of `assessment_classes` × `students` × (for
  secondary) `student_subjects`. Non-registered learners never appear.
- UI renders paper columns from `assessment_subject_papers`.
- Final score = Σ (score/max × contribution_pct). Grade & points come
  from the snapshotted grading system.

## Results & ranking

- `results.compute` writes `total_points`, `mean_points`, `mean_grade`,
  `aggregate_points`, `aggregate_grade`, and `best_subjects` per student.
- `recomputePositions` orders by `aggregate_points DESC` for 8-4-4 and
  by mean % for CBE.
- Best-N + compulsory list come from `aggregate_rule_snapshot`.

## Report card & analytics

- The 8-4-4 template surfaces aggregate grade, total points and stars
  the subjects counted toward the aggregate.
- Analytics reads snapshotted grading systems, never live subject data.

## Performance notes

- Composite indexes cover the hot lookups:
  `assessment_marks(assessment_id, student_id, subject_id)`,
  `assessment_subjects(assessment_id, subject_id)`,
  `student_subjects(student_id, subject_id)`,
  `assessment_subject_papers(assessment_id, subject_id, display_order)`,
  `assessment_results(assessment_id, aggregate_points)`.
- `resolveExpectedSubjects` loads all school-wide student registrations
  once per compute call (single query) instead of per-student.
- `bulkSavePapers` groups writes per subject to amortize grading-system
  lookups.