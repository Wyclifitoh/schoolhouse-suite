# CHUO Database Schema Design

## Multi-Tenancy Strategy
All tenant-scoped tables include `school_id UUID NOT NULL` with RLS policies enforcing isolation.

---

## 1. Core Tenancy & Identity

### 1.1 `schools`
```sql
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,           -- e.g., "SCH001"
    address TEXT,
    county VARCHAR(100),
    sub_county VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    logo_url TEXT,
    curriculum_type VARCHAR(20) NOT NULL,       -- 'CBC', '8-4-4', 'BOTH'
    subscription_status VARCHAR(20) DEFAULT 'active',
    settings JSONB DEFAULT '{}',                -- school-level config
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.2 `users`
```sql
-- Uses Supabase auth.users as primary identity
-- This profiles table extends auth.users
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.3 `app_role` enum & `user_roles`
```sql
CREATE TYPE app_role AS ENUM (
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

CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, school_id, role)
);
```

---

## 2. Academic Structure

### 2.1 `academic_years`
```sql
CREATE TABLE academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,                  -- e.g., "2025"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, name)
);
```

### 2.2 `terms`
```sql
CREATE TYPE term_status AS ENUM ('upcoming', 'active', 'closed');

CREATE TABLE terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,                  -- "Term 1", "Term 2", "Term 3"
    term_number SMALLINT NOT NULL CHECK (term_number BETWEEN 1 AND 3),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status term_status DEFAULT 'upcoming',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(academic_year_id, term_number)
);
```

### 2.3 `grades` (CBC) / `classes` (8-4-4)
```sql
CREATE TYPE education_level AS ENUM (
    'pre_primary',      -- PP1, PP2
    'lower_primary',    -- Grade 1-3
    'upper_primary',    -- Grade 4-6
    'junior_secondary', -- Grade 7-9
    'senior_secondary', -- Grade 10-12
    'primary_844',      -- Std 1-8
    'secondary_844'     -- Form 1-4
);

CREATE TABLE grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,                  -- "PP1", "Grade 1", "Form 1"
    level education_level NOT NULL,
    curriculum_type VARCHAR(10) NOT NULL,       -- 'CBC' or '8-4-4'
    order_index SMALLINT NOT NULL,              -- for sorting
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, name)
);
```

### 2.4 `streams`
```sql
CREATE TABLE streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    grade_id UUID NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,                  -- "East", "West", "A", "B"
    capacity SMALLINT DEFAULT 40,
    class_teacher_id UUID REFERENCES profiles(id),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(grade_id, name, academic_year_id)
);
```

---

## 3. Students & Parents

### 3.1 `students`
```sql
CREATE TYPE student_status AS ENUM (
    'applicant',
    'admitted',
    'active',
    'suspended',
    'transferred',
    'graduated',
    'alumni'
);

CREATE TYPE gender AS ENUM ('male', 'female', 'other');

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),     -- optional login
    
    -- Identity
    admission_number VARCHAR(50) NOT NULL,
    upi VARCHAR(50),                            -- MOE Unique Pupil Identifier
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    gender gender NOT NULL,
    date_of_birth DATE NOT NULL,
    photo_url TEXT,
    
    -- Academic placement
    current_grade_id UUID REFERENCES grades(id),
    current_stream_id UUID REFERENCES streams(id),
    cbc_pathway VARCHAR(50),                    -- STEM, Arts, Social Sciences
    
    -- Status & dates
    status student_status DEFAULT 'active',
    admission_date DATE NOT NULL,
    graduation_date DATE,
    
    -- Additional info
    nationality VARCHAR(50) DEFAULT 'Kenyan',
    religion VARCHAR(50),
    medical_info JSONB DEFAULT '{}',
    special_needs TEXT,
    previous_school TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, admission_number)
);

CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_students_grade ON students(current_grade_id);
CREATE INDEX idx_students_stream ON students(current_stream_id);
CREATE INDEX idx_students_status ON students(school_id, status);
```

### 3.2 `parents`
```sql
CREATE TABLE parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),     -- portal login
    
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,                 -- primary for M-Pesa & SMS
    alt_phone VARCHAR(20),
    id_number VARCHAR(20),                      -- National ID
    occupation VARCHAR(100),
    employer VARCHAR(100),
    address TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_parents_phone ON parents(phone);
```

### 3.3 `student_parents` (Many-to-Many)
```sql
CREATE TYPE relationship_type AS ENUM (
    'father',
    'mother',
    'guardian',
    'sponsor',
    'grandparent',
    'sibling',
    'other'
);

CREATE TABLE student_parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
    relationship relationship_type NOT NULL,
    is_primary_contact BOOLEAN DEFAULT false,
    is_fee_payer BOOLEAN DEFAULT false,         -- receives fee notifications
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, parent_id)
);
```

### 3.4 `student_enrollments` (Historical record)
```sql
CREATE TABLE student_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    grade_id UUID NOT NULL REFERENCES grades(id),
    stream_id UUID REFERENCES streams(id),
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    promoted_from_id UUID REFERENCES student_enrollments(id),
    promotion_status VARCHAR(20),               -- 'promoted', 'repeated', 'transferred'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, academic_year_id)
);
```

---

## 4. Finance Module – Fee Definitions

### 4.1 `fee_categories`
```sql
CREATE TYPE fee_category_type AS ENUM (
    'tuition',
    'admission',
    'interview',
    'examination',
    'activity',
    'transport',
    'boarding',
    'lunch',
    'uniform',
    'books',
    'medical',
    'ict',
    'other'
);

CREATE TABLE fee_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type fee_category_type NOT NULL,
    description TEXT,
    is_refundable BOOLEAN DEFAULT false,
    is_optional BOOLEAN DEFAULT false,
    gl_code VARCHAR(20),                        -- General Ledger code
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, name)
);
```

### 4.2 `fee_structures` (Template definitions)
```sql
CREATE TABLE fee_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    term_id UUID REFERENCES terms(id),          -- NULL = applies to full year
    grade_id UUID REFERENCES grades(id),        -- NULL = all grades
    fee_category_id UUID NOT NULL REFERENCES fee_categories(id),
    
    name VARCHAR(150) NOT NULL,                 -- "PP1 Tuition Term 1 2025"
    amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    due_date DATE,
    is_mandatory BOOLEAN DEFAULT true,
    applies_to_new_students BOOLEAN DEFAULT true,
    applies_to_continuing BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fee_structures_year ON fee_structures(academic_year_id);
CREATE INDEX idx_fee_structures_term ON fee_structures(term_id);
CREATE INDEX idx_fee_structures_grade ON fee_structures(grade_id);
```

---

## 5. Finance Module – Student Fee Ledger (Critical)

### 5.1 `student_fees` (Assigned fees per student)
```sql
CREATE TYPE fee_status AS ENUM (
    'pending',
    'partial',
    'paid',
    'overdue',
    'waived',
    'cancelled'
);

CREATE TABLE student_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    fee_structure_id UUID REFERENCES fee_structures(id),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    term_id UUID REFERENCES terms(id),
    
    -- Fee details (denormalized for ledger integrity)
    fee_category_id UUID NOT NULL REFERENCES fee_categories(id),
    description VARCHAR(255) NOT NULL,
    
    -- Amounts
    original_amount DECIMAL(12,2) NOT NULL CHECK (original_amount >= 0),
    discount_amount DECIMAL(12,2) DEFAULT 0 CHECK (discount_amount >= 0),
    adjusted_amount DECIMAL(12,2) GENERATED ALWAYS AS (original_amount - discount_amount) STORED,
    amount_paid DECIMAL(12,2) DEFAULT 0 CHECK (amount_paid >= 0),
    balance DECIMAL(12,2) GENERATED ALWAYS AS (original_amount - discount_amount - amount_paid) STORED,
    
    -- Status & dates
    status fee_status DEFAULT 'pending',
    due_date DATE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES profiles(id),
    
    -- Carry forward tracking
    is_brought_forward BOOLEAN DEFAULT false,
    brought_forward_from_term UUID REFERENCES terms(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_student_fees_student ON student_fees(student_id);
CREATE INDEX idx_student_fees_year ON student_fees(academic_year_id);
CREATE INDEX idx_student_fees_term ON student_fees(term_id);
CREATE INDEX idx_student_fees_status ON student_fees(status);
CREATE INDEX idx_student_fees_balance ON student_fees(school_id, balance) WHERE balance > 0;
```

### 5.2 `fee_discounts`
```sql
CREATE TYPE discount_type AS ENUM (
    'fixed',
    'percentage',
    'sibling',
    'staff',
    'scholarship',
    'bursary',
    'other'
);

CREATE TABLE fee_discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_fee_id UUID NOT NULL REFERENCES student_fees(id) ON DELETE CASCADE,
    
    discount_type discount_type NOT NULL,
    name VARCHAR(100) NOT NULL,
    value DECIMAL(12,2) NOT NULL,               -- amount or percentage
    is_percentage BOOLEAN DEFAULT false,
    computed_amount DECIMAL(12,2) NOT NULL,     -- actual discount applied
    
    reason TEXT,
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. Finance Module – Payments

### 6.1 `payment_methods`
```sql
CREATE TYPE payment_method_type AS ENUM (
    'mpesa_stk',
    'mpesa_paybill',
    'mpesa_till',
    'bank_transfer',
    'bank_deposit',
    'cheque',
    'cash',
    'card',
    'other'
);
```

### 6.2 `payments`
```sql
CREATE TYPE payment_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'reversed',
    'refunded'
);

CREATE TYPE payment_ledger_type AS ENUM (
    'fees',
    'transport',
    'pos'
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    -- Payer info
    student_id UUID REFERENCES students(id),    -- NULL for walk-in POS
    parent_id UUID REFERENCES parents(id),
    payer_name VARCHAR(200),
    payer_phone VARCHAR(20),
    
    -- Payment details
    receipt_number VARCHAR(50) NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    payment_method payment_method_type NOT NULL,
    ledger_type payment_ledger_type NOT NULL,   -- which ledger
    
    -- M-Pesa specific
    mpesa_receipt VARCHAR(50),
    mpesa_transaction_id VARCHAR(100),
    mpesa_phone VARCHAR(20),
    
    -- Bank/Cheque specific
    bank_name VARCHAR(100),
    bank_reference VARCHAR(100),
    cheque_number VARCHAR(50),
    cheque_date DATE,
    
    -- Status
    status payment_status DEFAULT 'completed',
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recorded_by UUID REFERENCES profiles(id),
    
    -- Reconciliation
    is_reconciled BOOLEAN DEFAULT false,
    reconciled_at TIMESTAMPTZ,
    reconciled_by UUID REFERENCES profiles(id),
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(school_id, receipt_number)
);

CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_date ON payments(transaction_date);
CREATE INDEX idx_payments_mpesa ON payments(mpesa_receipt);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_ledger ON payments(ledger_type);
```

### 6.3 `payment_allocations` (Links payments to specific fees)
```sql
CREATE TABLE payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    student_fee_id UUID NOT NULL REFERENCES student_fees(id) ON DELETE CASCADE,
    
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    allocated_at TIMESTAMPTZ DEFAULT NOW(),
    allocated_by UUID REFERENCES profiles(id),
    
    -- Auto-allocation metadata
    is_auto_allocated BOOLEAN DEFAULT false,
    allocation_order SMALLINT,                  -- priority order
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_allocations_payment ON payment_allocations(payment_id);
CREATE INDEX idx_allocations_fee ON payment_allocations(student_fee_id);
```

### 6.4 `fee_carry_forwards`
```sql
CREATE TABLE fee_carry_forwards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    
    -- Source
    from_academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    from_term_id UUID REFERENCES terms(id),
    
    -- Destination
    to_academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    to_term_id UUID REFERENCES terms(id),
    
    -- Amounts
    balance_carried DECIMAL(12,2) NOT NULL,     -- can be negative (overpayment/credit)
    type VARCHAR(20) NOT NULL,                  -- 'arrears' or 'credit'
    
    -- Linked records
    source_student_fee_id UUID REFERENCES student_fees(id),
    target_student_fee_id UUID REFERENCES student_fees(id),
    
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    processed_by UUID REFERENCES profiles(id),
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. Transport Ledger (Separate from Fees)

### 7.1 `vehicles`
```sql
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    registration_number VARCHAR(20) NOT NULL,
    make VARCHAR(50),
    model VARCHAR(50),
    capacity SMALLINT NOT NULL,
    year_of_manufacture SMALLINT,
    insurance_expiry DATE,
    inspection_expiry DATE,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, registration_number)
);
```

### 7.2 `transport_routes`
```sql
CREATE TABLE transport_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    description TEXT,
    stops JSONB DEFAULT '[]',                   -- [{name, order, pickup_time}]
    
    vehicle_id UUID REFERENCES vehicles(id),
    driver_id UUID REFERENCES profiles(id),
    attendant_id UUID REFERENCES profiles(id),
    
    monthly_fee DECIMAL(10,2) NOT NULL,
    per_term_fee DECIMAL(10,2),
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, name)
);
```

### 7.3 `student_transport_assignments`
```sql
CREATE TABLE student_transport_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES transport_routes(id),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    
    pickup_stop VARCHAR(100),
    dropoff_stop VARCHAR(100),
    billing_type VARCHAR(20) DEFAULT 'monthly', -- 'monthly', 'termly', 'included_in_fees'
    
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, academic_year_id)
);
```

### 7.4 `transport_fees` (Separate ledger)
```sql
CREATE TABLE transport_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    assignment_id UUID NOT NULL REFERENCES student_transport_assignments(id),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    term_id UUID REFERENCES terms(id),
    
    amount DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    balance DECIMAL(10,2) GENERATED ALWAYS AS (amount - amount_paid) STORED,
    
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    due_date DATE,
    status fee_status DEFAULT 'pending',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transport_fees_student ON transport_fees(student_id);
```

### 7.5 `transport_payment_allocations`
```sql
CREATE TABLE transport_payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    transport_fee_id UUID NOT NULL REFERENCES transport_fees(id) ON DELETE CASCADE,
    
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    allocated_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 8. POS & Inventory Ledger (Separate from Fees)

### 8.1 `inventory_categories`
```sql
CREATE TABLE inventory_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, name)
);
```

### 8.2 `inventory_items`
```sql
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    category_id UUID REFERENCES inventory_categories(id),
    
    sku VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    unit VARCHAR(20) DEFAULT 'piece',
    
    cost_price DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    
    quantity_in_stock INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 10,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, sku)
);

CREATE INDEX idx_inventory_stock ON inventory_items(school_id, quantity_in_stock);
```

### 8.3 `inventory_transactions`
```sql
CREATE TYPE inventory_transaction_type AS ENUM (
    'stock_in',
    'stock_out',
    'sale',
    'return',
    'adjustment',
    'transfer',
    'damage'
);

CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(id),
    
    type inventory_transaction_type NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2),
    total_amount DECIMAL(12,2),
    
    reference_type VARCHAR(50),                 -- 'pos_sale', 'purchase_order', etc.
    reference_id UUID,
    
    recorded_by UUID REFERENCES profiles(id),
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_trans_item ON inventory_transactions(item_id);
CREATE INDEX idx_inventory_trans_date ON inventory_transactions(created_at);
```

### 8.4 `pos_sales`
```sql
CREATE TABLE pos_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    
    sale_number VARCHAR(50) NOT NULL,
    student_id UUID REFERENCES students(id),    -- NULL for walk-in
    customer_name VARCHAR(200),
    customer_phone VARCHAR(20),
    
    subtotal DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    
    payment_method payment_method_type NOT NULL,
    payment_id UUID REFERENCES payments(id),
    
    sold_by UUID NOT NULL REFERENCES profiles(id),
    sale_date TIMESTAMPTZ DEFAULT NOW(),
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, sale_number)
);

CREATE INDEX idx_pos_sales_date ON pos_sales(sale_date);
CREATE INDEX idx_pos_sales_student ON pos_sales(student_id);
```

### 8.5 `pos_sale_items`
```sql
CREATE TABLE pos_sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES pos_sales(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(id),
    
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    line_total DECIMAL(12,2) NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 9. Audit & Activity Logs

### 9.1 `audit_logs`
```sql
CREATE TYPE audit_action AS ENUM (
    'create',
    'read',
    'update',
    'delete',
    'login',
    'logout',
    'export',
    'approve',
    'reject',
    'cancel',
    'reverse'
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(id),      -- NULL for super admin actions
    user_id UUID REFERENCES auth.users(id),
    
    action audit_action NOT NULL,
    entity_type VARCHAR(100) NOT NULL,          -- 'payment', 'student_fee', etc.
    entity_id UUID,
    
    old_values JSONB,
    new_values JSONB,
    
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_school ON audit_logs(school_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_date ON audit_logs(created_at);
```

### 9.2 `finance_audit_logs` (Immutable financial trail)
```sql
CREATE TABLE finance_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id),
    
    ledger_type payment_ledger_type NOT NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    
    amount_before DECIMAL(12,2),
    amount_after DECIMAL(12,2),
    balance_before DECIMAL(12,2),
    balance_after DECIMAL(12,2),
    
    performed_by UUID NOT NULL REFERENCES auth.users(id),
    reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prevent updates/deletes on finance audit logs
-- This should be enforced via RLS policies
CREATE INDEX idx_finance_audit_entity ON finance_audit_logs(entity_type, entity_id);
CREATE INDEX idx_finance_audit_date ON finance_audit_logs(created_at);
```

---

## 10. Supporting Tables

### 10.1 `notification_templates`
```sql
CREATE TYPE notification_channel AS ENUM ('sms', 'email', 'push', 'in_app');

CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(id),      -- NULL = system default
    
    name VARCHAR(100) NOT NULL,
    event_type VARCHAR(50) NOT NULL,            -- 'payment_received', 'fee_reminder', etc.
    channel notification_channel NOT NULL,
    
    subject VARCHAR(200),                       -- for email
    body TEXT NOT NULL,                         -- with placeholders {StudentName}, {Amount}
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 10.2 `notifications`
```sql
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed', 'delivered');

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id),
    template_id UUID REFERENCES notification_templates(id),
    
    recipient_type VARCHAR(20) NOT NULL,        -- 'parent', 'student', 'staff'
    recipient_id UUID NOT NULL,
    recipient_contact VARCHAR(200) NOT NULL,
    
    channel notification_channel NOT NULL,
    subject VARCHAR(200),
    body TEXT NOT NULL,
    
    status notification_status DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_type, recipient_id);
```

### 10.3 `mpesa_transactions` (M-Pesa specific tracking)
```sql
CREATE TYPE mpesa_transaction_status AS ENUM (
    'initiated',
    'pending',
    'completed',
    'failed',
    'cancelled',
    'timeout'
);

CREATE TABLE mpesa_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id),
    
    -- Request details
    transaction_type VARCHAR(20) NOT NULL,      -- 'stk_push', 'c2b', 'b2c'
    checkout_request_id VARCHAR(100),
    merchant_request_id VARCHAR(100),
    
    -- M-Pesa response
    mpesa_receipt_number VARCHAR(50),
    transaction_date TIMESTAMPTZ,
    phone_number VARCHAR(20) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    
    -- Account mapping
    account_reference VARCHAR(100),             -- student admission number
    student_id UUID REFERENCES students(id),
    
    -- Status
    status mpesa_transaction_status DEFAULT 'initiated',
    result_code VARCHAR(10),
    result_desc TEXT,
    
    -- Linking
    payment_id UUID REFERENCES payments(id),
    
    raw_request JSONB,
    raw_response JSONB,
    raw_callback JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mpesa_checkout ON mpesa_transactions(checkout_request_id);
CREATE INDEX idx_mpesa_receipt ON mpesa_transactions(mpesa_receipt_number);
CREATE INDEX idx_mpesa_phone ON mpesa_transactions(phone_number);
CREATE INDEX idx_mpesa_status ON mpesa_transactions(status);
```

---

## Entity Relationship Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MULTI-TENANCY                                   │
│  schools ──┬──> profiles ──> user_roles                                     │
│            │                                                                 │
│            ├──> academic_years ──> terms                                    │
│            │                                                                 │
│            ├──> grades ──> streams                                          │
│            │                                                                 │
│            └──> students ──> student_enrollments                            │
│                    │                                                         │
│                    ├──> student_parents <── parents                         │
│                    │                                                         │
│  ┌─────────────────┴─────────────────┐                                      │
│  │         FINANCE LEDGER            │                                      │
│  │  fee_structures ──> student_fees  │                                      │
│  │              │            │       │                                      │
│  │              │   payment_allocations                                     │
│  │              │            │       │                                      │
│  │              └──> payments <──────┘                                      │
│  │                     │                                                     │
│  │         fee_carry_forwards                                               │
│  └───────────────────────────────────┘                                      │
│                                                                              │
│  ┌───────────────────────────────────┐                                      │
│  │       TRANSPORT LEDGER            │                                      │
│  │  transport_routes ──> assignments │                                      │
│  │                           │       │                                      │
│  │           transport_fees <┘       │                                      │
│  │                  │                │                                      │
│  │  transport_payment_allocations    │                                      │
│  └───────────────────────────────────┘                                      │
│                                                                              │
│  ┌───────────────────────────────────┐                                      │
│  │          POS LEDGER               │                                      │
│  │  inventory_items ──> pos_sales    │                                      │
│  │         │                 │       │                                      │
│  │  inventory_transactions   │       │                                      │
│  │                   pos_sale_items  │                                      │
│  └───────────────────────────────────┘                                      │
│                                                                              │
│  ┌───────────────────────────────────┐                                      │
│  │           AUDIT                   │                                      │
│  │  audit_logs                       │                                      │
│  │  finance_audit_logs (immutable)   │                                      │
│  └───────────────────────────────────┘                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Design Decisions

1. **`school_id` on all tenant tables** – Enables RLS for complete tenant isolation
2. **Computed columns for balances** – `GENERATED ALWAYS AS ... STORED` ensures consistency
3. **Separate ledgers** – Fees, Transport, POS each have dedicated allocation tables
4. **Payment allocations** – Supports partial payments across multiple fees
5. **Carry forward tracking** – Explicit table for arrears/credits between terms
6. **Immutable finance audit** – Separate table with no UPDATE/DELETE policies
7. **M-Pesa first-class support** – Dedicated table for transaction lifecycle tracking
8. **Denormalized fee descriptions** – Preserves historical context even if structure changes
