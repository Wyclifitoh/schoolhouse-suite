# CHUO Authentication & RBAC System Design

## 1. Identity Model

### 1.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AUTHENTICATION FLOW                                │
│                                                                              │
│  ┌──────────┐    ┌─────────────┐    ┌──────────────┐    ┌────────────────┐  │
│  │  Client  │───>│ Supabase    │───>│ auth.users   │───>│ JWT Generated  │  │
│  │  Login   │    │ Auth        │    │ (identity)   │    │ + Signed       │  │
│  └──────────┘    └─────────────┘    └──────────────┘    └───────┬────────┘  │
│                                                                   │          │
│                                    ┌──────────────────────────────▼────────┐ │
│                                    │         JWT Claims                    │ │
│                                    │  {                                    │ │
│                                    │    sub: "user-uuid",                  │ │
│                                    │    email: "user@school.edu",          │ │
│                                    │    role: "authenticated"              │ │
│                                    │  }                                    │ │
│                                    └───────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 User Identity Tables

```sql
-- Primary identity (Supabase managed)
-- auth.users contains: id, email, encrypted_password, email_confirmed_at, etc.

-- Extended profile (application managed)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,  -- Primary school
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ,
    mfa_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 2. Role-Based Access Control (RBAC)

### 2.1 Role Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ROLE HIERARCHY                                     │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        SYSTEM LEVEL                                   │   │
│  │  super_admin ─────────────────────────────────────────────────────────│   │
│  │       │ Can access ALL schools, manage subscriptions, system config   │   │
│  └───────┼──────────────────────────────────────────────────────────────┘   │
│          │                                                                   │
│  ┌───────▼──────────────────────────────────────────────────────────────┐   │
│  │                        SCHOOL LEVEL                                   │   │
│  │                                                                       │   │
│  │  school_admin ──────┬── deputy_admin                                  │   │
│  │       │             │        │                                        │   │
│  │       │   ┌─────────┴────────┴────────────────────────────────────┐  │   │
│  │       │   │                                                        │  │   │
│  │       ▼   ▼                                                        │  │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐   │   │
│  │  │   teacher   │ │  finance    │ │  transport  │ │   store    │   │   │
│  │  │             │ │  officer    │ │  officer    │ │   manager  │   │   │
│  │  └─────────────┘ └──────┬──────┘ └─────────────┘ └─────┬──────┘   │   │
│  │                         │                               │          │   │
│  │                         ▼                               ▼          │   │
│  │                  front_office                     pos_attendant    │   │
│  │                                                                    │   │
│  │  ┌─────────────────────────────────────────────────────────────┐  │   │
│  │  │                    READ-ONLY / PORTAL                       │  │   │
│  │  │  auditor ─── student ─── parent                             │  │   │
│  │  └─────────────────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Roles & Permissions Matrix

```sql
CREATE TYPE app_role AS ENUM (
    'super_admin',      -- System-wide access
    'school_admin',     -- Full school access
    'deputy_admin',     -- School access, limited destructive ops
    'teacher',          -- Academic module access
    'finance_officer',  -- Full finance access
    'front_office',     -- Limited finance (receipting only)
    'transport_officer',-- Transport module access
    'store_manager',    -- Full inventory/POS access
    'pos_attendant',    -- POS sales only
    'student',          -- Student portal
    'parent',           -- Parent portal
    'auditor'           -- Read-only access to all modules
);

-- Roles are stored separately per school (user can have roles in multiple schools)
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,  -- NULL for super_admin
    role app_role NOT NULL,
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,  -- Optional role expiration
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, school_id, role)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_school ON user_roles(school_id);
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
```

### 2.3 Permission Definitions

```sql
-- Granular permissions for fine-grained control
CREATE TYPE permission_category AS ENUM (
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

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,          -- 'finance:payments:create'
    category permission_category NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default permissions per role (system-defined)
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role app_role NOT NULL,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role, permission_id)
);

-- School-specific permission overrides (optional customization)
CREATE TABLE school_role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    is_granted BOOLEAN NOT NULL,  -- true = grant, false = revoke
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, role, permission_id)
);
```

### 2.4 Permission Codes

```sql
-- Seed permissions
INSERT INTO permissions (code, category, name, description) VALUES
-- Students
('students:read', 'students', 'View Students', 'View student records'),
('students:create', 'students', 'Create Students', 'Add new students'),
('students:update', 'students', 'Update Students', 'Modify student records'),
('students:delete', 'students', 'Delete Students', 'Remove students'),
('students:promote', 'students', 'Promote Students', 'Promote/demote students'),
('students:transfer', 'students', 'Transfer Students', 'Transfer students'),

-- Finance
('finance:fees:read', 'finance', 'View Fees', 'View fee structures and balances'),
('finance:fees:create', 'finance', 'Create Fees', 'Create fee structures'),
('finance:fees:assign', 'finance', 'Assign Fees', 'Assign fees to students'),
('finance:fees:waive', 'finance', 'Waive Fees', 'Apply fee waivers/discounts'),
('finance:payments:read', 'finance', 'View Payments', 'View payment records'),
('finance:payments:create', 'finance', 'Create Payments', 'Record payments'),
('finance:payments:reverse', 'finance', 'Reverse Payments', 'Reverse/refund payments'),
('finance:reports:view', 'finance', 'View Finance Reports', 'Access financial reports'),
('finance:reports:export', 'finance', 'Export Finance Reports', 'Export financial data'),

-- Transport
('transport:routes:manage', 'transport', 'Manage Routes', 'Create/edit routes'),
('transport:assignments:manage', 'transport', 'Manage Assignments', 'Assign students to routes'),
('transport:fees:manage', 'transport', 'Manage Transport Fees', 'Handle transport billing'),

-- Inventory & POS
('inventory:items:manage', 'inventory', 'Manage Inventory', 'Add/edit inventory items'),
('inventory:stock:adjust', 'inventory', 'Adjust Stock', 'Modify stock levels'),
('pos:sales:create', 'pos', 'Create Sales', 'Process POS sales'),
('pos:sales:void', 'pos', 'Void Sales', 'Void/cancel sales'),

-- Reports
('reports:academic:view', 'reports', 'View Academic Reports', 'Access academic reports'),
('reports:finance:view', 'reports', 'View Finance Reports', 'Access finance reports'),
('reports:audit:view', 'reports', 'View Audit Logs', 'Access audit trail'),

-- Settings & Users
('settings:school:manage', 'settings', 'Manage School Settings', 'Configure school'),
('users:manage', 'users', 'Manage Users', 'Add/edit staff accounts'),
('users:roles:assign', 'users', 'Assign Roles', 'Grant/revoke roles');

-- Map permissions to roles
INSERT INTO role_permissions (role, permission_id)
SELECT 'school_admin', id FROM permissions;  -- Admin gets all

INSERT INTO role_permissions (role, permission_id)
SELECT 'finance_officer', id FROM permissions 
WHERE code LIKE 'finance:%' OR code = 'students:read';

INSERT INTO role_permissions (role, permission_id)
SELECT 'front_office', id FROM permissions 
WHERE code IN (
    'students:read', 
    'finance:fees:read', 
    'finance:payments:read', 
    'finance:payments:create'
);

-- Continue for other roles...
```

---

## 3. Security Definer Functions

### 3.1 Core Authorization Functions

```sql
-- Check if user has a specific role in any school or globally
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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
CREATE OR REPLACE FUNCTION public.has_role_in_school(
    _user_id UUID, 
    _school_id UUID, 
    _role app_role
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id
          AND (school_id = _school_id OR school_id IS NULL)  -- NULL = super_admin
          AND role = _role
          AND is_active = true
          AND (expires_at IS NULL OR expires_at > NOW())
    )
$$;

-- Get all active roles for a user in a school
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID, _school_id UUID)
RETURNS app_role[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT ARRAY_AGG(role)
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (school_id = _school_id OR school_id IS NULL)
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
$$;

-- Check if user has a specific permission
CREATE OR REPLACE FUNCTION public.has_permission(
    _user_id UUID,
    _school_id UUID,
    _permission_code VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _roles app_role[];
    _has_permission BOOLEAN := false;
    _role app_role;
BEGIN
    -- Get user's roles for this school
    _roles := public.get_user_roles(_user_id, _school_id);
    
    IF _roles IS NULL OR array_length(_roles, 1) IS NULL THEN
        RETURN false;
    END IF;
    
    -- Super admin has all permissions
    IF 'super_admin' = ANY(_roles) THEN
        RETURN true;
    END IF;
    
    -- School admin has all school-level permissions
    IF 'school_admin' = ANY(_roles) THEN
        RETURN true;
    END IF;
    
    -- Check role-based permissions
    FOREACH _role IN ARRAY _roles LOOP
        -- Check default role permissions
        SELECT EXISTS (
            SELECT 1 FROM role_permissions rp
            JOIN permissions p ON p.id = rp.permission_id
            WHERE rp.role = _role AND p.code = _permission_code
        ) INTO _has_permission;
        
        IF _has_permission THEN
            -- Check for school-specific override (revoke)
            SELECT NOT EXISTS (
                SELECT 1 FROM school_role_permissions srp
                JOIN permissions p ON p.id = srp.permission_id
                WHERE srp.school_id = _school_id
                  AND srp.role = _role
                  AND p.code = _permission_code
                  AND srp.is_granted = false
            ) INTO _has_permission;
            
            IF _has_permission THEN
                RETURN true;
            END IF;
        ELSE
            -- Check for school-specific grant
            SELECT EXISTS (
                SELECT 1 FROM school_role_permissions srp
                JOIN permissions p ON p.id = srp.permission_id
                WHERE srp.school_id = _school_id
                  AND srp.role = _role
                  AND p.code = _permission_code
                  AND srp.is_granted = true
            ) INTO _has_permission;
            
            IF _has_permission THEN
                RETURN true;
            END IF;
        END IF;
    END LOOP;
    
    RETURN false;
END;
$$;

-- Get user's accessible school IDs
CREATE OR REPLACE FUNCTION public.get_accessible_schools(_user_id UUID)
RETURNS UUID[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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
```

---

## 4. Row-Level Security (RLS) Policies

### 4.1 Tenant Isolation Pattern

```sql
-- Base RLS policy pattern for all tenant-scoped tables
-- Example: students table

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Users can only see students in their accessible schools
CREATE POLICY "students_select_policy" ON students
    FOR SELECT
    TO authenticated
    USING (
        school_id = ANY(public.get_accessible_schools(auth.uid()))
    );

-- Only users with students:create permission can insert
CREATE POLICY "students_insert_policy" ON students
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.has_permission(auth.uid(), school_id, 'students:create')
    );

-- Only users with students:update permission can update
CREATE POLICY "students_update_policy" ON students
    FOR UPDATE
    TO authenticated
    USING (
        public.has_permission(auth.uid(), school_id, 'students:update')
    )
    WITH CHECK (
        public.has_permission(auth.uid(), school_id, 'students:update')
    );

-- Only admins can delete
CREATE POLICY "students_delete_policy" ON students
    FOR DELETE
    TO authenticated
    USING (
        public.has_role_in_school(auth.uid(), school_id, 'school_admin')
        OR public.has_role(auth.uid(), 'super_admin')
    );
```

### 4.2 Finance-Specific Policies

```sql
-- Payments: Extra strict policies
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select_policy" ON payments
    FOR SELECT
    TO authenticated
    USING (
        school_id = ANY(public.get_accessible_schools(auth.uid()))
        AND public.has_permission(auth.uid(), school_id, 'finance:payments:read')
    );

CREATE POLICY "payments_insert_policy" ON payments
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.has_permission(auth.uid(), school_id, 'finance:payments:create')
    );

-- Payments cannot be updated directly, only status changes via functions
CREATE POLICY "payments_update_policy" ON payments
    FOR UPDATE
    TO authenticated
    USING (false)  -- Block direct updates
    WITH CHECK (false);

-- Payments cannot be deleted
CREATE POLICY "payments_delete_policy" ON payments
    FOR DELETE
    TO authenticated
    USING (false);  -- Block all deletes

-- Payment reversal must go through secure function
CREATE OR REPLACE FUNCTION public.reverse_payment(
    _payment_id UUID,
    _reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _payment RECORD;
    _user_id UUID := auth.uid();
BEGIN
    -- Get payment
    SELECT * INTO _payment FROM payments WHERE id = _payment_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Payment not found');
    END IF;
    
    -- Check permission
    IF NOT public.has_permission(_user_id, _payment.school_id, 'finance:payments:reverse') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Permission denied');
    END IF;
    
    -- Check status
    IF _payment.status != 'completed' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only completed payments can be reversed');
    END IF;
    
    -- Record in finance audit BEFORE change
    INSERT INTO finance_audit_logs (
        school_id, ledger_type, action, entity_type, entity_id,
        amount_before, amount_after, performed_by, reason
    ) VALUES (
        _payment.school_id, _payment.ledger_type, 'reverse', 'payment', _payment_id,
        _payment.amount, 0, _user_id, _reason
    );
    
    -- Update payment status (bypasses RLS via security definer)
    UPDATE payments SET 
        status = 'reversed',
        updated_at = NOW()
    WHERE id = _payment_id;
    
    -- Reverse allocations (update student_fees balances)
    UPDATE student_fees sf SET
        amount_paid = amount_paid - pa.amount,
        status = CASE 
            WHEN amount_paid - pa.amount = 0 THEN 'pending'
            WHEN amount_paid - pa.amount < adjusted_amount THEN 'partial'
            ELSE status
        END,
        updated_at = NOW()
    FROM payment_allocations pa
    WHERE pa.payment_id = _payment_id
      AND pa.student_fee_id = sf.id;
    
    RETURN jsonb_build_object('success', true);
END;
$$;
```

### 4.3 User Roles Policies

```sql
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Users can see roles in their schools
CREATE POLICY "user_roles_select_policy" ON user_roles
    FOR SELECT
    TO authenticated
    USING (
        school_id = ANY(public.get_accessible_schools(auth.uid()))
        OR user_id = auth.uid()  -- Users can see their own roles
    );

-- Only admins can grant roles
CREATE POLICY "user_roles_insert_policy" ON user_roles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        public.has_permission(auth.uid(), school_id, 'users:roles:assign')
        -- Prevent privilege escalation: can't grant higher roles than own
        AND (
            public.has_role(auth.uid(), 'super_admin')
            OR (
                public.has_role_in_school(auth.uid(), school_id, 'school_admin')
                AND role NOT IN ('super_admin', 'school_admin')
            )
            OR (
                public.has_role_in_school(auth.uid(), school_id, 'deputy_admin')
                AND role NOT IN ('super_admin', 'school_admin', 'deputy_admin')
            )
        )
    );

-- Only admins can revoke roles
CREATE POLICY "user_roles_update_policy" ON user_roles
    FOR UPDATE
    TO authenticated
    USING (
        public.has_permission(auth.uid(), school_id, 'users:roles:assign')
    );

CREATE POLICY "user_roles_delete_policy" ON user_roles
    FOR DELETE
    TO authenticated
    USING (
        public.has_permission(auth.uid(), school_id, 'users:roles:assign')
        AND user_id != auth.uid()  -- Can't remove own roles
    );
```

---

## 5. Multi-School Access Control

### 5.1 School Context Management

```sql
-- Active school context for current session
-- Stored in app_metadata or session storage

-- API middleware sets school context from request header
-- Edge function example:
```

```typescript
// Edge Function: Set school context middleware
import { createClient } from '@supabase/supabase-js'

export async function setSchoolContext(req: Request, supabase: SupabaseClient) {
  const schoolId = req.headers.get('X-School-ID')
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return { error: 'Unauthorized', status: 401 }
  }
  
  // Verify token and get user
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    return { error: 'Invalid token', status: 401 }
  }
  
  // Verify user has access to requested school
  const { data: hasAccess } = await supabase.rpc('has_role_in_school', {
    _user_id: user.id,
    _school_id: schoolId,
    _role: 'any'  // Check for any role
  })
  
  if (!hasAccess) {
    return { error: 'Access denied to school', status: 403 }
  }
  
  return { user, schoolId }
}
```

### 5.2 Multi-School User Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MULTI-SCHOOL ACCESS FLOW                              │
│                                                                              │
│  ┌──────────┐    ┌────────────────────────────────────────────────────────┐ │
│  │  Login   │───>│ Get accessible schools for user                        │ │
│  └──────────┘    │ SELECT school_id, s.name FROM user_roles ur            │ │
│                  │ JOIN schools s ON s.id = ur.school_id                  │ │
│                  │ WHERE ur.user_id = auth.uid()                          │ │
│                  └─────────────────────────────┬──────────────────────────┘ │
│                                                │                             │
│                           ┌────────────────────▼────────────────────┐       │
│                           │   School Selector UI                     │       │
│                           │   ┌─────────────────────────────────┐   │       │
│                           │   │  Select School:                 │   │       │
│                           │   │  ○ Sunrise Academy              │   │       │
│                           │   │  ● Greenfield School            │   │       │
│                           │   │  ○ Valley Primary               │   │       │
│                           │   └─────────────────────────────────┘   │       │
│                           └─────────────────────────────────────────┘       │
│                                                │                             │
│                                                ▼                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  Session Context                                                       │  │
│  │  {                                                                     │  │
│  │    userId: "abc-123",                                                  │  │
│  │    activeSchoolId: "school-456",                                       │  │
│  │    roles: ["finance_officer", "transport_officer"],                    │  │
│  │    permissions: ["finance:*", "transport:*"]                           │  │
│  │  }                                                                     │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                │                             │
│                                                ▼                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  All API requests include X-School-ID header                           │  │
│  │  RLS policies filter data to active school only                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. API-Level Permission Enforcement

### 6.1 Edge Function Middleware Pattern

```typescript
// lib/auth-middleware.ts
import { createClient } from '@supabase/supabase-js'

interface AuthContext {
  user: User
  schoolId: string
  roles: string[]
  checkPermission: (code: string) => Promise<boolean>
}

export async function withAuth(
  req: Request,
  requiredPermission?: string
): Promise<AuthContext | Response> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  )

  // Get user from token
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  const { data, error } = await supabase.auth.getUser(token)
  
  if (error || !data.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  // Get school context
  const schoolId = req.headers.get('X-School-ID')
  if (!schoolId) {
    return new Response(JSON.stringify({ error: 'School context required' }), { status: 400 })
  }

  // Get user roles for this school
  const { data: roles } = await supabase.rpc('get_user_roles', {
    _user_id: data.user.id,
    _school_id: schoolId
  })

  if (!roles || roles.length === 0) {
    return new Response(JSON.stringify({ error: 'No access to school' }), { status: 403 })
  }

  // Check required permission if specified
  if (requiredPermission) {
    const { data: hasPermission } = await supabase.rpc('has_permission', {
      _user_id: data.user.id,
      _school_id: schoolId,
      _permission_code: requiredPermission
    })

    if (!hasPermission) {
      return new Response(JSON.stringify({ 
        error: 'Forbidden',
        required: requiredPermission 
      }), { status: 403 })
    }
  }

  return {
    user: data.user,
    schoolId,
    roles,
    checkPermission: async (code: string) => {
      const { data } = await supabase.rpc('has_permission', {
        _user_id: data.user.id,
        _school_id: schoolId,
        _permission_code: code
      })
      return !!data
    }
  }
}
```

### 6.2 Example Protected Endpoint

```typescript
// supabase/functions/create-payment/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { withAuth } from '../_shared/auth-middleware.ts'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Require finance:payments:create permission
  const authResult = await withAuth(req, 'finance:payments:create')
  if (authResult instanceof Response) {
    return authResult  // Return error response
  }

  const { user, schoolId } = authResult
  const body = await req.json()

  // Create payment with audit trail
  const supabase = createAdminClient()
  
  // Begin transaction via RPC
  const { data, error } = await supabase.rpc('create_payment_with_audit', {
    _school_id: schoolId,
    _student_id: body.studentId,
    _amount: body.amount,
    _payment_method: body.paymentMethod,
    _recorded_by: user.id
  })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify(data), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
```

---

## 7. Sensitive Action Audit Logging

### 7.1 Audit Trigger Pattern

```sql
-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    _old_data JSONB;
    _new_data JSONB;
    _action audit_action;
BEGIN
    IF TG_OP = 'INSERT' THEN
        _action := 'create';
        _new_data := to_jsonb(NEW);
        _old_data := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        _action := 'update';
        _old_data := to_jsonb(OLD);
        _new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        _action := 'delete';
        _old_data := to_jsonb(OLD);
        _new_data := NULL;
    END IF;

    INSERT INTO audit_logs (
        school_id,
        user_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values
    ) VALUES (
        COALESCE(NEW.school_id, OLD.school_id),
        auth.uid(),
        _action,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        _old_data,
        _new_data
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to sensitive tables
CREATE TRIGGER audit_payments
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_student_fees
    AFTER INSERT OR UPDATE OR DELETE ON student_fees
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_fee_discounts
    AFTER INSERT OR UPDATE OR DELETE ON fee_discounts
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_user_roles
    AFTER INSERT OR UPDATE OR DELETE ON user_roles
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_student_enrollments
    AFTER INSERT OR UPDATE OR DELETE ON student_enrollments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
```

### 7.2 Finance-Specific Immutable Audit

```sql
-- Special trigger for finance operations with balance tracking
CREATE OR REPLACE FUNCTION finance_audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'payments' THEN
        INSERT INTO finance_audit_logs (
            school_id, ledger_type, action, entity_type, entity_id,
            amount_before, amount_after,
            performed_by
        ) VALUES (
            COALESCE(NEW.school_id, OLD.school_id),
            COALESCE(NEW.ledger_type, OLD.ledger_type),
            TG_OP::VARCHAR,
            'payment',
            COALESCE(NEW.id, OLD.id),
            CASE WHEN TG_OP = 'UPDATE' THEN OLD.amount ELSE NULL END,
            CASE WHEN TG_OP != 'DELETE' THEN NEW.amount ELSE NULL END,
            auth.uid()
        );
    ELSIF TG_TABLE_NAME = 'student_fees' THEN
        INSERT INTO finance_audit_logs (
            school_id, ledger_type, action, entity_type, entity_id,
            balance_before, balance_after,
            performed_by
        ) VALUES (
            COALESCE(NEW.school_id, OLD.school_id),
            'fees',
            TG_OP::VARCHAR,
            'student_fee',
            COALESCE(NEW.id, OLD.id),
            CASE WHEN TG_OP = 'UPDATE' THEN OLD.balance ELSE NULL END,
            CASE WHEN TG_OP != 'DELETE' THEN NEW.balance ELSE NULL END,
            auth.uid()
        );
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER finance_audit_payments
    AFTER INSERT OR UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION finance_audit_trigger_func();

CREATE TRIGGER finance_audit_student_fees
    AFTER INSERT OR UPDATE ON student_fees
    FOR EACH ROW EXECUTE FUNCTION finance_audit_trigger_func();

-- Prevent modifications to finance audit logs
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Finance audit logs cannot be modified';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_finance_audit_update
    BEFORE UPDATE OR DELETE ON finance_audit_logs
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();
```

### 7.3 Login/Logout Tracking

```sql
-- Track authentication events
CREATE OR REPLACE FUNCTION log_auth_event()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at THEN
        INSERT INTO audit_logs (
            user_id,
            action,
            entity_type,
            entity_id,
            new_values
        ) VALUES (
            NEW.id,
            'login',
            'auth.users',
            NEW.id,
            jsonb_build_object(
                'email', NEW.email,
                'last_sign_in_at', NEW.last_sign_in_at
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: This trigger must be created in auth schema (requires superuser)
-- CREATE TRIGGER on_auth_sign_in
--     AFTER UPDATE ON auth.users
--     FOR EACH ROW EXECUTE FUNCTION log_auth_event();
```

---

## 8. Security Best Practices Checklist

### 8.1 Implementation Checklist

```
✅ Authentication
   □ Email/password via Supabase Auth
   □ MFA support for admin roles
   □ Password policy enforcement
   □ Session timeout configuration
   □ JWT token refresh handling

✅ Authorization
   □ Roles stored in separate user_roles table
   □ Security definer functions for role checks
   □ RLS policies on ALL tenant tables
   □ Permission checks at API layer
   □ Privilege escalation prevention

✅ Multi-Tenancy
   □ school_id on all tenant tables
   □ School context in all API requests
   □ Cross-tenant access blocked by RLS
   □ Super admin bypass properly scoped

✅ Audit Trail
   □ All sensitive operations logged
   □ Finance audit logs immutable
   □ IP address and user agent captured
   □ Before/after values recorded

✅ API Security
   □ All endpoints require authentication
   □ Permission checks before operations
   □ Input validation with Zod
   □ Rate limiting on auth endpoints
   □ CORS properly configured
```

### 8.2 Frontend Authorization Hook

```typescript
// hooks/usePermissions.ts
import { useAuth } from './useAuth'

export function usePermissions() {
  const { user, schoolId, roles } = useAuth()

  const hasRole = (role: string) => roles?.includes(role) ?? false
  
  const hasAnyRole = (checkRoles: string[]) => 
    checkRoles.some(r => hasRole(r))

  const isAdmin = () => 
    hasAnyRole(['super_admin', 'school_admin'])

  const canAccess = (permission: string) => {
    if (isAdmin()) return true
    // Check against cached permissions or call API
    return checkPermission(user?.id, schoolId, permission)
  }

  return {
    hasRole,
    hasAnyRole,
    isAdmin,
    canAccess,
    roles
  }
}

// Usage in components
function PaymentForm() {
  const { canAccess } = usePermissions()

  if (!canAccess('finance:payments:create')) {
    return <AccessDenied />
  }

  return <Form>...</Form>
}
```

---

## 9. Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE AUTH/RBAC DATA FLOW                              │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ 1. LOGIN                                                                 ││
│  │    User → Supabase Auth → JWT → Store in client                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│  ┌─────────────────────────────────▼───────────────────────────────────────┐│
│  │ 2. SCHOOL SELECTION                                                      ││
│  │    JWT → get_accessible_schools() → UI selector → set X-School-ID       ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│  ┌─────────────────────────────────▼───────────────────────────────────────┐│
│  │ 3. API REQUEST                                                           ││
│  │    Request + JWT + X-School-ID → Edge Function                          ││
│  │         │                                                                ││
│  │         ├─→ withAuth() middleware                                        ││
│  │         │      ├─→ Validate JWT                                          ││
│  │         │      ├─→ Check school access                                   ││
│  │         │      └─→ Check required permission                             ││
│  │         │                                                                ││
│  │         └─→ Execute operation with RLS context                           ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│  ┌─────────────────────────────────▼───────────────────────────────────────┐│
│  │ 4. DATABASE QUERY                                                        ││
│  │    RLS policies → school_id filter → permission check → return data     ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│  ┌─────────────────────────────────▼───────────────────────────────────────┐│
│  │ 5. AUDIT                                                                 ││
│  │    Triggers → audit_logs / finance_audit_logs → immutable record        ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```
