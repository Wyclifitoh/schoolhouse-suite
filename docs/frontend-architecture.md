# CHUO Frontend Architecture

## Technology Stack

```
Framework:      Next.js 14+ (App Router)
State:          TanStack Query (server state) + Zustand (client state)
Forms:          React Hook Form + Zod
UI:             shadcn/ui + Tailwind CSS
Auth:           Supabase Auth (SSR)
Real-time:      Supabase Realtime subscriptions
```

---

## Route Architecture

### Directory Structure

```
app/
├── (auth)/
│   ├── login/
│   ├── forgot-password/
│   └── reset-password/
│
├── (dashboard)/
│   ├── layout.tsx              # Authenticated shell with sidebar
│   ├── page.tsx                # Role-based redirect
│   │
│   ├── admin/                  # Super Admin routes
│   │   ├── schools/
│   │   ├── system-settings/
│   │   └── audit-logs/
│   │
│   ├── school/                 # School-scoped routes
│   │   ├── dashboard/
│   │   ├── students/
│   │   ├── staff/
│   │   ├── academic/
│   │   ├── finance/
│   │   ├── transport/
│   │   ├── pos/
│   │   ├── reports/
│   │   └── settings/
│   │
│   ├── teacher/
│   │   ├── dashboard/
│   │   ├── classes/
│   │   ├── gradebook/
│   │   └── attendance/
│   │
│   └── parent/
│       ├── dashboard/
│       ├── children/
│       ├── fees/
│       └── reports/
│
├── api/                        # API routes (Edge Functions proxy)
│   ├── mpesa/
│   │   ├── stk-push/
│   │   └── callback/
│   └── webhooks/
│
└── _components/                # Shared route components
```

---

## Role-Based Dashboards

### Dashboard Mapping

| Role | Primary Route | Dashboard Focus |
|------|---------------|-----------------|
| `super_admin` | `/admin/schools` | Multi-tenant overview, system health |
| `school_admin` | `/school/dashboard` | School KPIs, alerts, pending actions |
| `principal` | `/school/dashboard` | Academic & financial summary |
| `accountant` | `/school/finance/dashboard` | Revenue, collections, arrears |
| `bursar` | `/school/finance/payments` | Payment processing queue |
| `registrar` | `/school/students` | Enrollment pipeline |
| `teacher` | `/teacher/dashboard` | Class schedule, gradebook |
| `class_teacher` | `/teacher/classes/[id]` | Class management, attendance |
| `librarian` | `/school/library` | Book inventory, loans |
| `transport_manager` | `/school/transport` | Routes, vehicles, billing |
| `pos_operator` | `/school/pos/terminal` | Point-of-sale interface |
| `parent` | `/parent/dashboard` | Children overview, fee status |

### Role Redirect Logic

```typescript
// app/(dashboard)/page.tsx
export default async function DashboardRedirect() {
  const { user, roles } = await getAuthSession();
  
  const redirectMap: Record<AppRole, string> = {
    super_admin: '/admin/schools',
    school_admin: '/school/dashboard',
    principal: '/school/dashboard',
    accountant: '/school/finance/dashboard',
    bursar: '/school/finance/payments',
    registrar: '/school/students',
    teacher: '/teacher/dashboard',
    class_teacher: '/teacher/dashboard',
    librarian: '/school/library',
    transport_manager: '/school/transport',
    pos_operator: '/school/pos/terminal',
    parent: '/parent/dashboard',
  };

  // Use highest-privilege role for redirect
  const primaryRole = getPrimaryRole(roles);
  redirect(redirectMap[primaryRole] || '/school/dashboard');
}
```

---

## Data Flow Architecture

### Layer Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Pages     │  │ Components  │  │    Hooks            │  │
│  │  (Server)   │──│  (Client)   │──│  useStudentFees()   │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │             │
│  ┌──────▼────────────────▼─────────────────────▼──────────┐ │
│  │                  TanStack Query                         │ │
│  │     queryClient.prefetch() ←→ useQuery/useMutation     │ │
│  └─────────────────────────┬───────────────────────────────┘ │
├────────────────────────────┼────────────────────────────────┤
│                            │                                 │
│  ┌─────────────────────────▼───────────────────────────────┐ │
│  │                   API Layer                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │ │
│  │  │ Supabase     │  │ Edge         │  │ External      │  │ │
│  │  │ Client       │  │ Functions    │  │ APIs          │  │ │
│  │  │ (direct)     │  │ (complex)    │  │ (M-Pesa)      │  │ │
│  │  └──────────────┘  └──────────────┘  └───────────────┘  │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    Supabase                           │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────┐  │   │
│  │  │ PostgreSQL │  │ Auth       │  │ Edge Functions │  │   │
│  │  │ + RLS      │  │ (JWT)      │  │ (Deno)         │  │   │
│  │  └────────────┘  └────────────┘  └────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Data Fetching Patterns

#### 1. Server Components (Initial Load)

```typescript
// app/(dashboard)/school/students/page.tsx
import { createServerClient } from '@/lib/supabase/server';
import { StudentsTable } from './_components/students-table';

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string };
}) {
  const supabase = createServerClient();
  const schoolId = await getCurrentSchoolId();

  const { data: students, count } = await supabase
    .from('students')
    .select('*, current_class:classes(*)', { count: 'exact' })
    .eq('school_id', schoolId)
    .ilike('full_name', `%${searchParams.search || ''}%`)
    .range(
      (Number(searchParams.page || 1) - 1) * 20,
      Number(searchParams.page || 1) * 20 - 1
    );

  return <StudentsTable initialData={students} totalCount={count} />;
}
```

#### 2. Client Queries (Interactive Updates)

```typescript
// hooks/use-student-fees.ts
export function useStudentFees(studentId: string) {
  const schoolId = useSchoolId();

  return useQuery({
    queryKey: ['student-fees', studentId, schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_fees')
        .select(`
          *,
          fee_template:fee_templates(*),
          allocations:payment_allocations(*)
        `)
        .eq('student_id', studentId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data;
    },
    staleTime: 30_000, // 30 seconds
  });
}
```

#### 3. Mutations with Optimistic Updates

```typescript
// hooks/use-record-payment.ts
export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: PaymentInput) => {
      const { data, error } = await supabase.functions.invoke(
        'process-payment',
        { body: payment }
      );
      if (error) throw error;
      return data;
    },
    onMutate: async (newPayment) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['student-fees', newPayment.student_id],
      });

      // Snapshot previous value
      const previousFees = queryClient.getQueryData([
        'student-fees',
        newPayment.student_id,
      ]);

      // Optimistically update (mark as processing)
      queryClient.setQueryData(
        ['student-fees', newPayment.student_id],
        (old: StudentFee[]) =>
          old.map((fee) => ({
            ...fee,
            _optimisticPayment: newPayment.amount,
          }))
      );

      return { previousFees };
    },
    onError: (err, newPayment, context) => {
      // Rollback on error
      queryClient.setQueryData(
        ['student-fees', newPayment.student_id],
        context?.previousFees
      );
      toast.error('Payment failed. Please try again.');
    },
    onSettled: (data, error, variables) => {
      // Always refetch after mutation
      queryClient.invalidateQueries({
        queryKey: ['student-fees', variables.student_id],
      });
      queryClient.invalidateQueries({
        queryKey: ['payments'],
      });
    },
  });
}
```

#### 4. Real-time Subscriptions

```typescript
// hooks/use-payment-notifications.ts
export function usePaymentNotifications(schoolId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`payments:${schoolId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payments',
          filter: `school_id=eq.${schoolId}`,
        },
        (payload) => {
          // Invalidate relevant queries
          queryClient.invalidateQueries({
            queryKey: ['student-fees', payload.new.student_id],
          });
          queryClient.invalidateQueries({
            queryKey: ['daily-collections'],
          });

          // Show toast notification
          toast.success(
            `Payment received: KES ${payload.new.amount.toLocaleString()}`
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [schoolId, queryClient]);
}
```

---

## School Context Management

### Multi-Tenancy on Frontend

```typescript
// providers/school-context.tsx
interface SchoolContextValue {
  currentSchool: School | null;
  schools: School[];
  switchSchool: (schoolId: string) => void;
  isLoading: boolean;
}

export function SchoolProvider({ children }: { children: React.ReactNode }) {
  const [currentSchoolId, setCurrentSchoolId] = useLocalStorage<string | null>(
    'current-school-id',
    null
  );

  const { data: schools, isLoading } = useQuery({
    queryKey: ['accessible-schools'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_accessible_schools');
      return data as School[];
    },
  });

  // Auto-select first school if none selected
  useEffect(() => {
    if (!currentSchoolId && schools?.length) {
      setCurrentSchoolId(schools[0].id);
    }
  }, [schools, currentSchoolId]);

  const currentSchool = schools?.find((s) => s.id === currentSchoolId) || null;

  return (
    <SchoolContext.Provider
      value={{
        currentSchool,
        schools: schools || [],
        switchSchool: setCurrentSchoolId,
        isLoading,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
}
```

### Request Headers for API Calls

```typescript
// lib/supabase/client.ts
export function createClientWithSchool(schoolId: string) {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          'X-School-ID': schoolId,
        },
      },
    }
  );
}
```

---

## Finance Module Routes

### Route Structure

```
app/(dashboard)/school/finance/
├── dashboard/
│   └── page.tsx                # Revenue overview, KPIs
│
├── fee-structures/
│   ├── page.tsx                # Template list
│   ├── new/page.tsx            # Create template
│   └── [id]/
│       ├── page.tsx            # View/edit template
│       └── assign/page.tsx     # Bulk assignment
│
├── student-fees/
│   ├── page.tsx                # All student fees grid
│   └── [studentId]/
│       └── page.tsx            # Individual student ledger
│
├── payments/
│   ├── page.tsx                # Payment queue/history
│   ├── record/page.tsx         # Manual payment form
│   └── [id]/page.tsx           # Payment details + receipt
│
├── arrears/
│   └── page.tsx                # Arrears management
│
├── carry-forward/
│   └── page.tsx                # Credit management
│
├── adjustments/
│   ├── page.tsx                # Adjustment history
│   └── request/page.tsx        # Request adjustment
│
├── reports/
│   ├── collections/page.tsx    # Daily/weekly/monthly
│   ├── outstanding/page.tsx    # Arrears report
│   ├── projections/page.tsx    # Revenue forecast
│   └── audit/page.tsx          # Finance audit trail
│
└── settings/
    ├── page.tsx                # Finance config
    ├── discounts/page.tsx      # Discount rules
    └── payment-methods/page.tsx
```

---

## Finance-Critical Screens & Safeguards

### 1. Payment Recording Screen

**Route:** `/school/finance/payments/record`

**Safeguards:**
```typescript
// Confirmation dialog with amount verification
interface PaymentConfirmation {
  step: 1 | 2 | 3;
  // Step 1: Enter details
  // Step 2: Verify allocation preview
  // Step 3: Confirm with re-auth
}

// Double-entry confirmation
const PaymentConfirmDialog = ({ payment, onConfirm }) => {
  const [confirmAmount, setConfirmAmount] = useState('');
  
  return (
    <Dialog>
      <DialogContent>
        <div className="space-y-4">
          <Alert variant="warning">
            <AlertTitle>Verify Payment Details</AlertTitle>
            <AlertDescription>
              This action cannot be undone. Please verify all details.
            </AlertDescription>
          </Alert>
          
          {/* Allocation preview */}
          <AllocationPreview fees={payment.allocationPreview} />
          
          {/* Re-type amount to confirm */}
          <div>
            <Label>Type the amount to confirm: KES {payment.amount}</Label>
            <Input
              value={confirmAmount}
              onChange={(e) => setConfirmAmount(e.target.value)}
              placeholder="Enter amount"
            />
          </div>
          
          <Button
            disabled={confirmAmount !== payment.amount.toString()}
            onClick={onConfirm}
          >
            Confirm Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

### 2. Fee Adjustment Screen

**Route:** `/school/finance/adjustments/request`

**Safeguards:**
```typescript
// Multi-level approval workflow
interface AdjustmentRequest {
  id: string;
  student_id: string;
  fee_id: string;
  adjustment_type: 'discount' | 'waiver' | 'correction';
  amount: number;
  reason: string;
  supporting_documents: string[];
  
  // Approval chain
  requested_by: string;
  requested_at: Date;
  
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  approved_at: Date | null;
  approval_notes: string | null;
}

// Mandatory fields
const adjustmentSchema = z.object({
  fee_id: z.string().uuid(),
  adjustment_type: z.enum(['discount', 'waiver', 'correction']),
  amount: z.number().positive(),
  reason: z.string().min(20, 'Please provide detailed reason (min 20 chars)'),
  supporting_documents: z.array(z.string()).min(1, 'At least one document required'),
});

// Permission check
const canApproveAdjustments = usePermission('finance:adjustments:approve');
const canRequestAdjustments = usePermission('finance:adjustments:create');
```

### 3. Bulk Fee Assignment

**Route:** `/school/finance/fee-structures/[id]/assign`

**Safeguards:**
```typescript
// Preview before commit
const BulkAssignmentFlow = () => {
  const [step, setStep] = useState<'select' | 'preview' | 'confirm'>('select');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [preview, setPreview] = useState<AssignmentPreview | null>(null);

  // Generate preview without committing
  const generatePreview = useMutation({
    mutationFn: async (data) => {
      return supabase.functions.invoke('preview-fee-assignment', {
        body: { ...data, dry_run: true },
      });
    },
  });

  // Actual assignment
  const commitAssignment = useMutation({
    mutationFn: async (data) => {
      return supabase.functions.invoke('assign-fees-bulk', {
        body: data,
      });
    },
    onSuccess: () => {
      toast.success(`Fees assigned to ${selectedStudents.length} students`);
    },
  });

  return (
    <div>
      {step === 'preview' && (
        <Card>
          <CardHeader>
            <CardTitle>Assignment Preview</CardTitle>
            <CardDescription>
              Review before confirming. This will create{' '}
              {preview?.totalAssignments} fee records.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Show conflicts */}
            {preview?.conflicts.length > 0 && (
              <Alert variant="destructive">
                <AlertTitle>
                  {preview.conflicts.length} conflicts detected
                </AlertTitle>
                <ul>
                  {preview.conflicts.map((c) => (
                    <li key={c.studentId}>{c.reason}</li>
                  ))}
                </ul>
              </Alert>
            )}
            
            {/* Summary table */}
            <AssignmentSummaryTable data={preview?.assignments} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
```

### 4. Term Transition / Carry Forward

**Route:** `/school/finance/carry-forward`

**Safeguards:**
```typescript
// Irreversible action protection
const TermTransitionWizard = () => {
  const [confirmText, setConfirmText] = useState('');
  const CONFIRMATION_PHRASE = 'CLOSE TERM 2024-T1';

  return (
    <div className="space-y-6">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Irreversible Action</AlertTitle>
        <AlertDescription>
          Closing this term will:
          <ul className="list-disc pl-4 mt-2">
            <li>Calculate and lock all arrears</li>
            <li>Generate carry-forward credits</li>
            <li>Prevent further payments to current term fees</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Pre-close validation */}
      <PreCloseValidation
        checks={[
          { label: 'All M-Pesa callbacks processed', status: 'passed' },
          { label: 'No pending adjustments', status: 'passed' },
          { label: 'Unmatched payments resolved', status: 'warning' },
        ]}
      />

      {/* Type to confirm */}
      <div>
        <Label>Type "{CONFIRMATION_PHRASE}" to proceed</Label>
        <Input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
        />
      </div>

      <Button
        variant="destructive"
        disabled={confirmText !== CONFIRMATION_PHRASE}
      >
        Close Term & Process Carry Forward
      </Button>
    </div>
  );
};
```

### 5. Void/Reverse Payment

**Route:** Modal on `/school/finance/payments/[id]`

**Safeguards:**
```typescript
// Requires elevated permission + reason
const VoidPaymentDialog = ({ payment }) => {
  const hasPermission = usePermission('finance:payments:void');
  const [reason, setReason] = useState('');
  const [reAuthPassword, setReAuthPassword] = useState('');

  const voidPayment = useMutation({
    mutationFn: async () => {
      // Re-authenticate before void
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: reAuthPassword,
      });
      
      if (authError) throw new Error('Re-authentication failed');

      return supabase.functions.invoke('void-payment', {
        body: {
          payment_id: payment.id,
          reason,
          void_type: 'reversal', // or 'correction'
        },
      });
    },
  });

  if (!hasPermission) {
    return (
      <Alert>
        <AlertTitle>Insufficient Permissions</AlertTitle>
        <AlertDescription>
          Contact a finance administrator to void this payment.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Void Payment</DialogTitle>
          <DialogDescription>
            This will reverse all allocations and update student balances.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            label="Reason for voiding (required)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            minLength={20}
          />

          <Input
            type="password"
            label="Enter your password to confirm"
            value={reAuthPassword}
            onChange={(e) => setReAuthPassword(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button
            variant="destructive"
            disabled={reason.length < 20 || !reAuthPassword}
            onClick={() => voidPayment.mutate()}
          >
            Void Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

---

## Permission-Based UI Rendering

### Permission Hook

```typescript
// hooks/use-permission.ts
export function usePermission(permission: PermissionCode): boolean {
  const { permissions } = useAuth();
  return permissions.includes(permission) || permissions.includes('*');
}

export function usePermissions(permissions: PermissionCode[]): boolean[] {
  const { permissions: userPermissions } = useAuth();
  return permissions.map(
    (p) => userPermissions.includes(p) || userPermissions.includes('*')
  );
}
```

### Permission Gate Component

```typescript
// components/permission-gate.tsx
interface PermissionGateProps {
  permission: PermissionCode | PermissionCode[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGate({
  permission,
  fallback = null,
  children,
}: PermissionGateProps) {
  const permissions = Array.isArray(permission) ? permission : [permission];
  const hasPermission = permissions.some((p) => usePermission(p));

  if (!hasPermission) return fallback;
  return children;
}

// Usage
<PermissionGate permission="finance:payments:void">
  <Button variant="destructive">Void Payment</Button>
</PermissionGate>
```

### Route Protection Middleware

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

const ROUTE_PERMISSIONS: Record<string, PermissionCode[]> = {
  '/school/finance': ['finance:view'],
  '/school/finance/payments/record': ['finance:payments:create'],
  '/school/finance/adjustments': ['finance:adjustments:view'],
  '/admin': ['system:admin'],
};

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check route permissions
  const pathname = request.nextUrl.pathname;
  const requiredPermissions = Object.entries(ROUTE_PERMISSIONS).find(
    ([route]) => pathname.startsWith(route)
  )?.[1];

  if (requiredPermissions) {
    const schoolId = request.headers.get('X-School-ID');
    const { data: hasAccess } = await supabase.rpc('has_any_permission', {
      _permissions: requiredPermissions,
      _school_id: schoolId,
    });

    if (!hasAccess) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return response;
}
```

---

## Error Handling Strategy

### Global Error Boundary

```typescript
// app/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error tracking service
    captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            {error.message || 'An unexpected error occurred'}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={reset}>Try again</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
```

### Finance-Specific Error Handling

```typescript
// lib/errors.ts
export class FinanceError extends Error {
  constructor(
    message: string,
    public code: FinanceErrorCode,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'FinanceError';
  }
}

export type FinanceErrorCode =
  | 'INSUFFICIENT_BALANCE'
  | 'DUPLICATE_PAYMENT'
  | 'ALLOCATION_FAILED'
  | 'TERM_CLOSED'
  | 'STUDENT_INACTIVE'
  | 'PERMISSION_DENIED';

// Error display component
const FinanceErrorAlert = ({ error }: { error: FinanceError }) => {
  const errorMessages: Record<FinanceErrorCode, string> = {
    INSUFFICIENT_BALANCE: 'Payment exceeds outstanding balance',
    DUPLICATE_PAYMENT: 'This payment has already been recorded',
    ALLOCATION_FAILED: 'Could not allocate payment to fees',
    TERM_CLOSED: 'Cannot modify closed term records',
    STUDENT_INACTIVE: 'Student account is inactive',
    PERMISSION_DENIED: 'You do not have permission for this action',
  };

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Transaction Failed</AlertTitle>
      <AlertDescription>
        {errorMessages[error.code] || error.message}
      </AlertDescription>
    </Alert>
  );
};
```

---

## Offline Support (Future Enhancement)

```typescript
// Service worker registration for critical paths
const OFFLINE_CAPABLE_ROUTES = [
  '/school/pos/terminal',      // POS must work offline
  '/teacher/attendance',       // Attendance marking
];

// IndexedDB for offline queue
interface OfflineTransaction {
  id: string;
  type: 'payment' | 'attendance';
  payload: unknown;
  created_at: Date;
  synced: boolean;
}

// Sync when online
const syncOfflineTransactions = async () => {
  const pending = await db.transactions.where('synced').equals(false).toArray();
  
  for (const tx of pending) {
    try {
      await supabase.functions.invoke('sync-offline-transaction', {
        body: tx,
      });
      await db.transactions.update(tx.id, { synced: true });
    } catch (error) {
      console.error('Sync failed:', tx.id, error);
    }
  }
};
```

---

## Summary

| Aspect | Approach |
|--------|----------|
| **Routing** | Next.js App Router with role-based layouts |
| **Data Fetching** | Server Components + TanStack Query |
| **State** | Zustand for client, Query cache for server |
| **Multi-tenancy** | School context + X-School-ID header |
| **Auth** | Supabase SSR + middleware protection |
| **Finance Safety** | Multi-step confirmation, re-auth, audit trails |
| **Permissions** | Hook-based checks + PermissionGate component |
| **Real-time** | Supabase channels for payment notifications |
