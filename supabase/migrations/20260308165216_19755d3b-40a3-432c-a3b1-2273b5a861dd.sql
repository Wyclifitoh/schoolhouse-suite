
-- Expense Categories table
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  budget numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expense_categories_select" ON public.expense_categories FOR SELECT TO authenticated
  USING (school_id = ANY(get_accessible_schools(auth.uid())));
CREATE POLICY "expense_categories_insert" ON public.expense_categories FOR INSERT TO authenticated
  WITH CHECK (has_permission(auth.uid(), school_id, 'finance:payments:create'));
CREATE POLICY "expense_categories_update" ON public.expense_categories FOR UPDATE TO authenticated
  USING (has_permission(auth.uid(), school_id, 'finance:payments:create'));
CREATE POLICY "expense_categories_delete" ON public.expense_categories FOR DELETE TO authenticated
  USING (has_permission(auth.uid(), school_id, 'finance:payments:create'));

-- Expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.expense_categories(id),
  title text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text NOT NULL DEFAULT 'cash',
  reference text,
  description text,
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid REFERENCES public.profiles(id),
  recorded_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses_select" ON public.expenses FOR SELECT TO authenticated
  USING (school_id = ANY(get_accessible_schools(auth.uid())));
CREATE POLICY "expenses_insert" ON public.expenses FOR INSERT TO authenticated
  WITH CHECK (has_permission(auth.uid(), school_id, 'finance:payments:create'));
CREATE POLICY "expenses_update" ON public.expenses FOR UPDATE TO authenticated
  USING (has_permission(auth.uid(), school_id, 'finance:payments:create'));
CREATE POLICY "expenses_delete" ON public.expenses FOR DELETE TO authenticated
  USING (has_permission(auth.uid(), school_id, 'finance:payments:create'));

-- Homework table
CREATE TABLE IF NOT EXISTS public.homework (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  subject text NOT NULL,
  class_name text NOT NULL,
  section text,
  assigned_by uuid REFERENCES public.profiles(id),
  assigned_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  max_marks numeric DEFAULT 100,
  attachment_url text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;

CREATE POLICY "homework_select" ON public.homework FOR SELECT TO authenticated
  USING (school_id = ANY(get_accessible_schools(auth.uid())));
CREATE POLICY "homework_insert" ON public.homework FOR INSERT TO authenticated
  WITH CHECK (school_id = ANY(get_accessible_schools(auth.uid())));
CREATE POLICY "homework_update" ON public.homework FOR UPDATE TO authenticated
  USING (school_id = ANY(get_accessible_schools(auth.uid())));
CREATE POLICY "homework_delete" ON public.homework FOR DELETE TO authenticated
  USING (has_permission(auth.uid(), school_id, 'settings:school:manage'));

-- Homework Submissions table
CREATE TABLE IF NOT EXISTS public.homework_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homework_id uuid NOT NULL REFERENCES public.homework(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  submission_date timestamptz DEFAULT now(),
  content text,
  attachment_url text,
  marks numeric,
  remarks text,
  status text NOT NULL DEFAULT 'pending',
  evaluated_by uuid REFERENCES public.profiles(id),
  evaluated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "homework_submissions_select" ON public.homework_submissions FOR SELECT TO authenticated
  USING (school_id = ANY(get_accessible_schools(auth.uid())));
CREATE POLICY "homework_submissions_insert" ON public.homework_submissions FOR INSERT TO authenticated
  WITH CHECK (school_id = ANY(get_accessible_schools(auth.uid())));
CREATE POLICY "homework_submissions_update" ON public.homework_submissions FOR UPDATE TO authenticated
  USING (school_id = ANY(get_accessible_schools(auth.uid())));
