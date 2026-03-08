
-- =============================================
-- MIGRATION 2: Academic Structure & Parents
-- =============================================

-- 1. Education level enum
CREATE TYPE public.education_level AS ENUM (
    'pre_primary',
    'lower_primary',
    'upper_primary',
    'junior_secondary',
    'senior_secondary',
    'primary_844',
    'secondary_844'
);

-- 2. Relationship type enum
CREATE TYPE public.relationship_type AS ENUM (
    'father', 'mother', 'guardian', 'sponsor', 'grandparent', 'sibling', 'other'
);

-- 3. Student status enum
CREATE TYPE public.student_status AS ENUM (
    'applicant', 'admitted', 'active', 'suspended', 'transferred', 'graduated', 'alumni'
);

-- 4. Grades table
CREATE TABLE public.grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    level public.education_level NOT NULL,
    curriculum_type VARCHAR(10) NOT NULL DEFAULT 'CBC',
    order_index SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, name)
);

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "grades_select" ON public.grades FOR SELECT TO authenticated
    USING (school_id = ANY(public.get_accessible_schools(auth.uid())));
CREATE POLICY "grades_insert" ON public.grades FOR INSERT TO authenticated
    WITH CHECK (public.has_permission(auth.uid(), school_id, 'settings:school:manage'));
CREATE POLICY "grades_update" ON public.grades FOR UPDATE TO authenticated
    USING (public.has_permission(auth.uid(), school_id, 'settings:school:manage'));
CREATE POLICY "grades_delete" ON public.grades FOR DELETE TO authenticated
    USING (public.has_role_in_school(auth.uid(), school_id, 'school_admin') OR public.has_role(auth.uid(), 'super_admin'));

-- 5. Streams table
CREATE TABLE public.streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    grade_id UUID NOT NULL REFERENCES public.grades(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    capacity SMALLINT DEFAULT 40,
    class_teacher_id UUID REFERENCES public.profiles(id),
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(grade_id, name, academic_year_id)
);

ALTER TABLE public.streams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "streams_select" ON public.streams FOR SELECT TO authenticated
    USING (school_id = ANY(public.get_accessible_schools(auth.uid())));
CREATE POLICY "streams_insert" ON public.streams FOR INSERT TO authenticated
    WITH CHECK (public.has_permission(auth.uid(), school_id, 'settings:school:manage'));
CREATE POLICY "streams_update" ON public.streams FOR UPDATE TO authenticated
    USING (public.has_permission(auth.uid(), school_id, 'settings:school:manage'));

-- 6. Update students table with missing columns
ALTER TABLE public.students
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS upi VARCHAR(50),
    ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS photo_url TEXT,
    ADD COLUMN IF NOT EXISTS current_grade_id UUID REFERENCES public.grades(id),
    ADD COLUMN IF NOT EXISTS current_stream_id UUID REFERENCES public.streams(id),
    ADD COLUMN IF NOT EXISTS cbc_pathway VARCHAR(50),
    ADD COLUMN IF NOT EXISTS admission_date DATE,
    ADD COLUMN IF NOT EXISTS graduation_date DATE,
    ADD COLUMN IF NOT EXISTS nationality VARCHAR(50) DEFAULT 'Kenyan',
    ADD COLUMN IF NOT EXISTS religion VARCHAR(50),
    ADD COLUMN IF NOT EXISTS medical_info JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS special_needs TEXT,
    ADD COLUMN IF NOT EXISTS previous_school TEXT;

CREATE INDEX IF NOT EXISTS idx_students_school ON public.students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_grade ON public.students(current_grade_id);
CREATE INDEX IF NOT EXISTS idx_students_stream ON public.students(current_stream_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON public.students(school_id, status);

-- 7. Parents table
CREATE TABLE public.parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    alt_phone VARCHAR(20),
    id_number VARCHAR(20),
    occupation VARCHAR(100),
    employer VARCHAR(100),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_parents_phone ON public.parents(phone);

CREATE POLICY "parents_select" ON public.parents FOR SELECT TO authenticated
    USING (school_id = ANY(public.get_accessible_schools(auth.uid())));
CREATE POLICY "parents_insert" ON public.parents FOR INSERT TO authenticated
    WITH CHECK (public.has_permission(auth.uid(), school_id, 'students:create'));
CREATE POLICY "parents_update" ON public.parents FOR UPDATE TO authenticated
    USING (public.has_permission(auth.uid(), school_id, 'students:update') OR user_id = auth.uid());

-- 8. Student-parent relationship table
CREATE TABLE public.student_parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
    relationship public.relationship_type NOT NULL,
    is_primary_contact BOOLEAN DEFAULT false,
    is_fee_payer BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, parent_id)
);

ALTER TABLE public.student_parents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "student_parents_select" ON public.student_parents FOR SELECT TO authenticated USING (true);
CREATE POLICY "student_parents_insert" ON public.student_parents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "student_parents_update" ON public.student_parents FOR UPDATE TO authenticated USING (true);

-- 9. Student enrollments (historical record)
CREATE TABLE public.student_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id),
    grade_id UUID NOT NULL REFERENCES public.grades(id),
    stream_id UUID REFERENCES public.streams(id),
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    promoted_from_id UUID REFERENCES public.student_enrollments(id),
    promotion_status VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, academic_year_id)
);

ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enrollments_select" ON public.student_enrollments FOR SELECT TO authenticated
    USING (school_id = ANY(public.get_accessible_schools(auth.uid())));
CREATE POLICY "enrollments_insert" ON public.student_enrollments FOR INSERT TO authenticated
    WITH CHECK (public.has_permission(auth.uid(), school_id, 'students:create'));
CREATE POLICY "enrollments_update" ON public.student_enrollments FOR UPDATE TO authenticated
    USING (public.has_permission(auth.uid(), school_id, 'students:update'));

-- 10. Add term_number and status to terms if missing
ALTER TABLE public.terms
    ADD COLUMN IF NOT EXISTS term_number SMALLINT,
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'upcoming';

-- 11. Add unique constraint for academic_years
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'academic_years_school_name_unique') THEN
        ALTER TABLE public.academic_years ADD CONSTRAINT academic_years_school_name_unique UNIQUE(school_id, name);
    END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
