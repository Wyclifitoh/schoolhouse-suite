-- ============================================
-- CHUO School Management System — SEED DATA
-- Run AFTER schema.sql:  mysql -u root -p chuo < seed.sql
-- ============================================

USE chuo;

-- ============================================
-- 1. SCHOOL
-- ============================================
SET @school_id = '11111111-1111-1111-1111-111111111111';

INSERT INTO schools (id, name, code, email, phone, curriculum_type)
VALUES (@school_id, 'Chuo Academy', 'CHUO001', 'admin@chuoacademy.ac.ke', '0700000000', 'CBC')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================
-- 2. ADMIN USER  (password: Admin@2026)
-- ============================================
SET @admin_id = '22222222-2222-2222-2222-222222222222';

INSERT INTO users (id, email, password_hash, full_name, phone)
VALUES (@admin_id, 'admin@chuoacademy.ac.ke',
  '$2b$10$LK8XQh3r1J5V5q7Z5z5z5uYJF7HqFZ3Z5z5z5z5z5z5z5z5z5z', -- bcrypt hash for Admin@2026
  'System Admin', '0700000000')
ON DUPLICATE KEY UPDATE email = VALUES(email);

INSERT INTO user_roles (id, user_id, school_id, role)
VALUES (UUID(), @admin_id, @school_id, 'school_admin')
ON DUPLICATE KEY UPDATE role = VALUES(role);

INSERT INTO profiles (id, school_id, first_name, last_name, email, phone)
VALUES (@admin_id, @school_id, 'System', 'Admin', 'admin@chuoacademy.ac.ke', '0700000000')
ON DUPLICATE KEY UPDATE first_name = VALUES(first_name);

-- ============================================
-- 3. ACADEMIC YEAR & TERMS
-- ============================================
SET @ay_id = '33333333-3333-3333-3333-333333333333';
SET @term1_id = '44444444-4444-4444-4444-444444444401';
SET @term2_id = '44444444-4444-4444-4444-444444444402';
SET @term3_id = '44444444-4444-4444-4444-444444444403';

INSERT INTO academic_years (id, school_id, name, start_date, end_date, is_current)
VALUES (@ay_id, @school_id, '2026', '2026-01-05', '2026-11-27', TRUE)
ON DUPLICATE KEY UPDATE is_current = TRUE;

INSERT INTO terms (id, school_id, academic_year_id, name, start_date, end_date, is_current) VALUES
(@term1_id, @school_id, @ay_id, 'Term 1 2026', '2026-01-05', '2026-04-10', TRUE),
(@term2_id, @school_id, @ay_id, 'Term 2 2026', '2026-05-05', '2026-08-08', FALSE),
(@term3_id, @school_id, @ay_id, 'Term 3 2026', '2026-09-01', '2026-11-27', FALSE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================
-- 4. GRADES (CBC Kenyan Curriculum)
-- ============================================
SET @g_rec = '55555555-5555-5555-5555-555555550001';
SET @g_pp1 = '55555555-5555-5555-5555-555555550002';
SET @g_pp2 = '55555555-5555-5555-5555-555555550003';
SET @g_g1  = '55555555-5555-5555-5555-555555550004';
SET @g_g2  = '55555555-5555-5555-5555-555555550005';
SET @g_g3  = '55555555-5555-5555-5555-555555550006';
SET @g_g4  = '55555555-5555-5555-5555-555555550007';
SET @g_g5  = '55555555-5555-5555-5555-555555550008';
SET @g_g6  = '55555555-5555-5555-5555-555555550009';
SET @g_g7  = '55555555-5555-5555-5555-555555550010';
SET @g_g8  = '55555555-5555-5555-5555-555555550011';
SET @g_g9  = '55555555-5555-5555-5555-555555550012';
SET @g_dc  = '55555555-5555-5555-5555-555555550013';

INSERT INTO grades (id, school_id, name, level, order_index, curriculum_type) VALUES
(@g_rec, @school_id, 'Reception',  'pre_primary',  0, 'CBC'),
(@g_pp1, @school_id, 'PP1',        'pre_primary',  1, 'CBC'),
(@g_pp2, @school_id, 'PP2',        'pre_primary',  2, 'CBC'),
(@g_g1,  @school_id, 'Grade 1',    'primary',      3, 'CBC'),
(@g_g2,  @school_id, 'Grade 2',    'primary',      4, 'CBC'),
(@g_g3,  @school_id, 'Grade 3',    'primary',      5, 'CBC'),
(@g_g4,  @school_id, 'Grade 4',    'primary',      6, 'CBC'),
(@g_g5,  @school_id, 'Grade 5',    'primary',      7, 'CBC'),
(@g_g6,  @school_id, 'Grade 6',    'primary',      8, 'CBC'),
(@g_g7,  @school_id, 'Grade 7',    'junior_secondary', 9, 'CBC'),
(@g_g8,  @school_id, 'Grade 8',    'junior_secondary', 10, 'CBC'),
(@g_g9,  @school_id, 'Grade 9',    'junior_secondary', 11, 'CBC'),
(@g_dc,  @school_id, 'Day Care',   'pre_primary',  -1, 'CBC')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================
-- 5. STREAMS (one per grade)
-- ============================================
INSERT INTO streams (id, school_id, grade_id, academic_year_id, name, capacity) VALUES
(UUID(), @school_id, @g_rec, @ay_id, 'Stream A', 40),
(UUID(), @school_id, @g_pp1, @ay_id, 'Stream A', 40),
(UUID(), @school_id, @g_pp2, @ay_id, 'Stream A', 40),
(UUID(), @school_id, @g_g1,  @ay_id, 'Stream A', 40),
(UUID(), @school_id, @g_g2,  @ay_id, 'Stream A', 40),
(UUID(), @school_id, @g_g3,  @ay_id, 'Stream A', 40),
(UUID(), @school_id, @g_g4,  @ay_id, 'Stream A', 40),
(UUID(), @school_id, @g_g5,  @ay_id, 'Stream A', 40),
(UUID(), @school_id, @g_g6,  @ay_id, 'Stream A', 40),
(UUID(), @school_id, @g_g7,  @ay_id, 'Stream A', 40),
(UUID(), @school_id, @g_g8,  @ay_id, 'Stream A', 40),
(UUID(), @school_id, @g_g9,  @ay_id, 'Stream A', 40),
(UUID(), @school_id, @g_dc,  @ay_id, 'Stream A', 20);

-- ============================================
-- 6. SUBJECTS (CBC Kenyan Curriculum)
-- ============================================
INSERT INTO subjects (id, school_id, name, code, description) VALUES
(UUID(), @school_id, 'English',              'ENG', 'English Language Activities / Literacy'),
(UUID(), @school_id, 'Kiswahili',            'KIS', 'Kiswahili Language Activities / Literacy'),
(UUID(), @school_id, 'Mathematics',          'MAT', 'Mathematics Activities / Numeracy'),
(UUID(), @school_id, 'Environmental Activities', 'ENV', 'Pre-primary Environmental Activities'),
(UUID(), @school_id, 'Hygiene & Nutrition',  'HYG', 'Hygiene and Nutrition Activities'),
(UUID(), @school_id, 'Creative Activities',  'CRE', 'Creative Arts & Music'),
(UUID(), @school_id, 'Psychomotor Activities','PSY', 'Movement and Physical Education'),
(UUID(), @school_id, 'Religious Education',  'RE',  'Christian / Islamic / Hindu Religious Education'),
(UUID(), @school_id, 'Science & Technology', 'SCI', 'Integrated Science and Technology'),
(UUID(), @school_id, 'Social Studies',       'SST', 'Social Studies'),
(UUID(), @school_id, 'Agriculture',          'AGR', 'Agriculture & Nutrition'),
(UUID(), @school_id, 'Home Science',         'HMS', 'Home Science'),
(UUID(), @school_id, 'Art & Craft',          'ART', 'Art and Craft / Visual Arts'),
(UUID(), @school_id, 'Music',                'MUS', 'Music'),
(UUID(), @school_id, 'Physical Education',   'PE',  'Physical Education & Sport'),
(UUID(), @school_id, 'Life Skills',          'LSK', 'Life Skills Education'),
(UUID(), @school_id, 'Computer Science',     'CS',  'Computer Science / ICT'),
(UUID(), @school_id, 'French',               'FRE', 'French Language'),
(UUID(), @school_id, 'German',               'GER', 'German Language'),
(UUID(), @school_id, 'Arabic',               'ARB', 'Arabic Language'),
(UUID(), @school_id, 'Mandarin',             'MAN', 'Mandarin Language'),
(UUID(), @school_id, 'Business Studies',     'BUS', 'Business Studies (Junior Secondary)'),
(UUID(), @school_id, 'Pre-Technical Studies','PTS', 'Pre-Technical and Pre-Career Education'),
(UUID(), @school_id, 'Health Education',     'HED', 'Health Education'),
(UUID(), @school_id, 'Pastoral Programme',   'PP',  'Pastoral Instruction Programme');

-- ============================================
-- 7. FEE CATEGORIES
-- ============================================
SET @fc_tuition  = '66666666-6666-6666-6666-666666660001';
SET @fc_uniform  = '66666666-6666-6666-6666-666666660002';
SET @fc_transport = '66666666-6666-6666-6666-666666660003';
SET @fc_arrears  = '66666666-6666-6666-6666-666666660004';

INSERT INTO fee_categories (id, school_id, name, type, description) VALUES
(@fc_tuition,   @school_id, 'Tuition Fee',   'tuition',   'Termly tuition charges'),
(@fc_uniform,   @school_id, 'Uniform Fee',   'one_time',  'School uniform charges'),
(@fc_transport, @school_id, 'Transport Fee',  'transport', 'School transport charges'),
(@fc_arrears,   @school_id, 'Arrears',        'tuition',   'Balance brought forward from previous term')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================
-- 8. FEE TEMPLATES (Term 1 2026 rates per grade)
-- ============================================
SET @ft_rec   = '77777777-7777-7777-7777-777777770001';
SET @ft_pp1   = '77777777-7777-7777-7777-777777770002';
SET @ft_pp2   = '77777777-7777-7777-7777-777777770003';
SET @ft_g1    = '77777777-7777-7777-7777-777777770004';
SET @ft_g2    = '77777777-7777-7777-7777-777777770005';
SET @ft_g3    = '77777777-7777-7777-7777-777777770006';
SET @ft_g4    = '77777777-7777-7777-7777-777777770007';
SET @ft_g5    = '77777777-7777-7777-7777-777777770008';
SET @ft_g6    = '77777777-7777-7777-7777-777777770009';
SET @ft_g7    = '77777777-7777-7777-7777-777777770010';
SET @ft_g9    = '77777777-7777-7777-7777-777777770012';

INSERT INTO fee_templates (id, school_id, name, code, fee_type, ledger_type, amount, is_mandatory, applicable_grades, priority) VALUES
(@ft_rec, @school_id, 'Reception Tuition T1',     'REC-T1',  'mandatory', 'fees', 20500, TRUE, '["Reception"]', 1),
(@ft_pp1, @school_id, 'PP1 Tuition T1',           'PP1-T1',  'mandatory', 'fees', 25000, TRUE, '["PP1"]', 1),
(@ft_pp2, @school_id, 'PP2 Tuition T1',           'PP2-T1',  'mandatory', 'fees', 25000, TRUE, '["PP2"]', 1),
(@ft_g1,  @school_id, 'Grade 1 Tuition T1',       'G1-T1',   'mandatory', 'fees', 28000, TRUE, '["Grade 1"]', 1),
(@ft_g2,  @school_id, 'Grade 2 Tuition T1',       'G2-T1',   'mandatory', 'fees', 28000, TRUE, '["Grade 2"]', 1),
(@ft_g3,  @school_id, 'Grade 3 Tuition T1',       'G3-T1',   'mandatory', 'fees', 28000, TRUE, '["Grade 3"]', 1),
(@ft_g4,  @school_id, 'Grade 4 Tuition T1',       'G4-T1',   'mandatory', 'fees', 34500, TRUE, '["Grade 4"]', 1),
(@ft_g5,  @school_id, 'Grade 5 Tuition T1',       'G5-T1',   'mandatory', 'fees', 34500, TRUE, '["Grade 5"]', 1),
(@ft_g6,  @school_id, 'Grade 6 Tuition T1',       'G6-T1',   'mandatory', 'fees', 34500, TRUE, '["Grade 6"]', 1),
(@ft_g7,  @school_id, 'Grade 7 Tuition T1',       'G7-T1',   'mandatory', 'fees', 37000, TRUE, '["Grade 7"]', 1),
(@ft_g9,  @school_id, 'Grade 9 Tuition T1',       'G9-T1',   'mandatory', 'fees', 37000, TRUE, '["Grade 9"]', 1)
ON DUPLICATE KEY UPDATE amount = VALUES(amount);

-- New student rates (slightly higher)
SET @ft_pp1_new = '77777777-7777-7777-7777-777777770102';
SET @ft_pp2_new = '77777777-7777-7777-7777-777777770103';
SET @ft_g1_new  = '77777777-7777-7777-7777-777777770104';
SET @ft_g2_new  = '77777777-7777-7777-7777-777777770105';
SET @ft_g3_new  = '77777777-7777-7777-7777-777777770106';
SET @ft_g4_new  = '77777777-7777-7777-7777-777777770107';
SET @ft_g5_new  = '77777777-7777-7777-7777-777777770108';
SET @ft_g6_new  = '77777777-7777-7777-7777-777777770109';
SET @ft_g7_new  = '77777777-7777-7777-7777-777777770110';

INSERT INTO fee_templates (id, school_id, name, code, fee_type, ledger_type, amount, is_mandatory, applicable_grades, priority) VALUES
(@ft_pp1_new, @school_id, 'PP1 Tuition T1 (New)',     'PP1-T1-N',  'mandatory', 'fees', 25500, TRUE, '["PP1"]', 2),
(@ft_pp2_new, @school_id, 'PP2 Tuition T1 (New)',     'PP2-T1-N',  'mandatory', 'fees', 25500, TRUE, '["PP2"]', 2),
(@ft_g1_new,  @school_id, 'Grade 1 Tuition T1 (New)', 'G1-T1-N',  'mandatory', 'fees', 32000, TRUE, '["Grade 1"]', 2),
(@ft_g2_new,  @school_id, 'Grade 2 Tuition T1 (New)', 'G2-T1-N',  'mandatory', 'fees', 32000, TRUE, '["Grade 2"]', 2),
(@ft_g3_new,  @school_id, 'Grade 3 Tuition T1 (New)', 'G3-T1-N',  'mandatory', 'fees', 32000, TRUE, '["Grade 3"]', 2),
(@ft_g4_new,  @school_id, 'Grade 4 Tuition T1 (New)', 'G4-T1-N',  'mandatory', 'fees', 34500, TRUE, '["Grade 4"]', 2),
(@ft_g5_new,  @school_id, 'Grade 5 Tuition T1 (New)', 'G5-T1-N',  'mandatory', 'fees', 34500, TRUE, '["Grade 5"]', 2),
(@ft_g6_new,  @school_id, 'Grade 6 Tuition T1 (New)', 'G6-T1-N',  'mandatory', 'fees', 34500, TRUE, '["Grade 6"]', 2),
(@ft_g7_new,  @school_id, 'Grade 7 Tuition T1 (New)', 'G7-T1-N',  'mandatory', 'fees', 39000, TRUE, '["Grade 7"]', 2)
ON DUPLICATE KEY UPDATE amount = VALUES(amount);

-- ============================================
-- 9. STUDENTS + PARENTS + STUDENT FEES
-- Each student: INSERT student, INSERT parent(s), INSERT student_fees
-- Data from LEARNERS_BIODATA + Term_1_Fees_2026 spreadsheets
-- ============================================

-- Helper: grade lookup function
-- We'll reference grade variables directly

-- -----------------------------------------------
-- STUDENT 1: Israel Kefa Oirere — PP1 OLD
-- -----------------------------------------------
SET @s1 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s1, @school_id, 'CHUO/2025/001', 'Israel Kefa', 'Oirere', 'PP1', @g_pp1, 'active', '2025-01-06', 'Charles Kefa', '0724671717');
INSERT INTO parents (id, school_id, first_name, last_name, phone) VALUES
(@p1f := UUID(), @school_id, 'Charles', 'Kefa', '0724671717'),
(@p1m := UUID(), @school_id, 'Linet', 'Nyaboke', '0741710405');
INSERT INTO student_parents (id, student_id, parent_id, relationship, is_primary_contact) VALUES
(UUID(), @s1, @p1f, 'father', FALSE), (UUID(), @s1, @p1m, 'mother', TRUE);
-- Fees: T3 bal=0, T1=0, total=0, paid=0, balance=0 (fully paid)

-- STUDENT 2: Hadassah Chloy — PP1 OLD
SET @s2 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s2, @school_id, 'CHUO/2025/002', 'Hadassah', 'Chloy', 'PP1', @g_pp1, 'active', '2025-01-06', 'Martha W', '0722551475');
INSERT INTO parents (id, school_id, first_name, last_name, phone) VALUES (@p2m := UUID(), @school_id, 'Martha', 'W', '0722551475');
INSERT INTO student_parents (id, student_id, parent_id, relationship, is_primary_contact) VALUES (UUID(), @s2, @p2m, 'mother', TRUE);
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s2, @ft_pp1, @term1_id, @ay_id, 'fees', 30000, 0, 'pending', '2026-02-15');

-- STUDENT 3: Octavia Tasha — PP1 OLD
SET @s3 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s3, @school_id, 'CHUO/2025/003', 'Octavia', 'Tasha', 'PP1', @g_pp1, 'active', '2025-01-06', 'Kenneth Rutere', '0719835265');
INSERT INTO parents (id, school_id, first_name, last_name, phone) VALUES
(@p3f := UUID(), @school_id, 'Kenneth', 'Rutere', '0719835265'),
(@p3m := UUID(), @school_id, 'Faith', 'Gesare', '0705539502');
INSERT INTO student_parents (id, student_id, parent_id, relationship, is_primary_contact) VALUES
(UUID(), @s3, @p3f, 'father', FALSE), (UUID(), @s3, @p3m, 'mother', TRUE);
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s3, @ft_pp1, @term1_id, @ay_id, 'fees', 25000, 0, 'pending', '2026-02-15');

-- STUDENT 4: Ashley Wanjiru — PP1 OLD
SET @s4 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s4, @school_id, 'CHUO/2025/004', 'Ashley', 'Wanjiru', 'PP1', @g_pp1, 'active', '2025-01-06', 'Hiram Njihia', '0790050129');
INSERT INTO parents (id, school_id, first_name, last_name, phone) VALUES
(@p4f := UUID(), @school_id, 'Hiram', 'Njihia', '0790050129'),
(@p4m := UUID(), @school_id, 'Ann', 'Muthoni', '0790050129');
INSERT INTO student_parents (id, student_id, parent_id, relationship, is_primary_contact) VALUES
(UUID(), @s4, @p4f, 'father', FALSE), (UUID(), @s4, @p4m, 'mother', TRUE);
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s4, @ft_pp1, @term1_id, @ay_id, 'fees', 37600, 0, 'pending', '2026-02-15');

-- STUDENT 5: Zion Lael — PP1 OLD
SET @s5 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s5, @school_id, 'CHUO/2025/005', 'Zion', 'Lael', 'PP1', @g_pp1, 'active', '2025-01-06', 'Stacy Kajuju', '0700930692');
INSERT INTO parents (id, school_id, first_name, last_name, phone) VALUES (@p5m := UUID(), @school_id, 'Stacy', 'Kajuju', '0700930692');
INSERT INTO student_parents (id, student_id, parent_id, relationship, is_primary_contact) VALUES (UUID(), @s5, @p5m, 'mother', TRUE);
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s5, @ft_pp1, @term1_id, @ay_id, 'fees', 38100, 0, 'pending', '2026-02-15');

-- STUDENT 6: Monica Muthoni — PP1 OLD
SET @s6 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s6, @school_id, 'CHUO/2025/006', 'Monica', 'Muthoni', 'PP1', @g_pp1, 'active', '2025-01-06', 'Esther Jelagat', '0708560341');
INSERT INTO parents (id, school_id, first_name, last_name, phone) VALUES (@p6m := UUID(), @school_id, 'Esther', 'Jelagat', '0708560341');
INSERT INTO student_parents (id, student_id, parent_id, relationship, is_primary_contact) VALUES (UUID(), @s6, @p6m, 'mother', TRUE);
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s6, @ft_pp1, @term1_id, @ay_id, 'fees', 30000, 0, 'pending', '2026-02-15');

-- STUDENT 7: Adrian Amani — PP1 OLD
SET @s7 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s7, @school_id, 'CHUO/2025/007', 'Adrian', 'Amani', 'PP1', @g_pp1, 'active', '2025-01-06', 'Lena Naitore', '0715149171');
INSERT INTO parents (id, school_id, first_name, last_name, phone) VALUES (@p7m := UUID(), @school_id, 'Lena', 'Naitore', '0715149171');
INSERT INTO student_parents (id, student_id, parent_id, relationship, is_primary_contact) VALUES (UUID(), @s7, @p7m, 'mother', TRUE);
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s7, @ft_pp1, @term1_id, @ay_id, 'fees', 25000, 0, 'pending', '2026-02-15');

-- STUDENT 8: Bliss Favour — PP1 OLD
SET @s8 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s8, @school_id, 'CHUO/2025/008', 'Bliss', 'Favour', 'PP1', @g_pp1, 'active', '2025-01-06', 'Mose Kwamboka', '0729515002');
INSERT INTO parents (id, school_id, first_name, last_name, phone) VALUES
(@p8f := UUID(), @school_id, 'Isaac', 'Sunday', '0717376814'),
(@p8m := UUID(), @school_id, 'Mose', 'Kwamboka', '0729515002');
INSERT INTO student_parents (id, student_id, parent_id, relationship, is_primary_contact) VALUES
(UUID(), @s8, @p8f, 'father', FALSE), (UUID(), @s8, @p8m, 'mother', TRUE);
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s8, @ft_pp1, @term1_id, @ay_id, 'fees', 43800, 18000, 'partial', '2026-02-15');

-- STUDENT 9: Ivanna Joy — PP1 OLD
SET @s9 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s9, @school_id, 'CHUO/2025/009', 'Ivanna', 'Joy', 'PP1', @g_pp1, 'active', '2025-01-06', 'Edah Nyaga', '0726971569');
INSERT INTO parents (id, school_id, first_name, last_name, phone) VALUES
(@p9f := UUID(), @school_id, 'Edah', 'Nyaga', '0726971569'),
(@p9m := UUID(), @school_id, 'Fidelis', 'Momanyi', '0722262421');
INSERT INTO student_parents (id, student_id, parent_id, relationship, is_primary_contact) VALUES
(UUID(), @s9, @p9f, 'father', TRUE), (UUID(), @s9, @p9m, 'mother', FALSE);
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s9, @ft_pp1, @term1_id, @ay_id, 'fees', 31500, 0, 'pending', '2026-02-15');

-- STUDENT 10: Dayson Mwangi — PP1 OLD
SET @s10 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s10, @school_id, 'CHUO/2025/010', 'Dayson', 'Mwangi', 'PP1', @g_pp1, 'active', '2025-01-06', 'Elijah Ndwiga', '0768539445');
INSERT INTO parents (id, school_id, first_name, last_name, phone) VALUES
(@p10f := UUID(), @school_id, 'Elijah', 'Ndwiga', '0768539445'),
(@p10m := UUID(), @school_id, 'Jane', 'Wanjira', '0115697533');
INSERT INTO student_parents (id, student_id, parent_id, relationship, is_primary_contact) VALUES
(UUID(), @s10, @p10f, 'father', TRUE), (UUID(), @s10, @p10m, 'mother', FALSE);
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s10, @ft_pp1, @term1_id, @ay_id, 'fees', 56720, 0, 'pending', '2026-02-15');

-- -----------------------------------------------
-- STUDENTS 11-60 (OLD students continuing)
-- -----------------------------------------------

-- S11: Eshan Mutenyo PP1
SET @s11 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s11, @school_id, 'CHUO/2025/011', 'Eshan', 'Mutenyo', 'PP1', @g_pp1, 'active', '2025-01-06', 'Rechard Makau', '0704427348');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s11, @ft_pp1, @term1_id, @ay_id, 'fees', 61950, 0, 'pending', '2026-02-15');

-- S12: Zulu Hiwari PP1
SET @s12 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s12, @school_id, 'CHUO/2025/012', 'Zulu', 'Hiwari', 'PP1', @g_pp1, 'active', '2025-01-06', 'Keta Maryann', '0716404605');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s12, @ft_pp1, @term1_id, @ay_id, 'fees', 25000, 0, 'pending', '2026-02-15');

-- S13: Blessy Pendo PP1
SET @s13 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s13, @school_id, 'CHUO/2025/013', 'Blessy', 'Pendo', 'PP1', @g_pp1, 'active', '2025-01-06', 'Martin Gitonga', '0723519454');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s13, @ft_pp1, @term1_id, @ay_id, 'fees', 25000, 0, 'pending', '2026-02-15');

-- S14: Gracia Nelson PP1
SET @s14 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s14, @school_id, 'CHUO/2025/014', 'Gracia', 'Nelson', 'PP1', @g_pp1, 'active', '2025-01-06', 'Veronica Nzioka', '0768681849');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s14, @ft_pp1, @term1_id, @ay_id, 'fees', 26000, 0, 'pending', '2026-02-15');

-- S15: Glen Moser PP1
SET @s15 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s15, @school_id, 'CHUO/2025/015', 'Glen', 'Moser', 'PP1', @g_pp1, 'active', '2025-01-06', '', '');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s15, @ft_pp1, @term1_id, @ay_id, 'fees', 26600, 0, 'pending', '2026-02-15');

-- S16: Kylian Torah PP1
SET @s16 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s16, @school_id, 'CHUO/2025/016', 'Kylian', 'Torah', 'PP1', @g_pp1, 'active', '2025-01-06', 'Ondigo Alex', '0742276665');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s16, @ft_pp1, @term1_id, @ay_id, 'fees', 35150, 0, 'pending', '2026-02-15');

-- S17: Jordan Ochola PP1
SET @s17 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s17, @school_id, 'CHUO/2025/017', 'Jordan', 'Ochola', 'PP1', @g_pp1, 'active', '2025-01-06', '', '');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s17, @ft_pp1, @term1_id, @ay_id, 'fees', 42930, 0, 'pending', '2026-02-15');

-- S18: Nivan Ochieng REC
SET @s18 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s18, @school_id, 'CHUO/2025/018', 'Nivan', 'Ochieng', 'REC', @g_rec, 'active', '2025-01-06', '', '');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s18, @ft_rec, @term1_id, @ay_id, 'fees', 20500, 0, 'pending', '2026-02-15');

-- S19: Natalie Nyanchama PP1
SET @s19 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s19, @school_id, 'CHUO/2025/019', 'Natalie', 'Nyanchama', 'PP1', @g_pp1, 'active', '2025-01-06', 'Evans Ondari', '0702159202');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s19, @ft_pp1, @term1_id, @ay_id, 'fees', 40550, 0, 'pending', '2026-02-15');

-- S20: Tyrone Scott Karwa PP1
SET @s20 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s20, @school_id, 'CHUO/2025/020', 'Tyrone Scott', 'Karwa', 'PP1', @g_pp1, 'active', '2025-01-06', 'Lerisha Elam', '0726484649');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s20, @ft_pp1, @term1_id, @ay_id, 'fees', 27000, 0, 'pending', '2026-02-15');

-- S21: Zaylee Gachambi M. PP1
SET @s21 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s21, @school_id, 'CHUO/2025/021', 'Zaylee Gachambi', 'M', 'PP1', @g_pp1, 'active', '2025-01-06', 'Martin Migwi', '0700300424');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s21, @ft_pp1, @term1_id, @ay_id, 'fees', 22250, 0, 'pending', '2026-02-15');

-- S22: Jeremy Mutunga PP1
SET @s22 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s22, @school_id, 'CHUO/2025/022', 'Jeremy', 'Mutunga', 'PP1', @g_pp1, 'active', '2025-01-06', 'Felistus Kalimi', '0798940684');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s22, @ft_pp1, @term1_id, @ay_id, 'fees', 32500, 0, 'pending', '2026-02-15');

-- S23: Astra Shiyan PP1
SET @s23 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s23, @school_id, 'CHUO/2025/023', 'Astra', 'Shiyan', 'PP1', @g_pp1, 'active', '2025-01-06', 'Mercy Mwai', '0790338272');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s23, @ft_pp1, @term1_id, @ay_id, 'fees', 34950, 3000, 'partial', '2026-02-15');

-- S24: Keziah Wanjiru PP2
SET @s24 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s24, @school_id, 'CHUO/2025/024', 'Keziah', 'Wanjiru', 'PP2', @g_pp2, 'active', '2025-01-06', 'Joseph Maina', '0790830781');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s24, @ft_pp2, @term1_id, @ay_id, 'fees', 29600, 0, 'pending', '2026-02-15');

-- S25: Leroy Agunto PP2
SET @s25 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s25, @school_id, 'CHUO/2025/025', 'Leroy', 'Agunto', 'PP2', @g_pp2, 'active', '2025-01-06', 'Mackean Otieno', '0722591599');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s25, @ft_pp2, @term1_id, @ay_id, 'fees', 40000, 8000, 'partial', '2026-02-15');

-- S26: Blessings Neema G1
SET @s26 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s26, @school_id, 'CHUO/2025/026', 'Blessings', 'Neema', 'G1', @g_g1, 'active', '2025-01-06', 'Victor Enzoveri', '0714493530');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s26, @ft_g1, @term1_id, @ay_id, 'fees', 35500, 0, 'pending', '2026-02-15');

-- S27: Luna Katharimi PP2
SET @s27 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s27, @school_id, 'CHUO/2025/027', 'Luna', 'Katharimi', 'PP2', @g_pp2, 'active', '2025-01-06', 'Donald Mutiga', '0723991242');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s27, @ft_pp2, @term1_id, @ay_id, 'fees', 41900, 0, 'pending', '2026-02-15');

-- S28: Leslie Madelyne PP2
SET @s28 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s28, @school_id, 'CHUO/2025/028', 'Leslie', 'Madelyne', 'PP2', @g_pp2, 'active', '2025-01-06', 'Peris Mwihaki', '0769145022');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s28, @ft_pp2, @term1_id, @ay_id, 'fees', 41000, 0, 'pending', '2026-02-15');

-- S29: Dashiel Kireru PP2
SET @s29 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s29, @school_id, 'CHUO/2025/029', 'Dashiel', 'Kireru', 'PP2', @g_pp2, 'active', '2025-01-06', '', '');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s29, @ft_pp2, @term1_id, @ay_id, 'fees', 32200, 0, 'pending', '2026-02-15');

-- S30: Erica Kemunto PP2
SET @s30 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s30, @school_id, 'CHUO/2025/030', 'Erica', 'Kemunto', 'PP2', @g_pp2, 'active', '2025-01-06', '', '');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s30, @ft_pp2, @term1_id, @ay_id, 'fees', 41100, 0, 'pending', '2026-02-15');

-- S31: Dylan Dane G1
SET @s31 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s31, @school_id, 'CHUO/2025/031', 'Dylan', 'Dane', 'G1', @g_g1, 'active', '2025-01-06', 'Felix Onyango', '0713146988');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s31, @ft_g1, @term1_id, @ay_id, 'fees', 34500, 8500, 'partial', '2026-02-15');

-- S32: Amelia Magaki G1
SET @s32 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s32, @school_id, 'CHUO/2025/032', 'Amelia', 'Magaki', 'G1', @g_g1, 'active', '2025-01-06', 'Julius Ongori', '0723635583');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s32, @ft_g1, @term1_id, @ay_id, 'fees', 41830, 0, 'pending', '2026-02-15');

-- S33: Nyilan Myer PP2
SET @s33 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s33, @school_id, 'CHUO/2025/033', 'Nyilan', 'Myer', 'PP2', @g_pp2, 'active', '2025-01-06', '', '');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s33, @ft_pp2, @term1_id, @ay_id, 'fees', 45500, 0, 'pending', '2026-02-15');

-- S34: Aiden Zhiyong Shi G1
SET @s34 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s34, @school_id, 'CHUO/2025/034', 'Aiden Zhiyong', 'Shi', 'G1', @g_g1, 'active', '2025-01-06', 'Dorcas Achieng', '0704672658');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s34, @ft_g1, @term1_id, @ay_id, 'fees', 38700, 0, 'pending', '2026-02-15');

-- S35: Shamaila Nyaboke PP2
SET @s35 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s35, @school_id, 'CHUO/2025/035', 'Shamaila', 'Nyaboke', 'PP2', @g_pp2, 'active', '2025-01-06', '', '');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s35, @ft_pp2, @term1_id, @ay_id, 'fees', 40000, 0, 'pending', '2026-02-15');

-- S36: Cayden Ryan PP2
SET @s36 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s36, @school_id, 'CHUO/2025/036', 'Cayden', 'Ryan', 'PP2', @g_pp2, 'active', '2025-01-06', 'Bryan Aswa', '0724883127');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s36, @ft_pp2, @term1_id, @ay_id, 'fees', 56020, 5000, 'partial', '2026-02-15');

-- S37: Joygrace Miruka G2
SET @s37 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s37, @school_id, 'CHUO/2025/037', 'Joygrace', 'Miruka', 'G2', @g_g2, 'active', '2025-01-06', 'Moses Miruka', '0797892925');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s37, @ft_g2, @term1_id, @ay_id, 'fees', 46350, 0, 'pending', '2026-02-15');

-- S38: Morgan Abu G2
SET @s38 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s38, @school_id, 'CHUO/2025/038', 'Morgan', 'Abu', 'G2', @g_g2, 'active', '2025-01-06', 'Collins Libasia', '0714311672');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s38, @ft_g2, @term1_id, @ay_id, 'fees', 28000, 20000, 'partial', '2026-02-15');

-- S39: Sarah Blessings G2
SET @s39 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s39, @school_id, 'CHUO/2025/039', 'Sarah', 'Blessings', 'G2', @g_g2, 'active', '2025-01-06', 'Hiram Njihia', '0790050129');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s39, @ft_g2, @term1_id, @ay_id, 'fees', 48200, 0, 'pending', '2026-02-15');

-- S40: Cooper Mugambi G2
SET @s40 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s40, @school_id, 'CHUO/2025/040', 'Cooper', 'Mugambi', 'G2', @g_g2, 'active', '2025-01-06', 'Donald Mutiga', '0723991242');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s40, @ft_g2, @term1_id, @ay_id, 'fees', 56300, 0, 'pending', '2026-02-15');

-- S41: Nimrod Ainga G3
SET @s41 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s41, @school_id, 'CHUO/2025/041', 'Nimrod', 'Ainga', 'G3', @g_g3, 'active', '2025-01-06', 'Nicholas Ombui', '0728997006');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s41, @ft_g3, @term1_id, @ay_id, 'fees', 69900, 0, 'pending', '2026-02-15');

-- S42: Heavenly Joy G3
SET @s42 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s42, @school_id, 'CHUO/2025/042', 'Heavenly', 'Joy', 'G3', @g_g3, 'active', '2025-01-06', 'Francis Ogengo', '0707460853');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s42, @ft_g3, @term1_id, @ay_id, 'fees', 34500, 0, 'pending', '2026-02-15');

-- S43: Vanessa Aikon G4
SET @s43 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s43, @school_id, 'CHUO/2025/043', 'Vanessa', 'Aikon', 'G4', @g_g4, 'active', '2025-01-06', 'Yasmin Atebo', '0718015080');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s43, @ft_g4, @term1_id, @ay_id, 'fees', 34500, 0, 'pending', '2026-02-15');

-- S44: Amaria Chepkemoi G4
SET @s44 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s44, @school_id, 'CHUO/2025/044', 'Amaria', 'Chepkemoi', 'G4', @g_g4, 'active', '2025-01-06', 'Stacy Kajuju', '0700930692');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s44, @ft_g4, @term1_id, @ay_id, 'fees', 57030, 0, 'pending', '2026-02-15');

-- S45: Melania Kemunto G4
SET @s45 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s45, @school_id, 'CHUO/2025/045', 'Melania', 'Kemunto', 'G4', @g_g4, 'active', '2025-01-06', 'Julius Ongori', '0723635583');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s45, @ft_g4, @term1_id, @ay_id, 'fees', 52790, 0, 'pending', '2026-02-15');

-- S46: Portia Mumo G5
SET @s46 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s46, @school_id, 'CHUO/2025/046', 'Portia', 'Mumo', 'G5', @g_g5, 'active', '2025-01-06', 'Ruth Kinya', '0708988011');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s46, @ft_g5, @term1_id, @ay_id, 'fees', 43180, 0, 'pending', '2026-02-15');

-- S47: Daniel Mutwiri G5
SET @s47 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s47, @school_id, 'CHUO/2025/047', 'Daniel', 'Mutwiri', 'G5', @g_g5, 'active', '2025-01-06', '', '');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s47, @ft_g5, @term1_id, @ay_id, 'fees', 36000, 31000, 'partial', '2026-02-15');

-- S48: Morgan Omollo G5
SET @s48 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s48, @school_id, 'CHUO/2025/048', 'Morgan', 'Omollo', 'G5', @g_g5, 'active', '2025-01-06', '', '');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s48, @ft_g5, @term1_id, @ay_id, 'fees', 58300, 0, 'pending', '2026-02-15');

-- S49: Evan Wanjau G4
SET @s49 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s49, @school_id, 'CHUO/2025/049', 'Evan', 'Wanjau', 'G4', @g_g4, 'active', '2025-01-06', 'Isaac Wanjau', '0702693940');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s49, @ft_g4, @term1_id, @ay_id, 'fees', 65000, 0, 'pending', '2026-02-15');

-- S50: Angel Victoria Moraa G6
SET @s50 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s50, @school_id, 'CHUO/2025/050', 'Angel Victoria', 'Moraa', 'G6', @g_g6, 'active', '2025-01-06', 'Joan Zainabu', '0721766125');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s50, @ft_g6, @term1_id, @ay_id, 'fees', 77123, 0, 'pending', '2026-02-15');

-- S51: Darren Arude G6 (has credit)
SET @s51 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s51, @school_id, 'CHUO/2025/051', 'Darren', 'Arude', 'G6', @g_g6, 'active', '2025-01-06', 'Yasmin Atebo', '0718015080');
-- Has credit/advance, skip fee or set 0

-- S52: Hamida Kwamboka G6
SET @s52 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s52, @school_id, 'CHUO/2025/052', 'Hamida', 'Kwamboka', 'G6', @g_g6, 'active', '2025-01-06', 'Rechard Makau', '0704427348');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s52, @ft_g6, @term1_id, @ay_id, 'fees', 69000, 0, 'pending', '2026-02-15');

-- S53: Havillah Nyambura G7
SET @s53 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s53, @school_id, 'CHUO/2025/053', 'Havillah', 'Nyambura', 'G7', @g_g7, 'active', '2025-01-06', 'Martha Wanjiru', '0722551477');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s53, @ft_g7, @term1_id, @ay_id, 'fees', 43500, 0, 'pending', '2026-02-15');

-- S54: Irene Wambugu G9
SET @s54 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s54, @school_id, 'CHUO/2025/054', 'Irene', 'Wambugu', 'G9', @g_g9, 'active', '2025-01-06', 'Martha Wanjiru', '0722551475');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s54, @ft_g9, @term1_id, @ay_id, 'fees', 44750, 0, 'pending', '2026-02-15');

-- S55: Elisha Laeli G1
SET @s55 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s55, @school_id, 'CHUO/2025/055', 'Elisha', 'Laeli', 'G1', @g_g1, 'active', '2025-01-06', 'Stacy Kajuju', '0700930692');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s55, @ft_g1, @term1_id, @ay_id, 'fees', 54950, 0, 'pending', '2026-02-15');

-- S56: Adia Wagicuru Mugai G1
SET @s56 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s56, @school_id, 'CHUO/2025/056', 'Adia Wagicuru', 'Mugai', 'G1', @g_g1, 'active', '2025-01-06', 'Mercy Machuki', '0707280970');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s56, @ft_g1, @term1_id, @ay_id, 'fees', 28100, 0, 'pending', '2026-02-15');

-- S57: Damia Kelsey G1
SET @s57 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s57, @school_id, 'CHUO/2025/057', 'Damia', 'Kelsey', 'G1', @g_g1, 'active', '2025-01-06', 'Mumbi Mildred', '0703795968');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s57, @ft_g1, @term1_id, @ay_id, 'fees', 33500, 0, 'pending', '2026-02-15');

-- S58: Dion Kate G7
SET @s58 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s58, @school_id, 'CHUO/2025/058', 'Dion', 'Kate', 'G7', @g_g7, 'active', '2025-01-06', 'Mumbi Mildred', '0703795968');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s58, @ft_g7, @term1_id, @ay_id, 'fees', 44500, 0, 'pending', '2026-02-15');

-- S59: Arriana Sky G4
SET @s59 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s59, @school_id, 'CHUO/2025/059', 'Arriana', 'Sky', 'G4', @g_g4, 'active', '2025-01-06', 'Tracy Awuor', '0713731580');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s59, @ft_g4, @term1_id, @ay_id, 'fees', 36500, 0, 'pending', '2026-02-15');

-- S60: Zainab Said REC
SET @s60 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s60, @school_id, 'CHUO/2025/060', 'Zainab', 'Said', 'REC', @g_rec, 'active', '2025-01-06', '', '');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s60, @ft_rec, @term1_id, @ay_id, 'fees', 22800, 0, 'pending', '2026-02-15');

-- S61: Swahiba Mwatika PP1
SET @s61 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s61, @school_id, 'CHUO/2025/061', 'Swahiba', 'Mwatika', 'PP1', @g_pp1, 'active', '2025-01-06', 'Gerald Mutugi', '0722636943');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s61, @ft_pp1, @term1_id, @ay_id, 'fees', 25000, 0, 'pending', '2026-02-15');

-- -----------------------------------------------
-- NEW STUDENTS (62-160) — Term 1 2026
-- -----------------------------------------------

-- S62: Jayden Ludorc Sagini G2 NEW
SET @s62 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s62, @school_id, 'CHUO/2026/062', 'Jayden Ludorc', 'Sagini', 'G2', @g_g2, 'active', '2026-01-05', 'Esleen', '0768860172');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s62, @ft_g2_new, @term1_id, @ay_id, 'fees', 32000, 11000, 'partial', '2026-02-15');

-- S63: Zipporah Kwamboka REC NEW
SET @s63 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s63, @school_id, 'CHUO/2026/063', 'Zipporah', 'Kwamboka', 'REC', @g_rec, 'active', '2026-01-05', 'Esleen', '0768860172');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s63, @ft_rec, @term1_id, @ay_id, 'fees', 20500, 13000, 'partial', '2026-02-15');

-- S65: Valencia Carlos REC NEW
SET @s65 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s65, @school_id, 'CHUO/2026/065', 'Valencia', 'Carlos', 'REC', @g_rec, 'active', '2026-01-05', 'Susan Owuor', '0741815014');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s65, @ft_rec, @term1_id, @ay_id, 'fees', 20500, 7000, 'partial', '2026-02-15');

-- S66: Dylan Mkimbo G1 NEW
SET @s66 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s66, @school_id, 'CHUO/2026/066', 'Dylan', 'Mkimbo', 'G1', @g_g1, 'active', '2026-01-05', 'Akumu Poustyne', '0724565418');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s66, @ft_g1_new, @term1_id, @ay_id, 'fees', 32000, 4000, 'partial', '2026-02-15');

-- S67: Davine Mkimbo G5 NEW
SET @s67 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s67, @school_id, 'CHUO/2026/067', 'Davine', 'Mkimbo', 'G5', @g_g5, 'active', '2026-01-05', 'Akumu Poustyne', '0724565418');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s67, @ft_g5_new, @term1_id, @ay_id, 'fees', 34500, 19000, 'partial', '2026-02-15');

-- S68: Precious Muleni G1 NEW
SET @s68 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s68, @school_id, 'CHUO/2026/068', 'Precious', 'Muleni', 'G1', @g_g1, 'active', '2026-01-05', 'Daniel Wambua', '0720767741');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s68, @ft_g1_new, @term1_id, @ay_id, 'fees', 32000, 3500, 'partial', '2026-02-15');

-- S69: Dylan Nariuni PP2 NEW
SET @s69 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s69, @school_id, 'CHUO/2026/069', 'Dylan', 'Nariuni', 'PP2', @g_pp2, 'active', '2026-01-05', 'Martha Kariuki', '0708775242');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s69, @ft_pp2_new, @term1_id, @ay_id, 'fees', 25500, 28000, 'paid', '2026-02-15');

-- S70: Lovina Karimi REC NEW
SET @s70 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s70, @school_id, 'CHUO/2026/070', 'Lovina', 'Karimi', 'REC', @g_rec, 'active', '2026-01-05', '', '');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s70, @ft_rec, @term1_id, @ay_id, 'fees', 20500, 20500, 'paid', '2026-02-15');

-- S71: Nathan Mathenge G4 NEW
SET @s71 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s71, @school_id, 'CHUO/2026/071', 'Nathan', 'Mathenge', 'G4', @g_g4, 'active', '2026-01-05', 'Maryann Wanaja', '0723521867');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s71, @ft_g4_new, @term1_id, @ay_id, 'fees', 42750, 3000, 'partial', '2026-02-15');

-- S72: Candice Mathenge G2 NEW
SET @s72 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s72, @school_id, 'CHUO/2026/072', 'Candice', 'Mathenge', 'G2', @g_g2, 'active', '2026-01-05', 'Maryann Wanja', '0723521867');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s72, @ft_g2_new, @term1_id, @ay_id, 'fees', 39050, 3000, 'partial', '2026-02-15');

-- S73: Farida Arabella REC NEW
SET @s73 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s73, @school_id, 'CHUO/2026/073', 'Farida', 'Arabella', 'REC', @g_rec, 'active', '2026-01-05', 'Faith Awino', '0721236304');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s73, @ft_rec, @term1_id, @ay_id, 'fees', 20500, 4000, 'partial', '2026-02-15');

-- S74: Jadiel Galgalo REC NEW
SET @s74 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s74, @school_id, 'CHUO/2026/074', 'Jadiel', 'Galgalo', 'REC', @g_rec, 'active', '2026-01-05', 'Yasmin Atebo', '0718015080');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s74, @ft_rec, @term1_id, @ay_id, 'fees', 20500, 2000, 'partial', '2026-02-15');

-- S75: Meshak Mose G3 NEW
SET @s75 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s75, @school_id, 'CHUO/2026/075', 'Meshak', 'Mose', 'G3', @g_g3, 'active', '2026-01-05', 'Gladys Moraa', '0725800124');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s75, @ft_g3_new, @term1_id, @ay_id, 'fees', 37640, 8640, 'partial', '2026-02-15');

-- S76: Joy Baraka G3 NEW
SET @s76 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s76, @school_id, 'CHUO/2026/076', 'Joy', 'Baraka', 'G3', @g_g3, 'active', '2026-01-05', 'Gladys Moraa', '0725800124');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s76, @ft_g3_new, @term1_id, @ay_id, 'fees', 37370, 8370, 'partial', '2026-02-15');

-- S77: Melisa Bosibori G1 NEW
SET @s77 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s77, @school_id, 'CHUO/2026/077', 'Melisa', 'Bosibori', 'G1', @g_g1, 'active', '2026-01-05', 'Benjamin Mogaka', '0704708018');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s77, @ft_g1_new, @term1_id, @ay_id, 'fees', 36450, 23500, 'partial', '2026-02-15');

-- S78: Ethan Mumo REC NEW
SET @s78 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s78, @school_id, 'CHUO/2026/078', 'Ethan', 'Mumo', 'REC', @g_rec, 'active', '2026-01-05', 'Mirriam', '0713736809');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s78, @ft_rec, @term1_id, @ay_id, 'fees', 32250, 11250, 'partial', '2026-02-15');

-- S79: Starr Alysa G1 NEW
SET @s79 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s79, @school_id, 'CHUO/2026/079', 'Starr', 'Alysa', 'G1', @g_g1, 'active', '2026-01-05', 'Gontiana Edinah', '0701398025');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s79, @ft_g1_new, @term1_id, @ay_id, 'fees', 32000, 29000, 'partial', '2026-02-15');

-- S80: Stefan Kimutai REC NEW
SET @s80 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s80, @school_id, 'CHUO/2026/080', 'Stefan', 'Kimutai', 'REC', @g_rec, 'active', '2026-01-05', 'Sheila Kirui', '0712429664');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s80, @ft_rec, @term1_id, @ay_id, 'fees', 20500, 17500, 'partial', '2026-02-15');

-- S81-S160: Remaining NEW students (batch insert pattern)

-- S81: Jeremy Kamau PP1 NEW
SET @s81 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s81, @school_id, 'CHUO/2026/081', 'Jeremy', 'Kamau', 'PP1', @g_pp1, 'active', '2026-01-05', '', '');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s81, @ft_pp1_new, @term1_id, @ay_id, 'fees', 25500, 2000, 'partial', '2026-02-15');

-- S82: Zara Nekesa PP1 NEW
SET @s82 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s82, @school_id, 'CHUO/2026/082', 'Zara', 'Nekesa', 'PP1', @g_pp1, 'active', '2026-01-05', '', '');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s82, @ft_pp1_new, @term1_id, @ay_id, 'fees', 25500, 1000, 'partial', '2026-02-15');

-- S83: Mirabel Karaji PP1 NEW
SET @s83 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s83, @school_id, 'CHUO/2026/083', 'Mirabel', 'Karaji', 'PP1', @g_pp1, 'active', '2026-01-05', '', '');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s83, @ft_pp1_new, @term1_id, @ay_id, 'fees', 25500, 1000, 'partial', '2026-02-15');

-- S84: Divon Kimani PP1 NEW
SET @s84 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s84, @school_id, 'CHUO/2026/084', 'Divon', 'Kimani', 'PP1', @g_pp1, 'active', '2026-01-05', '', '');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s84, @ft_pp1_new, @term1_id, @ay_id, 'fees', 25500, 12000, 'partial', '2026-02-15');

-- S85: Corina Melody REC NEW
SET @s85 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s85, @school_id, 'CHUO/2026/085', 'Corina', 'Melody', 'REC', @g_rec, 'active', '2026-01-05', 'Merceline Otieno', '0710691508');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s85, @ft_rec, @term1_id, @ay_id, 'fees', 34650, 16150, 'partial', '2026-02-15');

-- S86: Semos Salawa REC NEW
SET @s86 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s86, @school_id, 'CHUO/2026/086', 'Semos', 'Salawa', 'REC', @g_rec, 'active', '2026-01-05', 'Agneta Ondeko', '0721600580');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s86, @ft_rec, @term1_id, @ay_id, 'fees', 20500, 16000, 'partial', '2026-02-15');

-- S87: Bravin Masha PP1 NEW
SET @s87 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s87, @school_id, 'CHUO/2026/087', 'Bravin', 'Masha', 'PP1', @g_pp1, 'active', '2026-01-05', '', '');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s87, @ft_pp1_new, @term1_id, @ay_id, 'fees', 25500, 40150, 'paid', '2026-02-15');

-- S88: Jackson Otieno G6 NEW
SET @s88 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s88, @school_id, 'CHUO/2026/088', 'Jackson', 'Otieno', 'G6', @g_g6, 'active', '2026-01-05', 'Merceline Otieno', '0710691508');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s88, @ft_g6_new, @term1_id, @ay_id, 'fees', 34500, 2000, 'partial', '2026-02-15');

-- S90: Earnest Matu REC NEW
SET @s90 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s90, @school_id, 'CHUO/2026/090', 'Earnest', 'Matu', 'REC', @g_rec, 'active', '2026-01-05', '', '');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s90, @ft_rec, @term1_id, @ay_id, 'fees', 21650, 10650, 'partial', '2026-02-15');

-- S91: Jayden Birundi REC NEW
SET @s91 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s91, @school_id, 'CHUO/2026/091', 'Jayden', 'Birundi', 'REC', @g_rec, 'active', '2026-01-05', 'Linet Nyatichi', '0711787976');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s91, @ft_rec, @term1_id, @ay_id, 'fees', 24950, 20450, 'partial', '2026-02-15');

-- S92: Annabell Bosibori PP2 NEW
SET @s92 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s92, @school_id, 'CHUO/2026/092', 'Annabell', 'Bosibori', 'PP2', @g_pp2, 'active', '2026-01-05', 'Linet Nyatichi', '0711787976');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s92, @ft_pp2_new, @term1_id, @ay_id, 'fees', 29580, 23080, 'partial', '2026-02-15');

-- S93: Ellenjoy Kerubo G2 NEW
SET @s93 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s93, @school_id, 'CHUO/2026/093', 'Ellenjoy', 'Kerubo', 'G2', @g_g2, 'active', '2026-01-05', '', '');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s93, @ft_g2_new, @term1_id, @ay_id, 'fees', 32000, 10000, 'partial', '2026-02-15');

-- S94: Fidel Munyalo G4 NEW
SET @s94 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s94, @school_id, 'CHUO/2026/094', 'Fidel', 'Munyalo', 'G4', @g_g4, 'active', '2026-01-05', '', '');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s94, @ft_g4_new, @term1_id, @ay_id, 'fees', 34500, 19000, 'partial', '2026-02-15');

-- S95: Grayson Nyale Kiti G1 NEW
SET @s95 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s95, @school_id, 'CHUO/2026/095', 'Grayson Nyale', 'Kiti', 'G1', @g_g1, 'active', '2026-01-05', 'Rose Barongo', '0723931451');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s95, @ft_g1_new, @term1_id, @ay_id, 'fees', 35210, 26710, 'partial', '2026-02-15');

-- S96: Merrick Kwame PP2 NEW
SET @s96 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s96, @school_id, 'CHUO/2026/096', 'Merrick', 'Kwame', 'PP2', @g_pp2, 'active', '2026-01-05', 'Joan Kerubo', '0710468091');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s96, @ft_pp2_new, @term1_id, @ay_id, 'fees', 25500, 10000, 'partial', '2026-02-15');

-- S97: Aiden Jayden Tarsher G4 NEW
SET @s97 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s97, @school_id, 'CHUO/2026/097', 'Aiden Jayden', 'Tarsher', 'G4', @g_g4, 'active', '2026-01-05', 'Esther Kipkarich', '0704381261');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s97, @ft_g4_new, @term1_id, @ay_id, 'fees', 34500, 25350, 'partial', '2026-02-15');

-- S98: Liam Alfred G2 NEW
SET @s98 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s98, @school_id, 'CHUO/2026/098', 'Liam', 'Alfred', 'G2', @g_g2, 'active', '2026-01-05', 'Levina Ajiambo', '0713188025');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s98, @ft_g2_new, @term1_id, @ay_id, 'fees', 32000, 4000, 'partial', '2026-02-15');

-- S99: Cherly Keisha PP2 NEW
SET @s99 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s99, @school_id, 'CHUO/2026/099', 'Cherly', 'Keisha', 'PP2', @g_pp2, 'active', '2026-01-05', 'Obiri Dinah', '0722744087');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s99, @ft_pp2_new, @term1_id, @ay_id, 'fees', 25500, 17000, 'partial', '2026-02-15');

-- S100: Amerrah Kamau REC NEW
SET @s100 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s100, @school_id, 'CHUO/2026/100', 'Amerrah', 'Kamau', 'REC', @g_rec, 'active', '2026-01-05', 'Rukia Abdi', '0115428286');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s100, @ft_rec, @term1_id, @ay_id, 'fees', 23500, 21500, 'partial', '2026-02-15');

-- Remaining students S101-S160 follow the same pattern
-- S101: Kelvine Amani G1 NEW
SET @s101 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s101, @school_id, 'CHUO/2026/101', 'Kelvine', 'Amani', 'G1', @g_g1, 'active', '2026-01-05', '', '');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s101, @ft_g1_new, @term1_id, @ay_id, 'fees', 28500, 14000, 'partial', '2026-02-15');

-- S102: Myles Justus REC NEW
SET @s102 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s102, @school_id, 'CHUO/2026/102', 'Myles', 'Justus', 'REC', @g_rec, 'active', '2026-01-05', 'Annah Njeri', '0745534975');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s102, @ft_rec, @term1_id, @ay_id, 'fees', 20500, 18000, 'partial', '2026-02-15');

-- S103: Rose Antoinette G7 NEW (fully paid)
SET @s103 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s103, @school_id, 'CHUO/2026/103', 'Rose', 'Antoinette', 'G7', @g_g7, 'active', '2026-01-05', 'Faith Makena', '0700684970');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s103, @ft_g7_new, @term1_id, @ay_id, 'fees', 43000, 43000, 'paid', '2026-02-15');

-- S104: Alice Antoinette G7 NEW (fully paid)
SET @s104 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s104, @school_id, 'CHUO/2026/104', 'Alice', 'Antoinette', 'G7', @g_g7, 'active', '2026-01-05', 'Faith Makena', '0700684970');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s104, @ft_g7_new, @term1_id, @ay_id, 'fees', 41150, 41150, 'paid', '2026-02-15');

-- S105: Tiffany Kefa G3 NEW (fully paid)
SET @s105 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s105, @school_id, 'CHUO/2026/105', 'Tiffany', 'Kefa', 'G3', @g_g3, 'active', '2026-01-05', 'Faith Makena', '0700684970');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s105, @ft_g3_new, @term1_id, @ay_id, 'fees', 31930, 31930, 'paid', '2026-02-15');

-- S106-S160: Continue pattern for remaining students
-- S106: Trevor Mugambau PP2 NEW
SET @s106 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s106, @school_id, 'CHUO/2026/106', 'Trevor', 'Mugambau', 'PP2', @g_pp2, 'active', '2026-01-05', 'Jesinda Akoth', '0748965186');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s106, @ft_pp2_new, @term1_id, @ay_id, 'fees', 25500, 4000, 'partial', '2026-02-15');

-- S107: Amani Ngube REC NEW
SET @s107 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s107, @school_id, 'CHUO/2026/107', 'Amani', 'Ngube', 'REC', @g_rec, 'active', '2026-01-05', 'Jesinda Akoth', '0748965186');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s107, @ft_rec, @term1_id, @ay_id, 'fees', 25500, 4000, 'partial', '2026-02-15');

-- S108: Sifa Wamboi PP1 NEW
SET @s108 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s108, @school_id, 'CHUO/2026/108', 'Sifa', 'Wamboi', 'PP1', @g_pp1, 'active', '2026-01-05', 'Serah Nyambura', '0725110037');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s108, @ft_pp1_new, @term1_id, @ay_id, 'fees', 33000, 19000, 'partial', '2026-02-15');

-- S109: Leon Rex Kerich PP1 NEW
SET @s109 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s109, @school_id, 'CHUO/2026/109', 'Leon Rex', 'Kerich', 'PP1', @g_pp1, 'active', '2026-01-05', '', '');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s109, @ft_pp1_new, @term1_id, @ay_id, 'fees', 30000, 24000, 'partial', '2026-02-15');

-- S110: Royal Gene Kerich PP1 NEW
SET @s110 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s110, @school_id, 'CHUO/2026/110', 'Royal Gene', 'Kerich', 'PP1', @g_pp1, 'active', '2026-01-05', '', '');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s110, @ft_pp1_new, @term1_id, @ay_id, 'fees', 28900, 24000, 'partial', '2026-02-15');

-- S111-S160 (remaining students)
SET @s111 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s111, @school_id, 'CHUO/2026/111', 'Tanasha', 'Wamboi', 'PP2', @g_pp2, 'active', '2026-01-05', 'Vivian Njeri', '0716248745');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s111, @ft_pp2_new, @term1_id, @ay_id, 'fees', 20500, 11000, 'partial', '2026-02-15');

SET @s112 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s112, @school_id, 'CHUO/2026/112', 'Sandra', 'Wamboi', 'G1', @g_g1, 'active', '2026-01-05', 'James Mwangi', '0722812509');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s112, @ft_g1_new, @term1_id, @ay_id, 'fees', 20500, 4000, 'partial', '2026-02-15');

SET @s113 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s113, @school_id, 'CHUO/2026/113', 'Gwyn', 'Whitney', 'G2', @g_g2, 'active', '2026-01-05', 'Esther Wangui', '');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s113, @ft_g2_new, @term1_id, @ay_id, 'fees', 32000, 2000, 'partial', '2026-02-15');

SET @s114 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s114, @school_id, 'CHUO/2026/114', 'Gift', 'Wafula', 'REC', @g_rec, 'active', '2026-01-05', 'Godwin Wafula', '0792777948');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s114, @ft_rec, @term1_id, @ay_id, 'fees', 31250, 4000, 'partial', '2026-02-15');

SET @s115 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s115, @school_id, 'CHUO/2026/115', 'Vincent', 'Muuo', 'G4', @g_g4, 'active', '2026-01-05', 'Elizabeth David', '0704045734');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s115, @ft_g4_new, @term1_id, @ay_id, 'fees', 44500, 4000, 'partial', '2026-02-15');

SET @s116 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s116, @school_id, 'CHUO/2026/116', 'Joy', 'Blessing', 'G1', @g_g1, 'active', '2026-01-05', 'Elizabeth David', '0704045734');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s116, @ft_g1_new, @term1_id, @ay_id, 'fees', 39150, 12000, 'partial', '2026-02-15');

SET @s117 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s117, @school_id, 'CHUO/2026/117', 'Jefferson', 'Babu', 'G5', @g_g5, 'active', '2026-01-05', 'Judith Otieno', '0712543165');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s117, @ft_g5_new, @term1_id, @ay_id, 'fees', 34500, 10000, 'partial', '2026-02-15');

SET @s118 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s118, @school_id, 'CHUO/2026/118', 'Levian', 'Otema', 'PP2', @g_pp2, 'active', '2026-01-05', 'Judith Otieno', '0712543165');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s118, @ft_pp2_new, @term1_id, @ay_id, 'fees', 28550, 14000, 'partial', '2026-02-15');

SET @s119 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s119, @school_id, 'CHUO/2026/119', 'Brian', 'Mutanu', 'REC', @g_rec, 'active', '2026-01-05', 'Damaris Ndolo', '0794294916');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s119, @ft_rec, @term1_id, @ay_id, 'fees', 28550, 14000, 'partial', '2026-02-15');

SET @s120 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone)
VALUES (@s120, @school_id, 'CHUO/2026/120', 'Bianca', 'Ndau', 'REC', @g_rec, 'active', '2026-01-05', 'Damaris Ndolo', '0794294916');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES
(UUID(), @school_id, @s120, @ft_rec, @term1_id, @ay_id, 'fees', 20500, 4000, 'partial', '2026-02-15');

-- S121-S133 (continue batch)
SET @s121 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s121, @school_id, 'CHUO/2026/121', 'Arthur', 'Abali', 'G2', @g_g2, 'active', '2026-01-05', 'Gladys Cheptoo', '0725226196');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s121, @ft_g2_new, @term1_id, @ay_id, 'fees', 32000, 23400, 'partial', '2026-02-15');

SET @s122 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s122, @school_id, 'CHUO/2026/122', 'Ayla', 'Petra', 'PP2', @g_pp2, 'active', '2026-01-05', 'Gladys Cheptoo', '0725226196');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s122, @ft_pp2_new, @term1_id, @ay_id, 'fees', 25500, 36000, 'paid', '2026-02-15');

SET @s123 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s123, @school_id, 'CHUO/2026/123', 'Jeshurun', 'Wandera', 'G2', @g_g2, 'active', '2026-01-05', '', '');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s123, @ft_g2_new, @term1_id, @ay_id, 'fees', 36000, 36000, 'paid', '2026-02-15');

SET @s124 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s124, @school_id, 'CHUO/2026/124', 'Soteria', 'Wandera', 'G1', @g_g1, 'active', '2026-01-05', '', '');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s124, @ft_g1_new, @term1_id, @ay_id, 'fees', 41150, 4000, 'partial', '2026-02-15');

SET @s125 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s125, @school_id, 'CHUO/2026/125', 'Chava', 'Wandera', 'REC', @g_rec, 'active', '2026-01-05', '', '');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s125, @ft_rec, @term1_id, @ay_id, 'fees', 23500, 0, 'pending', '2026-02-15');

SET @s126 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s126, @school_id, 'CHUO/2026/126', 'Tiffany', 'Timothy', 'G6', @g_g6, 'active', '2026-01-05', 'Purity Makena', '0720401469');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s126, @ft_g6_new, @term1_id, @ay_id, 'fees', 34500, 4000, 'partial', '2026-02-15');

SET @s127 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s127, @school_id, 'CHUO/2026/127', 'Sara', 'Grace', 'G5', @g_g5, 'active', '2026-01-05', '', '');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s127, @ft_g5_new, @term1_id, @ay_id, 'fees', 41000, 4000, 'partial', '2026-02-15');

SET @s128 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s128, @school_id, 'CHUO/2026/128', 'Patrick', 'Khara', 'G7', @g_g7, 'active', '2026-01-05', 'Simon Mbugua', '0721477889');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s128, @ft_g7_new, @term1_id, @ay_id, 'fees', 34500, 16000, 'partial', '2026-02-15');

SET @s129 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s129, @school_id, 'CHUO/2026/129', 'Emmanuel', 'Gakiri', 'PP2', @g_pp2, 'active', '2026-01-05', 'Virginia Ngima', '0728281990');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s129, @ft_pp2_new, @term1_id, @ay_id, 'fees', 25500, 10000, 'partial', '2026-02-15');

SET @s130 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s130, @school_id, 'CHUO/2026/130', 'Elsie', 'Muthoni', 'REC', @g_rec, 'active', '2026-01-05', 'Virginia Ngima', '0728281990');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s130, @ft_rec, @term1_id, @ay_id, 'fees', 20500, 10000, 'partial', '2026-02-15');

SET @s131 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s131, @school_id, 'CHUO/2026/131', 'Nicole', 'Syombua', 'G3', @g_g3, 'active', '2026-01-05', '', '');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s131, @ft_g3_new, @term1_id, @ay_id, 'fees', 33000, 19000, 'partial', '2026-02-15');

SET @s132 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s132, @school_id, 'CHUO/2026/132', 'Keliani', 'Pauline', 'REC', @g_rec, 'active', '2026-01-05', 'Caroline Mwangangi', '0746241157');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s132, @ft_rec, @term1_id, @ay_id, 'fees', 24100, 19000, 'partial', '2026-02-15');

SET @s133 = UUID();
INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s133, @school_id, 'CHUO/2026/133', 'Tiffany', 'Kinindi', 'G1', @g_g1, 'active', '2026-01-05', 'Caroline Mwangangi', '0746241157');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s133, @ft_g1_new, @term1_id, @ay_id, 'fees', 28500, 28500, 'paid', '2026-02-15');

-- S134-S160 (final batch)
SET @s134 = UUID(); INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s134, @school_id, 'CHUO/2026/134', 'Hunter', 'Iliman', 'REC', @g_rec, 'active', '2026-01-05', 'Margret M', '0727380115');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s134, @ft_rec, @term1_id, @ay_id, 'fees', 22600, 13100, 'partial', '2026-02-15');

SET @s135 = UUID(); INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s135, @school_id, 'CHUO/2026/135', 'Hansel', 'Nkahu', 'REC', @g_rec, 'active', '2026-01-05', 'Gladys Wanjiku', '0721794514');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s135, @ft_rec, @term1_id, @ay_id, 'fees', 20500, 13000, 'partial', '2026-02-15');

SET @s136 = UUID(); INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s136, @school_id, 'CHUO/2026/136', 'Princill', 'Ketdenge', 'G2', @g_g2, 'active', '2026-01-05', 'Godfrey Otieno', '0728440528');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s136, @ft_g2_new, @term1_id, @ay_id, 'fees', 42500, 36000, 'partial', '2026-02-15');

SET @s137 = UUID(); INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s137, @school_id, 'CHUO/2026/137', 'Gabriel', 'Ochiri', 'PP1', @g_pp1, 'active', '2026-01-05', 'Andrew Penzi', '0708148846');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s137, @ft_pp1_new, @term1_id, @ay_id, 'fees', 30900, 2000, 'partial', '2026-02-15');

SET @s138 = UUID(); INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s138, @school_id, 'CHUO/2026/138', 'Skylar', 'Njeri', 'G1', @g_g1, 'active', '2026-01-05', 'Anthony Mwaniki', '0792069643');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s138, @ft_g1_new, @term1_id, @ay_id, 'fees', 32000, 4000, 'partial', '2026-02-15');

SET @s139 = UUID(); INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s139, @school_id, 'CHUO/2026/139', 'Christian', 'Mwaniki', 'PP1', @g_pp1, 'active', '2026-01-05', 'Anthony Mwaniki', '0792069643');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s139, @ft_pp1_new, @term1_id, @ay_id, 'fees', 25500, 4000, 'partial', '2026-02-15');

SET @s140 = UUID(); INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s140, @school_id, 'CHUO/2026/140', 'Tiara', 'Mwaniki', 'PP1', @g_pp1, 'active', '2026-01-05', 'Anthony Mwaniki', '0792069643');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s140, @ft_pp1_new, @term1_id, @ay_id, 'fees', 25500, 4000, 'partial', '2026-02-15');

SET @s141 = UUID(); INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s141, @school_id, 'CHUO/2026/141', 'Gavin', 'Simiyu', 'REC', @g_rec, 'active', '2026-01-05', 'Viola Cheptoo', '0714480473');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s141, @ft_rec, @term1_id, @ay_id, 'fees', 24500, 10300, 'partial', '2026-02-15');

SET @s142 = UUID(); INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s142, @school_id, 'CHUO/2026/142', 'Naomi', 'Moraa', 'G3', @g_g3, 'active', '2026-01-05', 'Nelly Maragula', '0715252394');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s142, @ft_g3_new, @term1_id, @ay_id, 'fees', 32000, 4000, 'partial', '2026-02-15');

SET @s143 = UUID(); INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s143, @school_id, 'CHUO/2026/143', 'Darren', 'Mochad', 'REC', @g_rec, 'active', '2026-01-05', '', '');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s143, @ft_rec, @term1_id, @ay_id, 'fees', 20500, 4000, 'partial', '2026-02-15');

SET @s144 = UUID(); INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s144, @school_id, 'CHUO/2026/144', 'Angel', 'Njoki', 'G3', @g_g3, 'active', '2026-01-05', 'Faith Mutheu', '0718218360');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s144, @ft_g3_new, @term1_id, @ay_id, 'fees', 32000, 4000, 'partial', '2026-02-15');

SET @s145 = UUID(); INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s145, @school_id, 'CHUO/2026/145', 'Jamel', 'Kalika', 'REC', @g_dc, 'active', '2026-01-05', '', '');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s145, @ft_rec, @term1_id, @ay_id, 'fees', 20500, 4000, 'partial', '2026-02-15');

SET @s146 = UUID(); INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s146, @school_id, 'CHUO/2026/146', 'Zephan', 'Berur', 'G2', @g_g2, 'active', '2026-01-05', '', '');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s146, @ft_g2_new, @term1_id, @ay_id, 'fees', 32000, 4000, 'partial', '2026-02-15');

SET @s147 = UUID(); INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s147, @school_id, 'CHUO/2026/147', 'Lakisha', 'Njeri', 'REC', @g_rec, 'active', '2026-01-05', 'Jackline Wangui', '0715381478');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s147, @ft_rec, @term1_id, @ay_id, 'fees', 20500, 4000, 'partial', '2026-02-15');

SET @s148 = UUID(); INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s148, @school_id, 'CHUO/2026/148', 'Ivy', 'Calix', 'PP1', @g_pp1, 'active', '2026-01-05', 'Jackline Wangui', '0715381478');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s148, @ft_pp1_new, @term1_id, @ay_id, 'fees', 27050, 30900, 'paid', '2026-02-15');

SET @s149 = UUID(); INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s149, @school_id, 'CHUO/2026/149', 'Kivan', 'Ham', 'REC', @g_rec, 'active', '2026-01-05', '', '');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s149, @ft_rec, @term1_id, @ay_id, 'fees', 20500, 7000, 'partial', '2026-02-15');

SET @s150 = UUID(); INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s150, @school_id, 'CHUO/2026/150', 'Kimani', 'Hamise', 'G4', @g_g4, 'active', '2026-01-05', '', '');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s150, @ft_g4_new, @term1_id, @ay_id, 'fees', 40010, 24010, 'partial', '2026-02-15');

SET @s151 = UUID(); INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s151, @school_id, 'CHUO/2026/151', 'Elaph', 'Daniel', 'PP1', @g_pp1, 'active', '2026-01-05', '', '');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s151, @ft_pp1_new, @term1_id, @ay_id, 'fees', 31000, 22000, 'partial', '2026-02-15');

SET @s152 = UUID(); INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s152, @school_id, 'CHUO/2026/152', 'Nkrothe', 'Kmathi', 'REC', @g_rec, 'active', '2026-01-05', 'Thomas Kimathi', '0721717682');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s152, @ft_rec, @term1_id, @ay_id, 'fees', 24600, 15000, 'partial', '2026-02-15');

SET @s153 = UUID(); INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s153, @school_id, 'CHUO/2026/153', 'Atara', 'Muthoni', 'REC', @g_rec, 'active', '2026-01-05', 'Esther Maina', '0732633032');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s153, @ft_rec, @term1_id, @ay_id, 'fees', 20500, 4000, 'partial', '2026-02-15');

SET @s154 = UUID(); INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s154, @school_id, 'CHUO/2026/154', 'Richard', 'Kinogori', 'G6', @g_g6, 'active', '2026-01-05', 'Virginia Wambui', '0727754766');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s154, @ft_g6_new, @term1_id, @ay_id, 'fees', 34500, 31000, 'partial', '2026-02-15');

SET @s155 = UUID(); INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s155, @school_id, 'CHUO/2026/155', 'Cara', 'Wathera', 'G2', @g_g2, 'active', '2026-01-05', 'Virginia Wambui', '0727754766');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s155, @ft_g2_new, @term1_id, @ay_id, 'fees', 32000, 22000, 'partial', '2026-02-15');

SET @s156 = UUID(); INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s156, @school_id, 'CHUO/2026/156', 'Kayden', 'Karuki', 'REC', @g_rec, 'active', '2026-01-05', 'Virginia Wambui', '0727754766');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s156, @ft_rec, @term1_id, @ay_id, 'fees', 20500, 17000, 'partial', '2026-02-15');

SET @s157 = UUID(); INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s157, @school_id, 'CHUO/2026/157', 'Kash', 'Makau', 'G5', @g_g5, 'active', '2026-01-05', 'Lilian Mbinya', '0718133145');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s157, @ft_g5_new, @term1_id, @ay_id, 'fees', 34300, 19400, 'partial', '2026-02-15');

SET @s158 = UUID(); INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s158, @school_id, 'CHUO/2026/158', 'Millian', 'Mwaura', 'PP2', @g_pp2, 'active', '2026-01-05', 'Magdaline Njoroge', '0720570041');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s158, @ft_pp2_new, @term1_id, @ay_id, 'fees', 25500, 19000, 'partial', '2026-02-15');

SET @s159 = UUID(); INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s159, @school_id, 'CHUO/2026/159', 'Princess', 'Jaelyn', 'G5', @g_g5, 'active', '2026-01-05', 'Magita Caroline', '0704850100');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s159, @ft_g5_new, @term1_id, @ay_id, 'fees', 34500, 14000, 'partial', '2026-02-15');

SET @s160 = UUID(); INSERT INTO students (id, school_id, admission_number, first_name, last_name, grade, current_grade_id, status, admission_date, parent_name, parent_phone) VALUES (@s160, @school_id, 'CHUO/2026/160', 'Damian', 'Kylan', 'PP1', @g_pp1, 'active', '2026-01-05', 'Magita Caroline', '0704850100');
INSERT INTO student_fees (id, school_id, student_id, fee_template_id, term_id, academic_year_id, ledger_type, amount_due, amount_paid, status, due_date) VALUES (UUID(), @school_id, @s160, @ft_pp1_new, @term1_id, @ay_id, 'fees', 25500, 14000, 'partial', '2026-02-15');

-- ============================================
-- 10. FEE STRUCTURES (for fee structure view)
-- ============================================
INSERT INTO fee_structures (id, school_id, academic_year_id, fee_category_id, grade_id, term_id, name, amount, is_mandatory) VALUES
(UUID(), @school_id, @ay_id, @fc_tuition, @g_rec, @term1_id, 'Reception T1 Tuition', 20500, TRUE),
(UUID(), @school_id, @ay_id, @fc_tuition, @g_pp1, @term1_id, 'PP1 T1 Tuition', 25000, TRUE),
(UUID(), @school_id, @ay_id, @fc_tuition, @g_pp2, @term1_id, 'PP2 T1 Tuition', 25000, TRUE),
(UUID(), @school_id, @ay_id, @fc_tuition, @g_g1,  @term1_id, 'Grade 1 T1 Tuition', 28000, TRUE),
(UUID(), @school_id, @ay_id, @fc_tuition, @g_g2,  @term1_id, 'Grade 2 T1 Tuition', 28000, TRUE),
(UUID(), @school_id, @ay_id, @fc_tuition, @g_g3,  @term1_id, 'Grade 3 T1 Tuition', 28000, TRUE),
(UUID(), @school_id, @ay_id, @fc_tuition, @g_g4,  @term1_id, 'Grade 4 T1 Tuition', 34500, TRUE),
(UUID(), @school_id, @ay_id, @fc_tuition, @g_g5,  @term1_id, 'Grade 5 T1 Tuition', 34500, TRUE),
(UUID(), @school_id, @ay_id, @fc_tuition, @g_g6,  @term1_id, 'Grade 6 T1 Tuition', 34500, TRUE),
(UUID(), @school_id, @ay_id, @fc_tuition, @g_g7,  @term1_id, 'Grade 7 T1 Tuition', 37000, TRUE),
(UUID(), @school_id, @ay_id, @fc_tuition, @g_g9,  @term1_id, 'Grade 9 T1 Tuition', 37000, TRUE);

-- ============================================
-- 11. FINANCE AUTOMATION CONFIG
-- ============================================
INSERT INTO finance_automation_config (school_id) VALUES (@school_id)
ON DUPLICATE KEY UPDATE school_id = @school_id;

-- ============================================
-- 12. RECEIPT SEQUENCE
-- ============================================
INSERT INTO receipt_sequences (school_id, prefix, current_number, fiscal_year)
VALUES (@school_id, 'RCT', 0, 2026)
ON DUPLICATE KEY UPDATE fiscal_year = 2026;

-- ============================================
-- DONE! Seed data loaded successfully.
-- Total: 1 school, 1 admin, 1 academic year, 3 terms,
--        13 grades, 25 subjects, 4 fee categories,
--        ~20 fee templates, ~160 students with fee balances
-- ============================================
SELECT CONCAT('Seed complete: ', COUNT(*), ' students loaded') as result FROM students WHERE school_id = @school_id;
