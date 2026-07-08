-- 8-4-4 Secondary Assessment Support
-- Adds subject-level paper structure, calculation rules, and per-paper marks.
-- Backward compatible with CBC/CBE.

ALTER TABLE subjects
  ADD COLUMN curriculum_type    VARCHAR(20)  NOT NULL DEFAULT 'CBC',
  ADD COLUMN has_papers         TINYINT(1)   NOT NULL DEFAULT 0,
  ADD COLUMN calculation_type   VARCHAR(20)  NOT NULL DEFAULT 'GENERAL',
  ADD COLUMN calculation_config JSON         NULL;

CREATE TABLE IF NOT EXISTS subject_papers (
  id            CHAR(36) NOT NULL DEFAULT (UUID()),
  school_id     CHAR(36) NOT NULL,
  subject_id    CHAR(36) NOT NULL,
  name          VARCHAR(100) NOT NULL,
  code          VARCHAR(20)  NULL,
  paper_type    ENUM('THEORY','PRACTICAL','ORAL','PROJECT') NOT NULL DEFAULT 'THEORY',
  max_marks     DECIMAL(6,2) NOT NULL DEFAULT 100.00,
  display_order INT          NOT NULL DEFAULT 0,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_subject_paper (subject_id, name),
  KEY idx_sp_school (school_id),
  KEY idx_sp_subject (subject_id),
  CONSTRAINT fk_sp_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  CONSTRAINT fk_sp_school  FOREIGN KEY (school_id)  REFERENCES schools(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS exam_paper_marks (
  id               CHAR(36) NOT NULL DEFAULT (UUID()),
  school_id        CHAR(36) NOT NULL,
  academic_year_id CHAR(36) NULL,
  term_id          CHAR(36) NULL,
  exam_id          CHAR(36) NOT NULL,
  student_id       CHAR(36) NOT NULL,
  subject_id       CHAR(36) NULL,
  subject_name     VARCHAR(255) NOT NULL,
  paper_id         CHAR(36) NOT NULL,
  score            DECIMAL(6,2) NULL,
  max_marks        DECIMAL(6,2) NOT NULL,
  entered_by       CHAR(36) NULL,
  entered_at       TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  version          INT NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_paper_mark (exam_id, student_id, paper_id),
  KEY idx_epm_exam (exam_id),
  KEY idx_epm_student (student_id),
  KEY idx_epm_paper (paper_id),
  KEY idx_epm_session (school_id, academic_year_id, term_id),
  CONSTRAINT fk_epm_exam  FOREIGN KEY (exam_id)  REFERENCES exams(id)          ON DELETE CASCADE,
  CONSTRAINT fk_epm_paper FOREIGN KEY (paper_id) REFERENCES subject_papers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE exam_subjects
  ADD COLUMN calculation_type   VARCHAR(20) NULL,
  ADD COLUMN calculation_config JSON        NULL,
  ADD COLUMN uses_papers        TINYINT(1)  NOT NULL DEFAULT 0;
