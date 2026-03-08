
-- Fix audit_trigger_func search_path (already has it but let's ensure)
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    _old_data JSONB;
    _new_data JSONB;
    _action VARCHAR(20);
BEGIN
    IF TG_OP = 'INSERT' THEN
        _action := 'create'; _new_data := to_jsonb(NEW); _old_data := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        _action := 'update'; _old_data := to_jsonb(OLD); _new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        _action := 'delete'; _old_data := to_jsonb(OLD); _new_data := NULL;
    END IF;
    INSERT INTO public.audit_logs (school_id, user_id, action, entity_type, entity_id, old_values, new_values)
    VALUES (COALESCE(NEW.school_id, OLD.school_id), auth.uid(), _action, TG_TABLE_NAME, COALESCE(NEW.id, OLD.id), _old_data, _new_data);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix prevent_audit_modification search_path
CREATE OR REPLACE FUNCTION public.prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Finance audit logs cannot be modified';
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix overly permissive policies from earlier migrations on pre-existing tables
-- transport_payment_allocations
DROP POLICY IF EXISTS "transport_alloc_select" ON public.transport_payment_allocations;
DROP POLICY IF EXISTS "transport_alloc_insert" ON public.transport_payment_allocations;
CREATE POLICY "transport_alloc_select" ON public.transport_payment_allocations FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM payments p WHERE p.id = payment_id AND p.school_id = ANY(public.get_accessible_schools(auth.uid()))));
CREATE POLICY "transport_alloc_insert" ON public.transport_payment_allocations FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM payments p WHERE p.id = payment_id AND public.has_permission(auth.uid(), p.school_id, 'transport:fees:manage')));

-- pos_sale_items
DROP POLICY IF EXISTS "pos_items_select" ON public.pos_sale_items;
DROP POLICY IF EXISTS "pos_items_insert" ON public.pos_sale_items;
CREATE POLICY "pos_items_select" ON public.pos_sale_items FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM pos_sales ps WHERE ps.id = sale_id AND ps.school_id = ANY(public.get_accessible_schools(auth.uid()))));
CREATE POLICY "pos_items_insert" ON public.pos_sale_items FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM pos_sales ps WHERE ps.id = sale_id AND public.has_permission(auth.uid(), ps.school_id, 'pos:sales:create')));

-- Fix profiles insert policy  
DROP POLICY IF EXISTS "System can insert profiles" ON public.profiles;
CREATE POLICY "System can insert profiles" ON public.profiles
    FOR INSERT WITH CHECK (id = auth.uid());
