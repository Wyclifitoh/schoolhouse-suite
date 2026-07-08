-- Per-school configurable 8-4-4 grading scale.
-- The hardcoded DEFAULT_844 in backend/src/modules/assessments/grading844.js
-- remains the runtime fallback when no rows exist for a school.

CREATE TABLE IF NOT EXISTS grading_scales_844 (
  id CHAR(36) PRIMARY KEY,
  school_id CHAR(36) NOT NULL,
  code VARCHAR(8) NOT NULL,
  min_pct DECIMAL(5,2) NOT NULL,
  max_pct DECIMAL(5,2) NOT NULL,
  points INT NOT NULL,
  remark VARCHAR(255) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_school_code (school_id, code),
  KEY idx_school (school_id),
  CONSTRAINT fk_gs844_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

-- Seed defaults for every existing school.
INSERT INTO grading_scales_844 (id, school_id, code, min_pct, max_pct, points, remark, sort_order)
SELECT UUID(), s.id, 'A',  80, 100, 12, 'Excellent', 1 FROM schools s;
INSERT INTO grading_scales_844 (id, school_id, code, min_pct, max_pct, points, remark, sort_order)
SELECT UUID(), s.id, 'A-', 75, 79,  11, 'Very good', 2 FROM schools s;
INSERT INTO grading_scales_844 (id, school_id, code, min_pct, max_pct, points, remark, sort_order)
SELECT UUID(), s.id, 'B+', 70, 74,  10, 'Good', 3 FROM schools s;
INSERT INTO grading_scales_844 (id, school_id, code, min_pct, max_pct, points, remark, sort_order)
SELECT UUID(), s.id, 'B',  65, 69,  9,  'Above average', 4 FROM schools s;
INSERT INTO grading_scales_844 (id, school_id, code, min_pct, max_pct, points, remark, sort_order)
SELECT UUID(), s.id, 'B-', 60, 64,  8,  'Average', 5 FROM schools s;
INSERT INTO grading_scales_844 (id, school_id, code, min_pct, max_pct, points, remark, sort_order)
SELECT UUID(), s.id, 'C+', 55, 59,  7,  'Fairly good', 6 FROM schools s;
INSERT INTO grading_scales_844 (id, school_id, code, min_pct, max_pct, points, remark, sort_order)
SELECT UUID(), s.id, 'C',  50, 54,  6,  'Average; can improve', 7 FROM schools s;
INSERT INTO grading_scales_844 (id, school_id, code, min_pct, max_pct, points, remark, sort_order)
SELECT UUID(), s.id, 'C-', 45, 49,  5,  'Below average', 8 FROM schools s;
INSERT INTO grading_scales_844 (id, school_id, code, min_pct, max_pct, points, remark, sort_order)
SELECT UUID(), s.id, 'D+', 40, 44,  4,  'Weak — needs effort', 9 FROM schools s;
INSERT INTO grading_scales_844 (id, school_id, code, min_pct, max_pct, points, remark, sort_order)
SELECT UUID(), s.id, 'D',  35, 39,  3,  'Poor — needs more practice', 10 FROM schools s;
INSERT INTO grading_scales_844 (id, school_id, code, min_pct, max_pct, points, remark, sort_order)
SELECT UUID(), s.id, 'D-', 30, 34,  2,  'Very poor', 11 FROM schools s;
INSERT INTO grading_scales_844 (id, school_id, code, min_pct, max_pct, points, remark, sort_order)
SELECT UUID(), s.id, 'E',  0,  29,  1,  'Fail — serious effort required', 12 FROM schools s;