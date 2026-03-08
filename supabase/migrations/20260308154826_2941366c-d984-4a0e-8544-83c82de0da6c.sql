
-- Departments table
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  head_staff_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(school_id, name)
);

-- Designations table
CREATE TABLE public.designations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(school_id, name)
);

-- Staff table
CREATE TABLE public.staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  staff_id_number text NOT NULL,
  first_name text NOT NULL,
  last_name text,
  father_name text,
  mother_name text,
  email text,
  gender text,
  date_of_birth date,
  date_of_joining date,
  phone text,
  emergency_contact text,
  marital_status text DEFAULT 'not_specified',
  photo_url text,
  address text,
  permanent_address text,
  qualification text,
  work_experience text,
  note text,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  designation_id uuid REFERENCES public.designations(id) ON DELETE SET NULL,
  role text DEFAULT 'teacher',
  epf_no text,
  basic_salary numeric DEFAULT 0,
  contract_type text DEFAULT 'permanent',
  work_shift text,
  work_location text,
  medical_leave_quota integer DEFAULT 12,
  paternity_leave_quota integer DEFAULT 14,
  maternity_leave_quota integer DEFAULT 90,
  other_leave_quota integer DEFAULT 10,
  account_title text,
  bank_account_number text,
  bank_name text,
  ifsc_code text,
  bank_branch_name text,
  facebook_url text,
  twitter_url text,
  linkedin_url text,
  instagram_url text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(school_id, staff_id_number)
);

-- Staff documents table
CREATE TABLE public.staff_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title text NOT NULL,
  document_type text NOT NULL DEFAULT 'other',
  file_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Staff attendance table
CREATE TABLE public.staff_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL DEFAULT 'present',
  check_in_time time,
  check_out_time time,
  notes text,
  recorded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(staff_id, date)
);

-- Leave types table
CREATE TABLE public.leave_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  max_days integer DEFAULT 0,
  is_paid boolean DEFAULT true,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(school_id, name)
);

-- Leave applications table
CREATE TABLE public.leave_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  leave_type_id uuid NOT NULL REFERENCES public.leave_types(id) ON DELETE RESTRICT,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_days integer NOT NULL DEFAULT 1,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid,
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Payroll table
CREATE TABLE public.payroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  month integer NOT NULL,
  year integer NOT NULL,
  basic_salary numeric NOT NULL DEFAULT 0,
  allowances numeric DEFAULT 0,
  deductions numeric DEFAULT 0,
  tax numeric DEFAULT 0,
  net_salary numeric NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'pending',
  payment_date date,
  payment_method text,
  payment_reference text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(school_id, staff_id, month, year)
);

-- Add foreign key for department head
ALTER TABLE public.departments ADD CONSTRAINT departments_head_staff_id_fkey FOREIGN KEY (head_staff_id) REFERENCES public.staff(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

-- RLS policies: Read access for authenticated users in accessible schools
CREATE POLICY "departments_select" ON public.departments FOR SELECT TO authenticated USING (school_id = ANY(get_accessible_schools(auth.uid())));
CREATE POLICY "departments_insert" ON public.departments FOR INSERT TO authenticated WITH CHECK (has_permission(auth.uid(), school_id, 'settings:school:manage'));
CREATE POLICY "departments_update" ON public.departments FOR UPDATE TO authenticated USING (has_permission(auth.uid(), school_id, 'settings:school:manage'));

CREATE POLICY "designations_select" ON public.designations FOR SELECT TO authenticated USING (school_id = ANY(get_accessible_schools(auth.uid())));
CREATE POLICY "designations_insert" ON public.designations FOR INSERT TO authenticated WITH CHECK (has_permission(auth.uid(), school_id, 'settings:school:manage'));
CREATE POLICY "designations_update" ON public.designations FOR UPDATE TO authenticated USING (has_permission(auth.uid(), school_id, 'settings:school:manage'));

CREATE POLICY "staff_select" ON public.staff FOR SELECT TO authenticated USING (school_id = ANY(get_accessible_schools(auth.uid())));
CREATE POLICY "staff_insert" ON public.staff FOR INSERT TO authenticated WITH CHECK (has_permission(auth.uid(), school_id, 'users:manage'));
CREATE POLICY "staff_update" ON public.staff FOR UPDATE TO authenticated USING (has_permission(auth.uid(), school_id, 'users:manage'));

CREATE POLICY "staff_docs_select" ON public.staff_documents FOR SELECT TO authenticated USING (school_id = ANY(get_accessible_schools(auth.uid())));
CREATE POLICY "staff_docs_insert" ON public.staff_documents FOR INSERT TO authenticated WITH CHECK (has_permission(auth.uid(), school_id, 'users:manage'));

CREATE POLICY "staff_attendance_select" ON public.staff_attendance FOR SELECT TO authenticated USING (school_id = ANY(get_accessible_schools(auth.uid())));
CREATE POLICY "staff_attendance_insert" ON public.staff_attendance FOR INSERT TO authenticated WITH CHECK (has_permission(auth.uid(), school_id, 'users:manage'));
CREATE POLICY "staff_attendance_update" ON public.staff_attendance FOR UPDATE TO authenticated USING (has_permission(auth.uid(), school_id, 'users:manage'));

CREATE POLICY "leave_types_select" ON public.leave_types FOR SELECT TO authenticated USING (school_id = ANY(get_accessible_schools(auth.uid())));
CREATE POLICY "leave_types_insert" ON public.leave_types FOR INSERT TO authenticated WITH CHECK (has_permission(auth.uid(), school_id, 'settings:school:manage'));
CREATE POLICY "leave_types_update" ON public.leave_types FOR UPDATE TO authenticated USING (has_permission(auth.uid(), school_id, 'settings:school:manage'));

CREATE POLICY "leave_applications_select" ON public.leave_applications FOR SELECT TO authenticated USING (school_id = ANY(get_accessible_schools(auth.uid())));
CREATE POLICY "leave_applications_insert" ON public.leave_applications FOR INSERT TO authenticated WITH CHECK (school_id = ANY(get_accessible_schools(auth.uid())));
CREATE POLICY "leave_applications_update" ON public.leave_applications FOR UPDATE TO authenticated USING (has_permission(auth.uid(), school_id, 'users:manage'));

CREATE POLICY "payroll_select" ON public.payroll FOR SELECT TO authenticated USING (school_id = ANY(get_accessible_schools(auth.uid())));
CREATE POLICY "payroll_insert" ON public.payroll FOR INSERT TO authenticated WITH CHECK (has_permission(auth.uid(), school_id, 'finance:payments:create'));
CREATE POLICY "payroll_update" ON public.payroll FOR UPDATE TO authenticated USING (has_permission(auth.uid(), school_id, 'finance:payments:create'));

-- Storage bucket for staff documents
INSERT INTO storage.buckets (id, name, public) VALUES ('staff-documents', 'staff-documents', false);

CREATE POLICY "Staff docs read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'staff-documents');
CREATE POLICY "Staff docs insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'staff-documents');

-- Seed default leave types for existing schools
INSERT INTO public.leave_types (school_id, name, code, max_days, is_paid)
SELECT s.id, lt.name, lt.code, lt.max_days, lt.is_paid
FROM public.schools s
CROSS JOIN (VALUES
  ('Medical Leave', 'medical', 12, true),
  ('Paternity Leave', 'paternity', 14, true),
  ('Maternity Leave', 'maternity', 90, true),
  ('Other Leave', 'other', 10, true)
) AS lt(name, code, max_days, is_paid)
ON CONFLICT DO NOTHING;

-- Seed default departments for existing schools
INSERT INTO public.departments (school_id, name)
SELECT s.id, d.name
FROM public.schools s
CROSS JOIN (VALUES
  ('ICT Department'),
  ('Early Childhood Education (ECE)'),
  ('Lower Primary'),
  ('Upper Primary'),
  ('Junior Secondary'),
  ('Languages Department'),
  ('Mathematics Department'),
  ('Science Department'),
  ('Social Studies Department'),
  ('Creative Arts Department'),
  ('Physical Education Department'),
  ('Administration'),
  ('Admissions and Enrollment'),
  ('Finance'),
  ('Human Resources'),
  ('Facilities Management'),
  ('Library'),
  ('Counseling and Guidance'),
  ('Health Services'),
  ('Special Education'),
  ('Clubs and Societies'),
  ('Sports Teams')
) AS d(name)
ON CONFLICT DO NOTHING;

-- Seed default designations for existing schools
INSERT INTO public.designations (school_id, name)
SELECT s.id, dg.name
FROM public.schools s
CROSS JOIN (VALUES
  ('School Leadership'),
  ('Administration'),
  ('Admissions and Enrollment'),
  ('Finance'),
  ('Human Resources'),
  ('Facilities Management'),
  ('Languages'),
  ('Mathematics'),
  ('Science'),
  ('ICT'),
  ('Creative Arts'),
  ('Library'),
  ('Parent Liaison Officer'),
  ('Teacher'),
  ('Senior Teacher'),
  ('Head of Department'),
  ('Deputy Principal'),
  ('Principal')
) AS dg(name)
ON CONFLICT DO NOTHING;

-- Enable realtime for leave_applications
ALTER PUBLICATION supabase_realtime ADD TABLE public.leave_applications;
