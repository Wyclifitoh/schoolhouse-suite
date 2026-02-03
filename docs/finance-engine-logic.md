# CHUO Finance Engine Logic

## Overview

The finance engine is the core subsystem responsible for all monetary calculations, payment processing, and balance tracking. It operates on three isolated ledgers (Fees, Transport, POS) with strict auditability requirements.

---

## 1. Fee Assignment Engine

### 1.1 Assignment Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    FEE ASSIGNMENT PIPELINE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Fee Template] ──► [Assignment Rules] ──► [Student Fee Record] │
│                           │                                     │
│                           ▼                                     │
│                   [Discount Engine]                             │
│                           │                                     │
│                           ▼                                     │
│                   [Final Amount Calculation]                    │
│                           │                                     │
│                           ▼                                     │
│                   [Audit Log Entry]                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Assignment Modes

| Mode | Trigger | Use Case |
|------|---------|----------|
| `bulk_auto` | Term start, new enrollment batch | Assign fees to all students in a grade/stream |
| `individual_auto` | New student enrollment | Auto-assign based on grade fee templates |
| `manual` | Admin action | Custom fee assignment, special cases |
| `retroactive` | Policy change | Apply fee adjustments to existing records |

### 1.3 Assignment Algorithm

```typescript
interface FeeAssignmentParams {
  studentId: string;
  feeTemplateId: string;
  academicYearId: string;
  termId: string;
  assignmentMode: 'bulk_auto' | 'individual_auto' | 'manual' | 'retroactive';
  overrideAmount?: number; // Only for manual mode
  effectiveDate?: Date;
}

async function assignFeeToStudent(params: FeeAssignmentParams): Promise<StudentFee> {
  // Step 1: Validate no duplicate assignment
  const existingFee = await checkExistingAssignment(
    params.studentId,
    params.feeTemplateId,
    params.termId
  );
  
  if (existingFee && params.assignmentMode !== 'retroactive') {
    throw new DuplicateAssignmentError(existingFee.id);
  }

  // Step 2: Get base amount from template
  const template = await getFeeTemplate(params.feeTemplateId);
  let baseAmount = params.overrideAmount ?? template.amount;

  // Step 3: Apply discounts (returns modified amount + discount records)
  const { finalAmount, appliedDiscounts } = await applyDiscounts(
    params.studentId,
    template,
    baseAmount
  );

  // Step 4: Check for brought-forward balance
  const broughtForward = await calculateBroughtForward(
    params.studentId,
    template.ledgerType,
    params.termId
  );

  // Step 5: Create student_fee record
  const studentFee = await createStudentFee({
    studentId: params.studentId,
    feeTemplateId: params.feeTemplateId,
    academicYearId: params.academicYearId,
    termId: params.termId,
    amountDue: finalAmount,
    broughtForwardAmount: broughtForward.arrears,
    broughtForwardCredit: broughtForward.credit,
    // balance is computed column: amountDue + broughtForwardAmount - broughtForwardCredit - amountPaid
    status: 'pending',
    assignedAt: params.effectiveDate ?? new Date(),
    assignedBy: getCurrentUserId(),
    assignmentMode: params.assignmentMode
  });

  // Step 6: Link discount records
  await linkDiscountsToFee(studentFee.id, appliedDiscounts);

  // Step 7: Audit log (immutable)
  await createFinanceAuditLog({
    action: 'FEE_ASSIGNED',
    entityType: 'student_fee',
    entityId: studentFee.id,
    studentId: params.studentId,
    amountAffected: finalAmount,
    metadata: {
      templateId: params.feeTemplateId,
      baseAmount,
      discountsApplied: appliedDiscounts,
      broughtForward,
      assignmentMode: params.assignmentMode
    }
  });

  return studentFee;
}
```

### 1.4 Bulk Assignment Transaction

```typescript
async function bulkAssignFees(
  gradeId: string,
  termId: string,
  feeTemplateIds: string[]
): Promise<BulkAssignmentResult> {
  const students = await getActiveStudentsInGrade(gradeId);
  const results: BulkAssignmentResult = {
    successful: [],
    failed: [],
    skipped: []
  };

  // Use database transaction for atomicity
  await db.transaction(async (tx) => {
    for (const student of students) {
      for (const templateId of feeTemplateIds) {
        try {
          const fee = await assignFeeToStudent({
            studentId: student.id,
            feeTemplateId: templateId,
            termId,
            assignmentMode: 'bulk_auto'
          }, tx);
          results.successful.push({ studentId: student.id, feeId: fee.id });
        } catch (error) {
          if (error instanceof DuplicateAssignmentError) {
            results.skipped.push({ studentId: student.id, reason: 'already_assigned' });
          } else {
            results.failed.push({ studentId: student.id, error: error.message });
          }
        }
      }
    }
  });

  return results;
}
```

---

## 2. Payment Processing Engine

### 2.1 Payment Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PAYMENT PROCESSING FLOW                         │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  [Payment Received] ──► [Validation] ──► [Allocation Engine]          │
│         │                                       │                      │
│         │                                       ▼                      │
│         │                          ┌─────────────────────────┐        │
│         │                          │   ALLOCATION STRATEGY   │        │
│         │                          ├─────────────────────────┤        │
│         │                          │ 1. Oldest arrears first │        │
│         │                          │ 2. Current term fees    │        │
│         │                          │ 3. Advance credit       │        │
│         │                          └─────────────────────────┘        │
│         │                                       │                      │
│         ▼                                       ▼                      │
│  [M-Pesa Callback] ──────────────► [Update Student Fees]              │
│                                             │                          │
│                                             ▼                          │
│                                    [Generate Receipt]                  │
│                                             │                          │
│                                             ▼                          │
│                                    [Audit Log + SMS]                   │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Partial Payment Allocation Algorithm

The core algorithm for handling partial payments across multiple outstanding fees:

```typescript
interface AllocationResult {
  allocations: PaymentAllocation[];
  remainingAmount: number; // Becomes advance credit if > 0
  fullyPaidFees: string[];
  partiallyPaidFees: string[];
}

async function allocatePayment(
  paymentId: string,
  studentId: string,
  amount: number,
  ledgerType: 'fees' | 'transport' | 'pos',
  allocationStrategy: 'fifo' | 'proportional' | 'manual' = 'fifo',
  manualAllocations?: ManualAllocation[]
): Promise<AllocationResult> {
  
  // Step 1: Get all outstanding fees for this student and ledger
  const outstandingFees = await getOutstandingFees(studentId, ledgerType);
  
  // Sort by priority: brought_forward first, then by due_date ASC (FIFO)
  outstandingFees.sort((a, b) => {
    // Arrears (brought forward) always first
    if (a.broughtForwardAmount > 0 && b.broughtForwardAmount === 0) return -1;
    if (b.broughtForwardAmount > 0 && a.broughtForwardAmount === 0) return 1;
    // Then by due date
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const allocations: PaymentAllocation[] = [];
  let remainingAmount = amount;
  const fullyPaidFees: string[] = [];
  const partiallyPaidFees: string[] = [];

  if (allocationStrategy === 'manual' && manualAllocations) {
    // Manual allocation mode - user specifies exact amounts per fee
    for (const manual of manualAllocations) {
      if (remainingAmount <= 0) break;
      
      const fee = outstandingFees.find(f => f.id === manual.feeId);
      if (!fee) continue;
      
      const allocatableAmount = Math.min(manual.amount, remainingAmount, fee.balance);
      
      allocations.push({
        paymentId,
        studentFeeId: fee.id,
        amount: allocatableAmount,
        allocatedAt: new Date()
      });
      
      remainingAmount -= allocatableAmount;
      
      if (allocatableAmount >= fee.balance) {
        fullyPaidFees.push(fee.id);
      } else {
        partiallyPaidFees.push(fee.id);
      }
    }
  } else {
    // FIFO allocation (default)
    for (const fee of outstandingFees) {
      if (remainingAmount <= 0) break;
      
      const allocatableAmount = Math.min(remainingAmount, fee.balance);
      
      allocations.push({
        paymentId,
        studentFeeId: fee.id,
        amount: allocatableAmount,
        allocatedAt: new Date()
      });
      
      remainingAmount -= allocatableAmount;
      
      if (allocatableAmount >= fee.balance) {
        fullyPaidFees.push(fee.id);
      } else {
        partiallyPaidFees.push(fee.id);
      }
    }
  }

  // Step 2: Persist allocations in transaction
  await db.transaction(async (tx) => {
    // Insert all allocation records
    await tx.insert(paymentAllocations).values(allocations);
    
    // Update student_fee.amount_paid for each affected fee
    for (const alloc of allocations) {
      await tx
        .update(studentFees)
        .set({
          amountPaid: sql`amount_paid + ${alloc.amount}`,
          status: sql`CASE 
            WHEN amount_paid + ${alloc.amount} >= amount_due + brought_forward_amount - brought_forward_credit 
            THEN 'paid' 
            ELSE 'partial' 
          END`,
          lastPaymentAt: new Date()
        })
        .where(eq(studentFees.id, alloc.studentFeeId));
    }
    
    // If remaining amount > 0, create advance credit record
    if (remainingAmount > 0) {
      await createAdvanceCredit(tx, studentId, ledgerType, remainingAmount, paymentId);
    }
  });

  return {
    allocations,
    remainingAmount,
    fullyPaidFees,
    partiallyPaidFees
  };
}
```

### 2.3 M-Pesa Integration Flow

```typescript
interface MpesaCallbackPayload {
  transactionId: string;
  resultCode: number;
  resultDesc: string;
  amount: number;
  phoneNumber: string;
  transactionDate: string;
  billRefNumber: string; // Contains student admission number
}

async function processMpesaCallback(payload: MpesaCallbackPayload): Promise<void> {
  // Step 1: Validate and find pending transaction
  const pendingTx = await findPendingMpesaTransaction(payload.transactionId);
  
  if (!pendingTx) {
    // Unknown transaction - log for manual review
    await logUnknownMpesaTransaction(payload);
    return;
  }

  // Step 2: Update M-Pesa transaction status
  await updateMpesaTransactionStatus(pendingTx.id, {
    status: payload.resultCode === 0 ? 'completed' : 'failed',
    resultCode: payload.resultCode,
    resultDesc: payload.resultDesc,
    completedAt: new Date()
  });

  if (payload.resultCode !== 0) {
    // Payment failed - notify student/parent
    await sendPaymentFailedNotification(pendingTx.studentId, payload.resultDesc);
    return;
  }

  // Step 3: Create payment record
  const payment = await createPayment({
    studentId: pendingTx.studentId,
    schoolId: pendingTx.schoolId,
    amount: payload.amount,
    paymentMethod: 'mpesa',
    referenceNumber: payload.transactionId,
    ledgerType: pendingTx.ledgerType,
    status: 'completed',
    receivedAt: new Date(payload.transactionDate),
    metadata: {
      phoneNumber: payload.phoneNumber,
      billRefNumber: payload.billRefNumber,
      mpesaTransactionId: pendingTx.id
    }
  });

  // Step 4: Allocate payment to fees
  const allocation = await allocatePayment(
    payment.id,
    pendingTx.studentId,
    payload.amount,
    pendingTx.ledgerType
  );

  // Step 5: Generate and store receipt
  const receipt = await generateReceipt(payment.id, allocation);

  // Step 6: Send confirmation SMS
  await sendPaymentConfirmationSMS(pendingTx.studentId, {
    amount: payload.amount,
    receiptNumber: receipt.number,
    newBalance: await calculateStudentBalance(pendingTx.studentId, pendingTx.ledgerType)
  });

  // Step 7: Audit log
  await createFinanceAuditLog({
    action: 'PAYMENT_RECEIVED',
    entityType: 'payment',
    entityId: payment.id,
    studentId: pendingTx.studentId,
    amountAffected: payload.amount,
    metadata: {
      source: 'mpesa_callback',
      allocations: allocation.allocations,
      advanceCredit: allocation.remainingAmount
    }
  });
}
```

---

## 3. Carry Forward Engine (Advance Fees)

### 3.1 Carry Forward Logic

Carry forward handles **overpayments** or **advance payments** that should credit future terms.

```typescript
interface CarryForwardRecord {
  id: string;
  studentId: string;
  schoolId: string;
  ledgerType: 'fees' | 'transport' | 'pos';
  fromTermId: string;
  toTermId: string | null; // null = not yet applied
  amount: number;
  type: 'credit'; // Advance payment
  status: 'pending' | 'applied' | 'refunded';
  sourcePaymentId: string;
  createdAt: Date;
  appliedAt: Date | null;
}

async function createAdvanceCredit(
  tx: Transaction,
  studentId: string,
  ledgerType: string,
  amount: number,
  sourcePaymentId: string
): Promise<CarryForwardRecord> {
  const currentTerm = await getCurrentTerm(studentId);
  
  const record = await tx.insert(feeCarryForwards).values({
    studentId,
    schoolId: await getStudentSchoolId(studentId),
    ledgerType,
    fromTermId: currentTerm.id,
    toTermId: null, // Will be set when applied
    amount,
    type: 'credit',
    status: 'pending',
    sourcePaymentId,
    createdAt: new Date()
  }).returning();

  await createFinanceAuditLog({
    action: 'ADVANCE_CREDIT_CREATED',
    entityType: 'carry_forward',
    entityId: record.id,
    studentId,
    amountAffected: amount,
    metadata: { sourcePaymentId, ledgerType }
  });

  return record;
}
```

### 3.2 Applying Carry Forward at Term Start

```typescript
async function applyCarryForwardsForNewTerm(
  termId: string
): Promise<ApplyCarryForwardResult> {
  const previousTerm = await getPreviousTerm(termId);
  
  // Get all pending credits from previous term
  const pendingCredits = await db
    .select()
    .from(feeCarryForwards)
    .where(
      and(
        eq(feeCarryForwards.fromTermId, previousTerm.id),
        eq(feeCarryForwards.status, 'pending'),
        eq(feeCarryForwards.type, 'credit')
      )
    );

  const results: ApplyCarryForwardResult = {
    applied: [],
    failed: []
  };

  for (const credit of pendingCredits) {
    try {
      await db.transaction(async (tx) => {
        // Mark carry forward as applied
        await tx
          .update(feeCarryForwards)
          .set({
            toTermId: termId,
            status: 'applied',
            appliedAt: new Date()
          })
          .where(eq(feeCarryForwards.id, credit.id));

        // The credit will be picked up by brought_forward_credit 
        // when fees are assigned for the new term
        
        results.applied.push({
          studentId: credit.studentId,
          amount: credit.amount
        });
      });
    } catch (error) {
      results.failed.push({
        studentId: credit.studentId,
        error: error.message
      });
    }
  }

  return results;
}
```

---

## 4. Brought Forward Engine (Arrears)

### 4.1 Arrears Calculation

Brought forward handles **unpaid balances** from previous terms.

```typescript
interface BroughtForwardResult {
  arrears: number;    // Unpaid amount to add to new term
  credit: number;     // Advance credit to subtract from new term
  details: BroughtForwardDetail[];
}

async function calculateBroughtForward(
  studentId: string,
  ledgerType: string,
  newTermId: string
): Promise<BroughtForwardResult> {
  const previousTerm = await getPreviousTerm(newTermId);
  
  if (!previousTerm) {
    // First term - no brought forward
    return { arrears: 0, credit: 0, details: [] };
  }

  // Calculate unpaid fees from previous term
  const unpaidFees = await db
    .select({
      feeId: studentFees.id,
      templateName: feeTemplates.name,
      balance: studentFees.balance
    })
    .from(studentFees)
    .innerJoin(feeTemplates, eq(studentFees.feeTemplateId, feeTemplates.id))
    .where(
      and(
        eq(studentFees.studentId, studentId),
        eq(feeTemplates.ledgerType, ledgerType),
        eq(studentFees.termId, previousTerm.id),
        gt(studentFees.balance, 0)
      )
    );

  const totalArrears = unpaidFees.reduce((sum, fee) => sum + fee.balance, 0);

  // Calculate available credits
  const credits = await db
    .select()
    .from(feeCarryForwards)
    .where(
      and(
        eq(feeCarryForwards.studentId, studentId),
        eq(feeCarryForwards.ledgerType, ledgerType),
        eq(feeCarryForwards.status, 'applied'),
        eq(feeCarryForwards.toTermId, newTermId)
      )
    );

  const totalCredit = credits.reduce((sum, c) => sum + c.amount, 0);

  // Create brought forward record if arrears exist
  if (totalArrears > 0) {
    await db.insert(feeCarryForwards).values({
      studentId,
      schoolId: await getStudentSchoolId(studentId),
      ledgerType,
      fromTermId: previousTerm.id,
      toTermId: newTermId,
      amount: totalArrears,
      type: 'arrears',
      status: 'applied',
      createdAt: new Date(),
      appliedAt: new Date()
    });

    await createFinanceAuditLog({
      action: 'ARREARS_BROUGHT_FORWARD',
      entityType: 'carry_forward',
      entityId: null,
      studentId,
      amountAffected: totalArrears,
      metadata: {
        fromTermId: previousTerm.id,
        toTermId: newTermId,
        unpaidFees: unpaidFees.map(f => ({ id: f.feeId, name: f.templateName, balance: f.balance }))
      }
    });
  }

  return {
    arrears: totalArrears,
    credit: totalCredit,
    details: unpaidFees.map(f => ({
      feeId: f.feeId,
      feeName: f.templateName,
      amount: f.balance
    }))
  };
}
```

---

## 5. Discount and Adjustment Engine

### 5.1 Discount Types

| Type | Application | Example |
|------|-------------|---------|
| `percentage` | Reduces fee by X% | 10% sibling discount |
| `fixed_amount` | Reduces fee by fixed KES | KES 5,000 scholarship |
| `fee_waiver` | Removes entire fee | Staff child fee waiver |
| `conditional` | Applied if criteria met | Early payment discount |

### 5.2 Discount Application Algorithm

```typescript
interface DiscountResult {
  finalAmount: number;
  appliedDiscounts: AppliedDiscount[];
  rejectedDiscounts: RejectedDiscount[];
}

async function applyDiscounts(
  studentId: string,
  feeTemplate: FeeTemplate,
  baseAmount: number
): Promise<DiscountResult> {
  const student = await getStudentWithRelations(studentId);
  const eligibleDiscounts = await getEligibleDiscounts(studentId, feeTemplate.id);
  
  let currentAmount = baseAmount;
  const appliedDiscounts: AppliedDiscount[] = [];
  const rejectedDiscounts: RejectedDiscount[] = [];

  // Sort discounts by priority (lower number = higher priority)
  eligibleDiscounts.sort((a, b) => a.priority - b.priority);

  for (const discount of eligibleDiscounts) {
    // Check if discount is still applicable after previous discounts
    if (!isDiscountApplicable(discount, currentAmount, appliedDiscounts)) {
      rejectedDiscounts.push({
        discountId: discount.id,
        reason: 'Not applicable after previous discounts'
      });
      continue;
    }

    // Evaluate conditional discounts
    if (discount.type === 'conditional') {
      const conditionMet = await evaluateDiscountCondition(
        discount.condition,
        student,
        feeTemplate
      );
      if (!conditionMet) {
        rejectedDiscounts.push({
          discountId: discount.id,
          reason: `Condition not met: ${discount.conditionDescription}`
        });
        continue;
      }
    }

    // Calculate discount amount
    let discountAmount: number;
    switch (discount.type) {
      case 'percentage':
        discountAmount = currentAmount * (discount.value / 100);
        break;
      case 'fixed_amount':
        discountAmount = Math.min(discount.value, currentAmount);
        break;
      case 'fee_waiver':
        discountAmount = currentAmount;
        break;
      default:
        discountAmount = 0;
    }

    // Apply stacking rules
    if (!discount.stackable && appliedDiscounts.length > 0) {
      rejectedDiscounts.push({
        discountId: discount.id,
        reason: 'Non-stackable discount, another already applied'
      });
      continue;
    }

    currentAmount -= discountAmount;
    currentAmount = Math.max(0, currentAmount); // Never go negative

    appliedDiscounts.push({
      discountId: discount.id,
      discountName: discount.name,
      type: discount.type,
      originalValue: discount.value,
      calculatedAmount: discountAmount,
      appliedAt: new Date()
    });

    // Check if fee is fully waived
    if (currentAmount === 0) break;
  }

  return {
    finalAmount: currentAmount,
    appliedDiscounts,
    rejectedDiscounts
  };
}

// Condition evaluator for conditional discounts
async function evaluateDiscountCondition(
  condition: DiscountCondition,
  student: Student,
  feeTemplate: FeeTemplate
): Promise<boolean> {
  switch (condition.type) {
    case 'sibling_enrolled':
      return await hasSiblingEnrolled(student.parentId, student.id);
    
    case 'early_payment':
      const daysBeforeDue = condition.params.daysBeforeDue;
      return new Date() < addDays(feeTemplate.dueDate, -daysBeforeDue);
    
    case 'staff_child':
      return await isStaffChild(student.parentId);
    
    case 'scholarship':
      return await hasActiveScholarship(student.id, feeTemplate.academicYearId);
    
    case 'custom_sql':
      // Dangerous but powerful - run custom SQL condition
      return await evaluateCustomCondition(condition.params.sql, student.id);
    
    default:
      return false;
  }
}
```

### 5.3 Manual Adjustments

```typescript
interface FeeAdjustment {
  studentFeeId: string;
  adjustmentType: 'increase' | 'decrease' | 'waive';
  amount: number;
  reason: string;
  approvedBy: string;
  requiresApproval: boolean;
}

async function applyFeeAdjustment(adjustment: FeeAdjustment): Promise<void> {
  const fee = await getStudentFee(adjustment.studentFeeId);
  
  // Validate adjustment
  if (adjustment.adjustmentType === 'decrease' && adjustment.amount > fee.amountDue) {
    throw new InvalidAdjustmentError('Decrease amount exceeds fee due');
  }

  // Check approval requirements
  if (adjustment.requiresApproval) {
    const approver = await getUser(adjustment.approvedBy);
    if (!approver.hasPermission('finance:adjustments:approve')) {
      throw new UnauthorizedError('Approver lacks permission');
    }
  }

  await db.transaction(async (tx) => {
    let newAmountDue: number;
    
    switch (adjustment.adjustmentType) {
      case 'increase':
        newAmountDue = fee.amountDue + adjustment.amount;
        break;
      case 'decrease':
        newAmountDue = fee.amountDue - adjustment.amount;
        break;
      case 'waive':
        newAmountDue = 0;
        break;
    }

    // Update fee record
    await tx
      .update(studentFees)
      .set({
        amountDue: newAmountDue,
        adjustedAt: new Date(),
        adjustedBy: getCurrentUserId()
      })
      .where(eq(studentFees.id, adjustment.studentFeeId));

    // Create adjustment record
    await tx.insert(feeAdjustments).values({
      studentFeeId: adjustment.studentFeeId,
      previousAmount: fee.amountDue,
      newAmount: newAmountDue,
      adjustmentType: adjustment.adjustmentType,
      reason: adjustment.reason,
      approvedBy: adjustment.approvedBy,
      createdBy: getCurrentUserId(),
      createdAt: new Date()
    });

    // Immutable audit log
    await createFinanceAuditLog({
      action: 'FEE_ADJUSTED',
      entityType: 'student_fee',
      entityId: adjustment.studentFeeId,
      studentId: fee.studentId,
      amountAffected: adjustment.amount,
      previousValue: fee.amountDue,
      newValue: newAmountDue,
      metadata: {
        adjustmentType: adjustment.adjustmentType,
        reason: adjustment.reason,
        approvedBy: adjustment.approvedBy
      }
    });
  });
}
```

---

## 6. Automation vs Manual Override Configuration

### 6.1 Configuration Schema

```typescript
interface FinanceAutomationConfig {
  schoolId: string;
  
  // Fee Assignment
  autoAssignFeesOnEnrollment: boolean;
  autoAssignFeesOnTermStart: boolean;
  requireApprovalForBulkAssignment: boolean;
  
  // Payment Processing
  autoAllocatePayments: boolean;
  defaultAllocationStrategy: 'fifo' | 'proportional';
  allowManualAllocation: boolean;
  
  // Carry Forward
  autoCarryForwardArrears: boolean;
  autoApplyAdvanceCredits: boolean;
  requireApprovalForCarryForward: boolean;
  
  // Discounts
  autoApplyEligibleDiscounts: boolean;
  allowManualDiscounts: boolean;
  requireApprovalForDiscounts: boolean;
  maxDiscountPercentWithoutApproval: number;
  
  // Adjustments
  allowFeeAdjustments: boolean;
  requireApprovalForAdjustments: boolean;
  maxAdjustmentWithoutApproval: number;
  
  // Notifications
  sendPaymentConfirmationSMS: boolean;
  sendBalanceReminderSMS: boolean;
  reminderDaysBeforeDue: number[];
}
```

### 6.2 Override Workflow

```typescript
async function processWithOverrideCheck<T>(
  operation: string,
  automaticAction: () => Promise<T>,
  config: FinanceAutomationConfig
): Promise<T | PendingApproval> {
  const isAutomatic = getAutomationFlag(config, operation);
  const requiresApproval = getApprovalFlag(config, operation);

  if (isAutomatic && !requiresApproval) {
    // Fully automatic - execute immediately
    return await automaticAction();
  }

  if (requiresApproval) {
    // Create pending approval request
    const approval = await createApprovalRequest({
      operation,
      requestedBy: getCurrentUserId(),
      data: await getOperationPreview(automaticAction),
      expiresAt: addDays(new Date(), 7)
    });
    
    return { pendingApproval: approval.id };
  }

  // Manual mode - operation must be triggered explicitly by user
  throw new ManualOperationRequiredError(operation);
}
```

---

## 7. Balance Calculation Engine

### 7.1 Real-Time Balance Query

```sql
-- Computed column in student_fees table
ALTER TABLE student_fees ADD COLUMN balance NUMERIC(12,2) 
GENERATED ALWAYS AS (
  amount_due 
  + COALESCE(brought_forward_amount, 0) 
  - COALESCE(brought_forward_credit, 0) 
  - COALESCE(amount_paid, 0)
) STORED;
```

### 7.2 Student Total Balance Function

```typescript
interface StudentBalance {
  studentId: string;
  ledgerType: 'fees' | 'transport' | 'pos';
  currentTermBalance: number;
  totalArrears: number;
  totalCredits: number;
  netBalance: number;
  breakdown: BalanceBreakdown[];
}

async function calculateStudentBalance(
  studentId: string,
  ledgerType: 'fees' | 'transport' | 'pos',
  asOfDate?: Date
): Promise<StudentBalance> {
  const effectiveDate = asOfDate ?? new Date();
  const currentTerm = await getCurrentTermAsOf(effectiveDate);

  // Current term fees
  const currentFees = await db
    .select({
      feeId: studentFees.id,
      feeName: feeTemplates.name,
      amountDue: studentFees.amountDue,
      amountPaid: studentFees.amountPaid,
      balance: studentFees.balance,
      dueDate: studentFees.dueDate,
      status: studentFees.status
    })
    .from(studentFees)
    .innerJoin(feeTemplates, eq(studentFees.feeTemplateId, feeTemplates.id))
    .where(
      and(
        eq(studentFees.studentId, studentId),
        eq(feeTemplates.ledgerType, ledgerType),
        eq(studentFees.termId, currentTerm.id)
      )
    );

  // Historical arrears (unpaid from previous terms)
  const arrears = await db
    .select({
      termName: terms.name,
      totalBalance: sql<number>`SUM(${studentFees.balance})`
    })
    .from(studentFees)
    .innerJoin(feeTemplates, eq(studentFees.feeTemplateId, feeTemplates.id))
    .innerJoin(terms, eq(studentFees.termId, terms.id))
    .where(
      and(
        eq(studentFees.studentId, studentId),
        eq(feeTemplates.ledgerType, ledgerType),
        lt(terms.endDate, currentTerm.startDate),
        gt(studentFees.balance, 0)
      )
    )
    .groupBy(terms.id, terms.name);

  // Available credits
  const credits = await db
    .select({
      amount: sql<number>`SUM(${feeCarryForwards.amount})`
    })
    .from(feeCarryForwards)
    .where(
      and(
        eq(feeCarryForwards.studentId, studentId),
        eq(feeCarryForwards.ledgerType, ledgerType),
        eq(feeCarryForwards.type, 'credit'),
        eq(feeCarryForwards.status, 'pending')
      )
    );

  const currentTermBalance = currentFees.reduce((sum, f) => sum + f.balance, 0);
  const totalArrears = arrears.reduce((sum, a) => sum + a.totalBalance, 0);
  const totalCredits = credits[0]?.amount ?? 0;

  return {
    studentId,
    ledgerType,
    currentTermBalance,
    totalArrears,
    totalCredits,
    netBalance: currentTermBalance + totalArrears - totalCredits,
    breakdown: currentFees.map(f => ({
      feeId: f.feeId,
      feeName: f.feeName,
      amountDue: f.amountDue,
      amountPaid: f.amountPaid,
      balance: f.balance,
      dueDate: f.dueDate,
      status: f.status
    }))
  };
}
```

### 7.3 Point-in-Time Balance (Historical)

```typescript
async function calculateHistoricalBalance(
  studentId: string,
  ledgerType: string,
  asOfDate: Date
): Promise<number> {
  // Sum of fees assigned before date
  const feesAsOf = await db
    .select({
      totalDue: sql<number>`SUM(${studentFees.amountDue})`
    })
    .from(studentFees)
    .innerJoin(feeTemplates, eq(studentFees.feeTemplateId, feeTemplates.id))
    .where(
      and(
        eq(studentFees.studentId, studentId),
        eq(feeTemplates.ledgerType, ledgerType),
        lte(studentFees.assignedAt, asOfDate)
      )
    );

  // Sum of payments received before date
  const paymentsAsOf = await db
    .select({
      totalPaid: sql<number>`SUM(${payments.amount})`
    })
    .from(payments)
    .where(
      and(
        eq(payments.studentId, studentId),
        eq(payments.ledgerType, ledgerType),
        eq(payments.status, 'completed'),
        lte(payments.receivedAt, asOfDate)
      )
    );

  return (feesAsOf[0]?.totalDue ?? 0) - (paymentsAsOf[0]?.totalPaid ?? 0);
}
```

---

## 8. Edge Cases and Error Handling

### 8.1 Critical Edge Cases

| Scenario | Handling |
|----------|----------|
| Payment exceeds all outstanding fees | Create advance credit record |
| Duplicate M-Pesa callback | Idempotency check on transaction ID |
| Fee assigned after payment received | Re-run allocation engine |
| Student transfers mid-term | Prorate fees, settle balance at source school |
| Discount removed after fee assigned | Recalculate fee, create adjustment record |
| Negative balance (overpayment) | Display as credit, auto-apply to next fee |
| Currency precision errors | Use NUMERIC(12,2), round at display only |
| Concurrent payment processing | Database-level locking on student_fee rows |

### 8.2 Transaction Isolation

```typescript
async function processPaymentWithLocking(
  paymentData: PaymentData
): Promise<PaymentResult> {
  return await db.transaction(async (tx) => {
    // Lock student fee rows to prevent concurrent modifications
    const fees = await tx
      .select()
      .from(studentFees)
      .where(eq(studentFees.studentId, paymentData.studentId))
      .for('update'); // Row-level lock

    // Process payment allocation
    const result = await allocatePayment(
      paymentData.paymentId,
      paymentData.studentId,
      paymentData.amount,
      paymentData.ledgerType
    );

    return result;
  }, {
    isolationLevel: 'serializable'
  });
}
```

---

## 9. Audit Trail Requirements

All financial operations MUST create immutable audit records:

```typescript
interface FinanceAuditEntry {
  id: string;
  schoolId: string;
  action: FinanceAuditAction;
  entityType: 'payment' | 'student_fee' | 'carry_forward' | 'adjustment' | 'discount';
  entityId: string;
  studentId: string;
  userId: string;
  amountAffected: number;
  previousValue?: any;
  newValue?: any;
  metadata: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  createdAt: Date; // Immutable
}

type FinanceAuditAction = 
  | 'FEE_ASSIGNED'
  | 'FEE_ADJUSTED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_REVERSED'
  | 'PAYMENT_ALLOCATED'
  | 'DISCOUNT_APPLIED'
  | 'DISCOUNT_REMOVED'
  | 'ARREARS_BROUGHT_FORWARD'
  | 'ADVANCE_CREDIT_CREATED'
  | 'ADVANCE_CREDIT_APPLIED'
  | 'REFUND_PROCESSED';
```

The `finance_audit_logs` table has **no UPDATE or DELETE policies** - records are immutable by design.
