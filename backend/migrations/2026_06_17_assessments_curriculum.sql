-- Curriculum awareness for assessments (CBC/CBE vs 8-4-4).
-- All columns default to CBC so existing assessments are unchanged.

ALTER TABLE assessments
  ADD COLUMN curriculum_type VARCHAR(20) NOT NULL DEFAULT 'CBC';

ALTER TABLE assessments
  ADD COLUMN grading_scale_id CHAR(36) NULL;

-- Per-paper raw marks for an 8-4-4 subject mark (JSON map paperId -> score).
ALTER TABLE assessment_marks
  ADD COLUMN paper_scores JSON NULL;

-- Letter grade column (kept separate from achievement_level_code so CBC
-- AL codes never collide with 8-4-4 grade codes).
ALTER TABLE assessment_marks
  ADD COLUMN grade_code VARCHAR(8) NULL;

-- Snapshot the subject's calc config onto assessment_subjects so a later
-- subject template change can't retroactively rewrite past marks.
ALTER TABLE assessment_subjects
  ADD COLUMN curriculum_type   VARCHAR(20) NULL,
  ADD COLUMN calculation_type  VARCHAR(20) NULL,
  ADD COLUMN calculation_config JSON       NULL,
  ADD COLUMN uses_papers       TINYINT(1)  NOT NULL DEFAULT 0;