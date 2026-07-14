-- Curriculum awareness for the timetable engine.
-- Periods and lesson requirements can be tagged CBC or 8-4-4 so the
-- generator only uses entries matching the grade's curriculum.

ALTER TABLE timetable_periods
  ADD COLUMN curriculum_type VARCHAR(20) NOT NULL DEFAULT 'CBC';

ALTER TABLE subject_lesson_requirements
  ADD COLUMN curriculum_type VARCHAR(20) NOT NULL DEFAULT 'CBC';

CREATE INDEX idx_ttp_curriculum ON timetable_periods (school_id, curriculum_type);
CREATE INDEX idx_slr_curriculum ON subject_lesson_requirements (school_id, curriculum_type);