
-- =============================================
-- MIGRATION 4: Audit System, Triggers, Notifications, Permission Seeds
-- =============================================

-- 1. Audit logs table (general)
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id),
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(20) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_audit_school ON public.audit_logs(school_id);
CREATE INDEX idx_audit_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_date ON public.audit_logs(created_at);

CREATE POLICY "audit_logs_select" ON public.audit_logs FOR SELECT TO authenticated
    USING (
        school_id = ANY(public.get_accessible_schools(auth.uid()))
        AND public.has_permission(auth.uid(), school_id, 'reports:audit:view')
    );

-- 2. Notification templates
CREATE TABLE public.notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id),
    name VARCHAR(100) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    channel VARCHAR(10) NOT NULL DEFAULT 'sms',
    subject VARCHAR(200),
    body TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notification_templates_select" ON public.notification_templates FOR SELECT TO authenticated
    USING (school_id IS NULL OR school_id = ANY(public.get_accessible_schools(auth.uid())));
CREATE POLICY "notification_templates_insert" ON public.notification_templates FOR INSERT TO authenticated
    WITH CHECK (public.has_permission(auth.uid(), school_id, 'settings:school:manage'));
CREATE POLICY "notification_templates_update" ON public.notification_templates FOR UPDATE TO authenticated
    USING (public.has_permission(auth.uid(), school_id, 'settings:school:manage'));

-- 3. Notifications
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id),
    template_id UUID REFERENCES public.notification_templates(id),
    recipient_type VARCHAR(20) NOT NULL,
    recipient_id UUID NOT NULL,
    recipient_contact VARCHAR(200) NOT NULL,
    channel VARCHAR(10) NOT NULL DEFAULT 'sms',
    subject VARCHAR(200),
    body TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_notifications_status ON public.notifications(status);
CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_type, recipient_id);

CREATE POLICY "notifications_select" ON public.notifications FOR SELECT TO authenticated
    USING (school_id = ANY(public.get_accessible_schools(auth.uid())));

-- 4. Generic audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    _old_data JSONB;
    _new_data JSONB;
    _action VARCHAR(20);
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

    INSERT INTO public.audit_logs (
        school_id, user_id, action, entity_type, entity_id, old_values, new_values
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Apply audit triggers to sensitive tables
CREATE TRIGGER audit_payments
    AFTER INSERT OR UPDATE OR DELETE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_student_fees
    AFTER INSERT OR UPDATE OR DELETE ON public.student_fees
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_user_roles
    AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_student_enrollments
    AFTER INSERT OR UPDATE OR DELETE ON public.student_enrollments
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- 6. Prevent modifications to finance audit logs
CREATE OR REPLACE FUNCTION public.prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Finance audit logs cannot be modified';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_finance_audit_update
    BEFORE UPDATE OR DELETE ON public.finance_audit_logs
    FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_modification();

-- 7. Reverse payment function
CREATE OR REPLACE FUNCTION public.reverse_payment(_payment_id UUID, _reason TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    _payment RECORD;
    _user_id UUID := auth.uid();
BEGIN
    SELECT * INTO _payment FROM payments WHERE id = _payment_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Payment not found');
    END IF;
    
    IF NOT public.has_permission(_user_id, _payment.school_id, 'finance:payments:reverse') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Permission denied');
    END IF;
    
    IF _payment.status != 'completed' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only completed payments can be reversed');
    END IF;
    
    -- Record in finance audit
    INSERT INTO finance_audit_logs (
        school_id, action, entity_type, entity_id,
        amount_affected, performed_by, metadata
    ) VALUES (
        _payment.school_id, 'PAYMENT_VOIDED', 'payment', _payment_id::TEXT,
        _payment.amount, _user_id::TEXT,
        jsonb_build_object('reason', _reason, 'original_amount', _payment.amount)
    );
    
    -- Update payment status
    UPDATE payments SET status = 'reversed', updated_at = NOW()
    WHERE id = _payment_id;
    
    -- Reverse allocations
    UPDATE student_fees sf SET
        amount_paid = sf.amount_paid - pa.amount,
        status = CASE 
            WHEN sf.amount_paid - pa.amount <= 0 THEN 'pending'
            WHEN sf.amount_paid - pa.amount < sf.amount_due THEN 'partial'
            ELSE sf.status
        END,
        updated_at = NOW()
    FROM payment_allocations pa
    WHERE pa.payment_id = _payment_id
      AND pa.student_fee_id = sf.id;
    
    RETURN jsonb_build_object('success', true, 'reversed_amount', _payment.amount);
END;
$$;

-- 8. Seed permissions
INSERT INTO public.permissions (code, category, name, description) VALUES
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

-- 9. Map permissions to roles
-- school_admin gets ALL permissions
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'school_admin'::public.app_role, id FROM public.permissions;

-- deputy_admin gets all except delete and role assignment
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'deputy_admin'::public.app_role, id FROM public.permissions 
WHERE code NOT IN ('students:delete', 'users:roles:assign');

-- finance_officer
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'finance_officer'::public.app_role, id FROM public.permissions 
WHERE code LIKE 'finance:%' OR code = 'students:read';

-- front_office
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'front_office'::public.app_role, id FROM public.permissions 
WHERE code IN ('students:read', 'finance:fees:read', 'finance:payments:read', 'finance:payments:create');

-- teacher
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'teacher'::public.app_role, id FROM public.permissions 
WHERE code IN ('students:read', 'reports:academic:view');

-- transport_officer
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'transport_officer'::public.app_role, id FROM public.permissions 
WHERE code LIKE 'transport:%' OR code = 'students:read';

-- store_manager
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'store_manager'::public.app_role, id FROM public.permissions 
WHERE code LIKE 'inventory:%' OR code LIKE 'pos:%';

-- pos_attendant
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'pos_attendant'::public.app_role, id FROM public.permissions 
WHERE code = 'pos:sales:create';

-- auditor (read-only everywhere)
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'auditor'::public.app_role, id FROM public.permissions 
WHERE code LIKE '%:read' OR code LIKE '%:view' OR code LIKE 'reports:%';

-- student
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'student'::public.app_role, id FROM public.permissions 
WHERE code IN ('finance:fees:read', 'finance:payments:read');

-- parent
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'parent'::public.app_role, id FROM public.permissions 
WHERE code IN ('students:read', 'finance:fees:read', 'finance:payments:read');

-- 10. Fix overly permissive RLS on student_parents (replace true with proper checks)
DROP POLICY IF EXISTS "student_parents_insert" ON public.student_parents;
DROP POLICY IF EXISTS "student_parents_update" ON public.student_parents;
DROP POLICY IF EXISTS "student_parents_select" ON public.student_parents;

CREATE POLICY "student_parents_select" ON public.student_parents FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.students s 
        WHERE s.id = student_id 
        AND s.school_id = ANY(public.get_accessible_schools(auth.uid()))
    )
);
CREATE POLICY "student_parents_insert" ON public.student_parents FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.students s 
        WHERE s.id = student_id 
        AND public.has_permission(auth.uid(), s.school_id, 'students:create')
    )
);
CREATE POLICY "student_parents_update" ON public.student_parents FOR UPDATE TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.students s 
        WHERE s.id = student_id 
        AND public.has_permission(auth.uid(), s.school_id, 'students:update')
    )
);
