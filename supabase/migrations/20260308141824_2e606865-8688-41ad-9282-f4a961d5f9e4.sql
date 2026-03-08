
-- =============================================
-- MIGRATION 3: Transport & POS/Inventory
-- =============================================

-- 1. Fee categories table
CREATE TABLE public.fee_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'tuition',
    description TEXT,
    is_refundable BOOLEAN DEFAULT false,
    is_optional BOOLEAN DEFAULT false,
    gl_code VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, name)
);

ALTER TABLE public.fee_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fee_categories_select" ON public.fee_categories FOR SELECT TO authenticated
    USING (school_id = ANY(public.get_accessible_schools(auth.uid())));
CREATE POLICY "fee_categories_insert" ON public.fee_categories FOR INSERT TO authenticated
    WITH CHECK (public.has_permission(auth.uid(), school_id, 'finance:fees:create'));
CREATE POLICY "fee_categories_update" ON public.fee_categories FOR UPDATE TO authenticated
    USING (public.has_permission(auth.uid(), school_id, 'finance:fees:create'));

-- 2. Fee structures table
CREATE TABLE public.fee_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id),
    term_id UUID REFERENCES public.terms(id),
    grade_id UUID REFERENCES public.grades(id),
    fee_category_id UUID NOT NULL REFERENCES public.fee_categories(id),
    name VARCHAR(150) NOT NULL,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    due_date DATE,
    is_mandatory BOOLEAN DEFAULT true,
    applies_to_new_students BOOLEAN DEFAULT true,
    applies_to_continuing BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_fee_structures_year ON public.fee_structures(academic_year_id);
CREATE INDEX idx_fee_structures_term ON public.fee_structures(term_id);
CREATE INDEX idx_fee_structures_grade ON public.fee_structures(grade_id);

CREATE POLICY "fee_structures_select" ON public.fee_structures FOR SELECT TO authenticated
    USING (school_id = ANY(public.get_accessible_schools(auth.uid())));
CREATE POLICY "fee_structures_insert" ON public.fee_structures FOR INSERT TO authenticated
    WITH CHECK (public.has_permission(auth.uid(), school_id, 'finance:fees:create'));
CREATE POLICY "fee_structures_update" ON public.fee_structures FOR UPDATE TO authenticated
    USING (public.has_permission(auth.uid(), school_id, 'finance:fees:create'));

-- 3. Vehicles table
CREATE TABLE public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    registration_number VARCHAR(20) NOT NULL,
    make VARCHAR(50),
    model VARCHAR(50),
    capacity SMALLINT NOT NULL DEFAULT 0,
    year_of_manufacture SMALLINT,
    insurance_expiry DATE,
    inspection_expiry DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, registration_number)
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehicles_select" ON public.vehicles FOR SELECT TO authenticated
    USING (school_id = ANY(public.get_accessible_schools(auth.uid())));
CREATE POLICY "vehicles_insert" ON public.vehicles FOR INSERT TO authenticated
    WITH CHECK (public.has_permission(auth.uid(), school_id, 'transport:routes:manage'));
CREATE POLICY "vehicles_update" ON public.vehicles FOR UPDATE TO authenticated
    USING (public.has_permission(auth.uid(), school_id, 'transport:routes:manage'));

-- 4. Transport routes table
CREATE TABLE public.transport_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    stops JSONB DEFAULT '[]',
    vehicle_id UUID REFERENCES public.vehicles(id),
    driver_id UUID REFERENCES public.profiles(id),
    attendant_id UUID REFERENCES public.profiles(id),
    monthly_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    per_term_fee DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, name)
);

ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transport_routes_select" ON public.transport_routes FOR SELECT TO authenticated
    USING (school_id = ANY(public.get_accessible_schools(auth.uid())));
CREATE POLICY "transport_routes_insert" ON public.transport_routes FOR INSERT TO authenticated
    WITH CHECK (public.has_permission(auth.uid(), school_id, 'transport:routes:manage'));
CREATE POLICY "transport_routes_update" ON public.transport_routes FOR UPDATE TO authenticated
    USING (public.has_permission(auth.uid(), school_id, 'transport:routes:manage'));

-- 5. Student transport assignments
CREATE TABLE public.student_transport_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES public.transport_routes(id),
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id),
    pickup_stop VARCHAR(100),
    dropoff_stop VARCHAR(100),
    billing_type VARCHAR(20) DEFAULT 'monthly',
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, academic_year_id)
);

ALTER TABLE public.student_transport_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transport_assignments_select" ON public.student_transport_assignments FOR SELECT TO authenticated
    USING (school_id = ANY(public.get_accessible_schools(auth.uid())));
CREATE POLICY "transport_assignments_insert" ON public.student_transport_assignments FOR INSERT TO authenticated
    WITH CHECK (public.has_permission(auth.uid(), school_id, 'transport:assignments:manage'));
CREATE POLICY "transport_assignments_update" ON public.student_transport_assignments FOR UPDATE TO authenticated
    USING (public.has_permission(auth.uid(), school_id, 'transport:assignments:manage'));

-- 6. Transport fees (separate ledger)
CREATE TABLE public.transport_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    assignment_id UUID NOT NULL REFERENCES public.student_transport_assignments(id),
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id),
    term_id UUID REFERENCES public.terms(id),
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    balance DECIMAL(10,2) GENERATED ALWAYS AS (amount - amount_paid) STORED,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.transport_fees ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_transport_fees_student ON public.transport_fees(student_id);
CREATE POLICY "transport_fees_select" ON public.transport_fees FOR SELECT TO authenticated
    USING (school_id = ANY(public.get_accessible_schools(auth.uid())));
CREATE POLICY "transport_fees_insert" ON public.transport_fees FOR INSERT TO authenticated
    WITH CHECK (public.has_permission(auth.uid(), school_id, 'transport:fees:manage'));
CREATE POLICY "transport_fees_update" ON public.transport_fees FOR UPDATE TO authenticated
    USING (public.has_permission(auth.uid(), school_id, 'transport:fees:manage'));

-- 7. Transport payment allocations
CREATE TABLE public.transport_payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    transport_fee_id UUID NOT NULL REFERENCES public.transport_fees(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    allocated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.transport_payment_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transport_alloc_select" ON public.transport_payment_allocations FOR SELECT TO authenticated USING (true);
CREATE POLICY "transport_alloc_insert" ON public.transport_payment_allocations FOR INSERT TO authenticated WITH CHECK (true);

-- 8. Inventory categories
CREATE TABLE public.inventory_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, name)
);

ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inv_categories_select" ON public.inventory_categories FOR SELECT TO authenticated
    USING (school_id = ANY(public.get_accessible_schools(auth.uid())));
CREATE POLICY "inv_categories_insert" ON public.inventory_categories FOR INSERT TO authenticated
    WITH CHECK (public.has_permission(auth.uid(), school_id, 'inventory:items:manage'));
CREATE POLICY "inv_categories_update" ON public.inventory_categories FOR UPDATE TO authenticated
    USING (public.has_permission(auth.uid(), school_id, 'inventory:items:manage'));

-- 9. Inventory items
CREATE TABLE public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.inventory_categories(id),
    sku VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    unit VARCHAR(20) DEFAULT 'piece',
    cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    selling_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    quantity_in_stock INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, sku)
);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_inventory_stock ON public.inventory_items(school_id, quantity_in_stock);
CREATE POLICY "inv_items_select" ON public.inventory_items FOR SELECT TO authenticated
    USING (school_id = ANY(public.get_accessible_schools(auth.uid())));
CREATE POLICY "inv_items_insert" ON public.inventory_items FOR INSERT TO authenticated
    WITH CHECK (public.has_permission(auth.uid(), school_id, 'inventory:items:manage'));
CREATE POLICY "inv_items_update" ON public.inventory_items FOR UPDATE TO authenticated
    USING (public.has_permission(auth.uid(), school_id, 'inventory:items:manage'));

-- 10. Inventory transactions
CREATE TABLE public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.inventory_items(id),
    type VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2),
    total_amount DECIMAL(12,2),
    reference_type VARCHAR(50),
    reference_id UUID,
    recorded_by UUID REFERENCES public.profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_inventory_trans_item ON public.inventory_transactions(item_id);
CREATE INDEX idx_inventory_trans_date ON public.inventory_transactions(created_at);
CREATE POLICY "inv_trans_select" ON public.inventory_transactions FOR SELECT TO authenticated
    USING (school_id = ANY(public.get_accessible_schools(auth.uid())));
CREATE POLICY "inv_trans_insert" ON public.inventory_transactions FOR INSERT TO authenticated
    WITH CHECK (public.has_permission(auth.uid(), school_id, 'inventory:stock:adjust'));

-- 11. POS sales
CREATE TABLE public.pos_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    sale_number VARCHAR(50) NOT NULL,
    student_id UUID REFERENCES public.students(id),
    customer_name VARCHAR(200),
    customer_phone VARCHAR(20),
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(20) NOT NULL DEFAULT 'cash',
    payment_id UUID REFERENCES public.payments(id),
    sold_by UUID NOT NULL REFERENCES public.profiles(id),
    sale_date TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, sale_number)
);

ALTER TABLE public.pos_sales ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_pos_sales_date ON public.pos_sales(sale_date);
CREATE INDEX idx_pos_sales_student ON public.pos_sales(student_id);
CREATE POLICY "pos_sales_select" ON public.pos_sales FOR SELECT TO authenticated
    USING (school_id = ANY(public.get_accessible_schools(auth.uid())));
CREATE POLICY "pos_sales_insert" ON public.pos_sales FOR INSERT TO authenticated
    WITH CHECK (public.has_permission(auth.uid(), school_id, 'pos:sales:create'));

-- 12. POS sale items
CREATE TABLE public.pos_sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.pos_sales(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.inventory_items(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    line_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pos_sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pos_items_select" ON public.pos_sale_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "pos_items_insert" ON public.pos_sale_items FOR INSERT TO authenticated WITH CHECK (true);

-- 13. Update payments table with missing columns
ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.parents(id),
    ADD COLUMN IF NOT EXISTS payer_name VARCHAR(200),
    ADD COLUMN IF NOT EXISTS mpesa_receipt VARCHAR(50),
    ADD COLUMN IF NOT EXISTS mpesa_phone VARCHAR(20),
    ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS bank_reference VARCHAR(100),
    ADD COLUMN IF NOT EXISTS cheque_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS cheque_date DATE,
    ADD COLUMN IF NOT EXISTS transaction_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS is_reconciled BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS reconciled_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reconciled_by UUID REFERENCES public.profiles(id);

-- 14. Update payment_allocations with missing columns
ALTER TABLE public.payment_allocations
    ADD COLUMN IF NOT EXISTS allocated_by UUID REFERENCES public.profiles(id),
    ADD COLUMN IF NOT EXISTS is_auto_allocated BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS allocation_order SMALLINT;
