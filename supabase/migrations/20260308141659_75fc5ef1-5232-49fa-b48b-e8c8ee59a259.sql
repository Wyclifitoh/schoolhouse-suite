
-- =============================================
-- MIGRATION 1: Core Identity & RBAC
-- =============================================

-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM (
    'super_admin',
    'school_admin',
    'deputy_admin',
    'teacher',
    'finance_officer',
    'front_office',
    'transport_officer',
    'store_manager',
    'pos_attendant',
    'student',
    'parent',
    'auditor'
);

-- 2. Create permission_category enum
CREATE TYPE public.permission_category AS ENUM (
    'students',
    'academics',
    'finance',
    'transport',
    'inventory',
    'pos',
    'reports',
    'settings',
    'users'
);

-- 3. Update schools table with missing columns
ALTER TABLE public.schools
    ADD COLUMN IF NOT EXISTS code VARCHAR(50) UNIQUE,
    ADD COLUMN IF NOT EXISTS county VARCHAR(100),
    ADD COLUMN IF NOT EXISTS sub_county VARCHAR(100),
    ADD COLUMN IF NOT EXISTS curriculum_type VARCHAR(20) DEFAULT 'CBC',
    ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- 4. Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL DEFAULT '',
    last_name VARCHAR(100) NOT NULL DEFAULT '',
    email VARCHAR(255) NOT NULL DEFAULT '',
    phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ,
    mfa_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Create user_roles table (proper RBAC structure)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, school_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_school ON public.user_roles(school_id);

-- 6. Create permissions table
CREATE TABLE public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    category public.permission_category NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- 7. Create role_permissions table (default permissions per role)
CREATE TABLE public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role public.app_role NOT NULL,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role, permission_id)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- 8. Create school_role_permissions table (school-specific overrides)
CREATE TABLE public.school_role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    is_granted BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, role, permission_id)
);

ALTER TABLE public.school_role_permissions ENABLE ROW LEVEL SECURITY;

-- 9. Profile auto-creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 10. Security definer functions for RBAC

-- Check if user has a specific role (any school)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
          AND is_active = true
          AND (expires_at IS NULL OR expires_at > NOW())
    )
$$;

-- Check if user has a role in a specific school
CREATE OR REPLACE FUNCTION public.has_role_in_school(_user_id UUID, _school_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id
          AND (school_id = _school_id OR school_id IS NULL)
          AND role = _role
          AND is_active = true
          AND (expires_at IS NULL OR expires_at > NOW())
    )
$$;

-- Get all active roles for a user in a school
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID, _school_id UUID)
RETURNS public.app_role[]
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT ARRAY_AGG(role)
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (school_id = _school_id OR school_id IS NULL)
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
$$;

-- Check if user has a specific permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _school_id UUID, _permission_code VARCHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    _roles public.app_role[];
    _has_permission BOOLEAN := false;
    _role public.app_role;
BEGIN
    _roles := public.get_user_roles(_user_id, _school_id);
    
    IF _roles IS NULL OR array_length(_roles, 1) IS NULL THEN
        RETURN false;
    END IF;
    
    IF 'super_admin' = ANY(_roles) THEN RETURN true; END IF;
    IF 'school_admin' = ANY(_roles) THEN RETURN true; END IF;
    
    FOREACH _role IN ARRAY _roles LOOP
        SELECT EXISTS (
            SELECT 1 FROM role_permissions rp
            JOIN permissions p ON p.id = rp.permission_id
            WHERE rp.role = _role AND p.code = _permission_code
        ) INTO _has_permission;
        
        IF _has_permission THEN
            SELECT NOT EXISTS (
                SELECT 1 FROM school_role_permissions srp
                JOIN permissions p ON p.id = srp.permission_id
                WHERE srp.school_id = _school_id
                  AND srp.role = _role
                  AND p.code = _permission_code
                  AND srp.is_granted = false
            ) INTO _has_permission;
            
            IF _has_permission THEN RETURN true; END IF;
        ELSE
            SELECT EXISTS (
                SELECT 1 FROM school_role_permissions srp
                JOIN permissions p ON p.id = srp.permission_id
                WHERE srp.school_id = _school_id
                  AND srp.role = _role
                  AND p.code = _permission_code
                  AND srp.is_granted = true
            ) INTO _has_permission;
            
            IF _has_permission THEN RETURN true; END IF;
        END IF;
    END LOOP;
    
    RETURN false;
END;
$$;

-- Get user's accessible school IDs
CREATE OR REPLACE FUNCTION public.get_accessible_schools(_user_id UUID)
RETURNS UUID[]
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT CASE 
        WHEN EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = _user_id 
              AND role = 'super_admin' 
              AND is_active = true
        ) THEN (SELECT ARRAY_AGG(id) FROM schools)
        ELSE (
            SELECT ARRAY_AGG(DISTINCT school_id) 
            FROM user_roles 
            WHERE user_id = _user_id 
              AND school_id IS NOT NULL
              AND is_active = true
        )
    END
$$;

-- 11. RLS policies for profiles
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT TO authenticated
    USING (id = auth.uid() OR school_id = ANY(public.get_accessible_schools(auth.uid())));

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "System can insert profiles" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- 12. RLS policies for user_roles
CREATE POLICY "Users can see roles in their schools" ON public.user_roles
    FOR SELECT TO authenticated
    USING (
        school_id = ANY(public.get_accessible_schools(auth.uid()))
        OR user_id = auth.uid()
    );

CREATE POLICY "Admins can grant roles" ON public.user_roles
    FOR INSERT TO authenticated
    WITH CHECK (
        public.has_permission(auth.uid(), school_id, 'users:roles:assign')
    );

CREATE POLICY "Admins can update roles" ON public.user_roles
    FOR UPDATE TO authenticated
    USING (public.has_permission(auth.uid(), school_id, 'users:roles:assign'));

CREATE POLICY "Admins can revoke roles" ON public.user_roles
    FOR DELETE TO authenticated
    USING (
        public.has_permission(auth.uid(), school_id, 'users:roles:assign')
        AND user_id != auth.uid()
    );

-- 13. RLS for permissions (read-only for authenticated)
CREATE POLICY "Authenticated can read permissions" ON public.permissions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can read role_permissions" ON public.role_permissions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can read school_role_permissions" ON public.school_role_permissions
    FOR SELECT TO authenticated
    USING (school_id = ANY(public.get_accessible_schools(auth.uid())));
