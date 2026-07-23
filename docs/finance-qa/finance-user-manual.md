# CHUO Flow — Finance User Manual

> For Bursars, Accounts Clerks, Principals and School Administrators.
> No technical background required.

## Table of contents

1. Getting started
2. Setting up the school year and terms
3. Setting up your Chart of Accounts and Vote Heads
4. Building the Fee Structure
5. Assigning fees to students
6. Collecting fees (Cash, Bank, M-Pesa, Cheque, In-Kind)
7. Receipts
8. Student Fee Accounts and Statements
9. Expenses and Petty Cash
10. Suppliers and Procurement
11. Bank Accounts and Reconciliation
12. Budgets
13. Government Capitation
14. Assets
15. Financial Reports
16. The Bursar Dashboard
17. Audit Trail
18. Closing a Term or Period
19. Roles and Permissions
20. Frequently Asked Questions

---

## 1. Getting started

1. Open your school's CHUO Flow website (for example `usenge.chuoflow.co.ke`).
2. Enter your email and password.
3. In the top bar you will always see:
   - **School name** (left)
   - **Academic Year and Term switcher** (middle)
   - **Your name and logout** (right)

Everything you do in Finance is automatically scoped to the year and term
shown in the top bar. If you change the term, the pages reload to show that
term.

---

## 2. Setting up the school year and terms

### Create a year

1. Go to **Settings → Academic Years**.
2. Click **New Academic Year**.
3. Fill in:
   - Name: `2026`
   - Start date: `06 Jan 2026`
   - End date: `27 Nov 2026`
4. Click **Save**.

### Add three terms

1. Open the `2026` year.
2. Click **Add Term** three times and enter:
   - Term 1: `06 Jan – 04 Apr`
   - Term 2: `05 May – 08 Aug`
   - Term 3: `01 Sep – 27 Nov`
3. Click the **Activate** button next to the term you are currently in.

> **Tip.** You can only have one active term at a time. Everyone in the school
> works in that term until you switch.

---

## 3. Chart of Accounts and Vote Heads

### What are they?

- The **Chart of Accounts** is the master list of every "bucket" money can sit
  in — for example *Cash on Hand*, *KCB Bank*, *Tuition Income*, *Salaries*.
- A **Vote Head** is a friendly, everyday name for a fee or an expense line
  (Tuition, Boarding, Utilities). Each vote head is linked to accounts so the
  system can post the books for you automatically.

You will normally never need to change the Chart of Accounts. You will spend
most of your time creating vote heads.

### Create an income vote head (fee)

1. Go to **Finance → Vote Heads → New Vote Head**.
2. Type: **Income**.
3. Name: `Tuition`.
4. Income account: choose `Tuition Income`.
5. Receivable account: choose `Fees Receivable`.
6. Click **Save**.

Repeat for Boarding, Lunch, Transport, Activity, Development and Uniform.

### Create an expense vote head

1. Type: **Expense**.
2. Name: `Utilities`.
3. Expense account: `Utilities Expense`.
4. Save.

---

## 4. Building the Fee Structure

A **Fee Structure** is the price list for one (Class, Stream, Term). You can
have multiple structures per class if needed (e.g. day scholars vs boarders).

### Steps

1. **Finance → Fee Structures → New Structure**.
2. Choose Grade (e.g. *Form 1*), Stream (*Boarders*), Term (*2026 Term 2*).
3. Add lines:
   - Tuition — 10,000
   - Boarding — 8,000
   - Lunch — 2,000
   - Activity — 1,500
   - Development — 2,500
   - Uniform — 500
4. The total updates live: **KES 24,500**.
5. Click **Save**.

### Copy to another stream

Use **Copy to Stream** to duplicate the structure to *Day Scholars* and remove
the Boarding line.

---

## 5. Assigning fees to students

You have three ways:

1. **Assign to entire class** — from the structure page click **Assign to Class**.
2. **Bulk assignment wizard** — Finance → Fee Assignments → Bulk. Pick class,
   stream, structure, click Assign.
3. **Individual** — open a student → Fees tab → **Add Fee** → pick vote head.

### Discounts, bursaries and waivers

1. **Finance → Discounts → New Discount**: `Bursary 25%`, type Percentage.
2. Open a student → **Apply Discount** → pick `Bursary 25%`.
3. The balance drops immediately and the discount is recorded for audit.

---

## 6. Collecting fees

All payment methods live under **Finance → Fee Collection**.

### Cash

1. Find the student (name or admission number).
2. Click **Record Payment**.
3. Method: **Cash**. Amount: `10,000`. Deposit to: `Cash on Hand`.
4. Save. A receipt prints automatically.

### Bank deposit

Same as Cash but choose **Bank**, then the bank account (e.g. *KCB Usenge*)
and enter the deposit slip number.

### M-Pesa STK Push

1. Method: **M-Pesa STK**.
2. Confirm the parent's phone number.
3. Amount → **Send Prompt**.
4. Parent enters PIN on their phone. When Safaricom confirms, the receipt is
   created automatically.

### M-Pesa Paybill (C2B)

Parents pay directly to your Paybill/Till using the child's admission number
as account. Payments appear in Fee Collection automatically.

### Cheque

Method **Cheque** → enter cheque number and bank. On the day the cheque
clears, click **Confirm Clearance**.

### Payment in kind (goods for fees)

For rural schools that accept maize, milk, firewood, etc.:

1. Method: **In Kind**. Item: `Maize`. Quantity: 5 bags. Rate: 4,000.
2. Save as **Pending Approval**.
3. Principal opens Approvals → **Approve** → the value credits the student's
   account and adds inventory.

### Bulk import

Upload a CSV of payments (template provided in the app). The system validates
each row and shows errors before importing.

---

## 7. Receipts

- Every payment produces a **receipt** with a unique number.
- Reprint from **Fee Collection → row → Print / Email**.
- Emails and SMS are sent to the parent automatically when contact details are
  present.
- A voided receipt shows a big **VOID** watermark and cannot be reused.

---

## 8. Student Fee Accounts and Statements

**Finance → Student Accounts → search student.**

You see:

- Opening balance (brought forward from last term).
- All charges for the term.
- All payments and discounts.
- Running balance and status (Cleared / Owing / Overpaid).

Click **Download Statement** to get a PDF suitable for parents.

### Brought Forward

At the start of a new term:

1. **Finance → Brought Forward → Preview**.
2. Confirm the arrears list.
3. Click **Apply**. Each student's new-term account starts with the previous
   balance as opening.

---

## 9. Expenses and Petty Cash

### Recording an expense

1. **Finance → Expenses → New Expense**.
2. Vote head: `Utilities`. Payee: `KPLC`. Amount: `3,200`. Pay from: `KCB Usenge`.
3. Attach the receipt PDF/photo.
4. Save as **Draft**.

### Approval

The Principal opens **Expenses → Pending Approval** and clicks **Approve** or
**Reject**. Only on approval is money considered spent.

### Petty cash

1. **Petty Cash → Top-up** — move money from the bank to the petty cash box.
2. **Petty Cash → New Expense** — record small daily items.
3. The float always shows the remaining cash.

---

## 10. Suppliers and Procurement

### Suppliers

**Finance → Suppliers → New Supplier**: name, KRA PIN, phone, email, opening
balance. Each supplier gets its own account so you can see everything owed to
them.

### Full workflow

`Requisition → Purchase Order → Goods Received Note → Invoice → Payment Voucher → Paid`.

You can start at any step, but the recommended path for accountability is:

1. Teacher raises a **Requisition** (Stationery, 20,000).
2. Bursar creates a **PO** to Kisumu Stationers.
3. On delivery, store keeper marks **GRN** — inventory increases.
4. Bursar records the **Invoice** — supplier account credited.
5. Bursar creates a **Payment Voucher** → **Mark Paid** — bank debited.

---

## 11. Bank Accounts and Reconciliation

### Adding a bank

**Finance → Banks → New Bank Account**: name, account number, branch, opening
balance, GL account.

### Monthly reconciliation

1. Download the bank statement CSV from your bank portal.
2. **Bank Reconciliation → Import Statement**.
3. Click **Auto-Match** — the system matches by amount, reference and date.
4. Manually match anything left.
5. Once the closing balance on screen matches your bank statement, click
   **Complete Reconciliation**.

---

## 12. Budgets

1. **Finance → Budgets → New Budget** for the year and term.
2. Enter an amount per vote head (e.g. Utilities 40,000/term).
3. Choose an over-spend policy:
   - **Warn** — allow but warn.
   - **Block** — prevent saving expenses that would exceed budget.
4. As expenses are approved, actuals update live.

---

## 13. Government Capitation

1. **Finance → Capitation → Record Grant**: source `MoE`, amount `500,000`,
   date, bank account.
2. Allocate to vote heads per the BOM guidelines.
3. The system posts each allocation to the ledger, so all reports treat the
   capitation as income against the right heads.

---

## 14. Assets

1. **Finance → Assets → New Asset**: name (Toyota Hiace), cost, useful life,
   depreciation method.
2. Run **Monthly Depreciation** each month.
3. **Dispose** when you sell/write off — the system computes gain or loss.

---

## 15. Financial Reports

**Finance → Reports** contains:

- **Income Statement** — Revenue vs Expenses vs Surplus.
- **Balance Sheet** — Assets, Liabilities, Equity.
- **Trial Balance** — every account with its Dr / Cr totals.
- **Cash Book** — every bank / cash movement.
- **General Ledger** — filterable by any account.
- **Fee Collection Report** — collections by day / class / vote head.
- **AP Aging** — who you owe and how long.
- **Debtors** — who owes you.

All reports export as PDF and Excel.

---

## 16. Bursar Dashboard

Landing page for the Bursar. Shows:

- Collections MTD, Term Surplus, Unallocated payments, Live bank balances.
- 30-day collection vs expense trend chart.
- Recent receipts.
- Alerts (unreconciled bank, over-budget vote heads, unallocated payments).

---

## 17. Audit Trail

Every action that changes finance data is logged automatically.

- Open **Finance → Audit Trail**.
- Filter by user, module or date.
- Click a row → **View Diff** to see before/after values side-by-side.
- Click **Seal Chain** monthly — this cryptographically links entries so
  tampering can be detected. **Verify Chain** shows a green banner if the
  chain is intact.

---

## 18. Closing a Term or Period

1. Make sure Trial Balance balances (Total Dr = Total Cr).
2. **Finance → Periods → Close Period**.
3. Once closed, nobody can post to that period without a Principal reopening
   it.
4. Run Brought Forward for the next term.

---

## 19. Roles and Permissions

| Role | Can do |
|------|--------|
| Super Admin | Everything |
| Principal | Approve expenses, close/reopen periods, view all reports |
| Bursar | Create fees, collect payments, raise expenses, run reports |
| Accounts Clerk | Collect payments, view own receipts, view student statements |
| Class Teacher | Read-only student balances for their class |
| Parent | Own children's statements and payments |

---

## 20. Frequently Asked Questions

**Q. I posted a wrong payment.** Open the receipt → **Void** with a reason.
The system posts a reversal — never delete records.

**Q. A parent overpaid.** The excess is stored as an *Advance Credit* on the
student. Next term, use **Apply Credit** to knock down the new fees.

**Q. The trial balance does not balance.** This should never happen because
every posting is enforced balanced. If it happens, contact support before
closing the period.

**Q. I cannot see the Enterprise pages.** Your school is on the *Cloud*
edition. Contact CHUO to upgrade to *Flow*.

**Q. Can I edit a past term?** No. Historical terms are read-only. A
Principal can temporarily reopen a period if a correction is required.

**Q. Where do I get help?** support@chuo.co.ke or the in-app chat bubble
(bottom right).
