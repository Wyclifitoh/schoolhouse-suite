# CHUO Flow — Enterprise Finance QA Checklist

> Tester manual. Every case is self-contained: prerequisites, exact steps,
> expected result, and pass/fail column. Use the sample data in
> [`finance-test-data.md`](./finance-test-data.md) unless a case says otherwise.

## How to use this document

1. Work top-to-bottom. Sections build on each other (Fee Structure must exist
   before Fee Collection can be tested).
2. For each case, record **Pass / Fail / Blocked** in the Result column and any
   defect ID in Notes.
3. Any failure in a **Critical (C)** case blocks release. **High (H)** cases
   should be fixed before UAT sign-off.
4. All monetary values are in **KES**.

## Global test accounts

| Role | Username | Password |
|------|----------|----------|
| Super Admin | `admin@usenge.ac.ke` | `Passw0rd!` |
| Principal | `principal@usenge.ac.ke` | `Passw0rd!` |
| Bursar | `bursar@usenge.ac.ke` | `Passw0rd!` |
| Accounts Clerk | `clerk@usenge.ac.ke` | `Passw0rd!` |
| Class Teacher | `teacher@usenge.ac.ke` | `Passw0rd!` |
| Parent | `parent@usenge.ac.ke` | `Passw0rd!` |

---

## 1. Academic Year & Term Management

Prerequisite for every downstream finance test — every operational module must
be Academic Year + Term aware.

| ID | Priority | Objective | Steps | Expected Result | Result | Notes |
|----|----------|-----------|-------|-----------------|--------|-------|
| AYT-01 | C | Create Academic Year 2026 | Settings → Academic Years → **New** → Name `2026`, Start `2026-01-06`, End `2026-11-27` → Save | Year appears in list with status *Draft* | | |
| AYT-02 | C | Add three terms to 2026 | Open 2026 → **Add Term** three times with the dates in test data | Three terms saved, non-overlapping | | |
| AYT-03 | C | Activate Year & Term 2 | Click **Activate** on Term 2 of 2026 | Header **Term switcher** shows `2026 · Term 2`; other terms marked *Inactive* | | |
| AYT-04 | H | Prevent overlapping terms | Try to create Term 2b `2026-05-01 → 2026-08-31` | Save is rejected with a validation error | | |
| AYT-05 | H | Switch term in header | Click term switcher → choose Term 1 | All finance pages reload showing Term 1 balances | | |
| AYT-06 | C | Historical read-only gate | Switch to a closed term → open Fee Collection | UI is read-only; **Record Payment** button hidden or disabled with tooltip | | |
| AYT-07 | H | Ensure module scoping | With Term 2 active, open Cash Book | Only Term 2 rows returned; totals match Term 2 GL | | |

---

## 2. Accounting Periods (Enterprise)

| ID | Priority | Objective | Steps | Expected Result | Result | Notes |
|----|----------|-----------|-------|-----------------|--------|-------|
| PER-01 | C | Auto-open period on first posting | Fresh tenant → post any receipt dated today | `accounting_periods` row created with status `open` | | |
| PER-02 | C | Block posting to closed period | Close current period → attempt to record a payment dated in that period | API returns 400 `period is closed`, UI toast surfaces the message | | |
| PER-03 | H | Reopen period (Principal only) | Login as Bursar → try `POST /accounting/periods/reopen` | 403 Forbidden | | |
| PER-04 | H | Reopen period (Principal) | Login as Principal → reopen closed period | Period status flips to `open`, audit log entry created | | |
| PER-05 | C | Trial balance must balance before close | Introduce imbalance (SQL) → attempt to close period | Close rejected with imbalance error | | |

---

## 3. Chart of Accounts & Vote Heads

| ID | Priority | Objective | Steps | Expected Result | Result | Notes |
|----|----------|-----------|-------|-----------------|--------|-------|
| COA-01 | C | Default COA seeded | Open **Finance → Chart of Accounts** on new tenant | Standard Assets / Liabilities / Equity / Income / Expense groups seeded | | |
| COA-02 | H | Create custom expense account | **New Account** → `6110 - Motor Vehicle Repairs`, type `Expense` | Account visible under Expenses group | | |
| COA-03 | H | Prevent duplicate code | Retry COA-02 with same code | Validation error `code must be unique per school` | | |
| VH-01 | C | Create Tuition vote head | **Finance → Vote Heads → New** → Name `Tuition`, Type `Income`, Income Account `4100 - Tuition Income`, Receivable `1200 - Fees Receivable` | Vote head saved | | |
| VH-02 | C | Vote heads for all sample streams | Create Boarding, Lunch, Transport, Activity, Development, Uniform as per test data | Six income vote heads listed | | |
| VH-03 | H | Expense vote heads | Create Salaries, Utilities, Repairs, Stationery vote heads linked to expense accounts | Visible under **Type = Expense** filter | | |
| VH-04 | H | Reject vote head without account | Try to save with Income Account blank | Client + server validation both trigger | | |
| VH-05 | M | Enterprise-only endpoint | Call `GET /api/v1/vote-heads` on a Cloud tenant | HTTP 403 `enterprise edition required` | | |

---

## 4. Fee Structure v2

| ID | Priority | Objective | Steps | Expected Result | Result | Notes |
|----|----------|-----------|-------|-----------------|--------|-------|
| FS-01 | C | Create Form 1 boarders structure Term 2 | **Finance → Fee Structures → New** → Grade `Form 1`, Stream `Boarders`, Term `2026 Term 2`, add 6 vote head lines per test data | Structure saved, total = **KES 24,500** | | |
| FS-02 | C | Duplicate structure across streams | Use **Copy to Stream** → Day Scholars | New structure created excluding Boarding fee | | |
| FS-03 | H | Prevent duplicate for same (grade, stream, term) | Re-create FS-01 | Save rejected, error clearly shown | | |
| FS-04 | H | Bulk assign to whole class | Open Form 1 Boarders → **Assign to Class** | All 40 students get pending charges of KES 24,500 | | |
| FS-05 | H | Discount / scholarship line | Add fee-discount `Bursary 25%` → apply to student `USH/2026/007` | Balance reduces by 6,125 | | |
| FS-06 | H | Multiple structures per class supported | Add a Term 2b special structure to same class | Both structures visible and additive on student statement | | |
| FS-07 | M | Delete structure with no assignments | Create then delete | Row removed | | |
| FS-08 | M | Prevent delete when assignments exist | Try to delete FS-01 after FS-04 | Delete blocked with FK message | | |

---

## 5. Student Fee Accounts & Statements v2

| ID | Priority | Objective | Steps | Expected Result | Result | Notes |
|----|----------|-----------|-------|-----------------|--------|-------|
| SFA-01 | C | Ledger view opens | Finance → Student Accounts → search `USH/2026/001` | Statement lists opening balance, charges, payments, running balance | | |
| SFA-02 | C | Charges post to GL | Verify GL for latest assignment | Dr Fees Receivable / Cr Tuition Income (balanced) | | |
| SFA-03 | H | Brought-forward preview | Finance → Brought Forward → Preview from Term 1 to Term 2 | Preview lists arrears per student | | |
| SFA-04 | H | Apply brought forward | Apply preview | `student_fees` rows updated with `brought_forward_amount` | | |
| SFA-05 | H | Statement PDF download | Statements → student → **Download PDF** | Well-formatted PDF, correct school header/logo | | |
| SFA-06 | H | Enterprise statement v2 | `GET /finance/enterprise/students/{id}/statement` | JSON with balanced totals, includes vote-head grouping | | |
| SFA-07 | M | Rebalance overpayment | Overpay by 500 then run **Rebalance** | Excess credit row created for 500 | | |
| SFA-08 | H | Historical term is read-only | Open closed term statement | No **Adjust** / **Record Payment** buttons | | |

---

## 6. Fee Collection & Receipts

| ID | Priority | Objective | Steps | Expected Result | Result | Notes |
|----|----------|-----------|-------|-----------------|--------|-------|
| FC-01 | C | Cash payment | Fee Collection → student `USH/2026/001` → Cash `10,000` → Bank account `Cash on Hand` → Save | Receipt generated, GL: Dr Cash / Cr Fees Receivable | | |
| FC-02 | C | Bank deposit | Same student → Bank `KCB Usenge` → 5,000 with ref `KCB-778812` | Receipt saved, GL Dr KCB / Cr Fees Receivable | | |
| FC-03 | C | M-Pesa STK push happy path | Trigger STK, respond OK in sandbox | Payment auto-allocates, `mpesa_transactions.status = completed` | | |
| FC-04 | H | M-Pesa timeout | Trigger STK, do not confirm | Status becomes `stale` after expiry, no GL posting | | |
| FC-05 | C | Auto-allocation FIFO across vote heads | Pay 20,000 to student with 24,500 outstanding across 6 heads | Allocations follow due-date FIFO, balance 4,500 | | |
| FC-06 | H | Overpayment → advance credit | Pay 30,000 to student with 24,500 outstanding | 5,500 posted as `advance_credit`, GL Dr Cash / Cr Advance Fees | | |
| FC-07 | H | Void payment | Void FC-01 with reason `Cheque bounced` | Reversal GL entry auto-posted, receipt marked void | | |
| FC-08 | C | Receipt numbering unique | Record 3 sequential payments | Receipt numbers monotonically increase, no gaps for successful | | |
| FC-09 | H | SMS notification on payment | Verify SMS log | Row inserted with status `sent` when SMS creds configured | | |
| FC-10 | H | Bulk import payments | Upload CSV of 20 payments | All rows validated; errors reported per row | | |
| FC-11 | H | Payment in kind (goods for fees) | Record 5 bags maize @ KES 4,000 | In-kind transaction pending approval | | |
| FC-12 | H | Approve in-kind | Approve → posts to GL as Dr Inventory / Cr Fees Receivable | Balance reduces, inventory increases | | |
| FC-13 | M | Public payment API | POST public endpoint with API key | Payment ingested, receipt returned | | |
| FC-14 | C | Negative amount rejected | Try amount `-100` | 400 validation error | | |
| FC-15 | H | Duplicate M-Pesa receipt idempotent | Replay same callback | Second call is no-op (same `posting_ref`) | | |

---

## 7. Cash Book, GL & Trial Balance

| ID | Priority | Objective | Steps | Expected Result | Result | Notes |
|----|----------|-----------|-------|-----------------|--------|-------|
| CB-01 | C | Cash Book lists all bank/cash movements | Finance → Cash Book → filter today | Rows match receipts + expenses posted today | | |
| CB-02 | H | Filter Cash Book by bank | Filter `KCB Usenge` | Only KCB rows shown, opening + closing balance correct | | |
| GL-01 | C | GL entry drill-down | Click any GL row | Shows all offset lines, sum Dr = sum Cr | | |
| GL-02 | C | GL is append-only | Attempt PATCH via API | 405 / 403 returned | | |
| TB-01 | C | Trial balance balances | Finance → Trial Balance | Total Dr = Total Cr for current period | | |
| TB-02 | H | Trial balance across YTD | Switch scope to `Year to date` | Still balances | | |
| TB-03 | H | Export trial balance | Export XLSX | File downloads, opens cleanly, matches on-screen totals | | |

---

## 8. Expenses & Petty Cash

| ID | Priority | Objective | Steps | Expected Result | Result | Notes |
|----|----------|-----------|-------|-----------------|--------|-------|
| EX-01 | C | Raise expense (draft) | Expenses → New → Vote head `Utilities`, Amount 3,200, Payee `KPLC`, Bank `KCB Usenge` | Status `Draft`, no GL entry yet | | |
| EX-02 | C | Approve expense posts to GL | Approve as Principal | GL Dr Utilities Expense / Cr KCB | | |
| EX-03 | H | Reject expense | Reject with reason | Status `Rejected`, no GL entry | | |
| EX-04 | H | Petty cash float top-up | Petty Cash → Top-up 5,000 from KCB | GL Dr Petty Cash / Cr KCB | | |
| EX-05 | H | Petty cash expense | Record 350 stationery | GL Dr Stationery / Cr Petty Cash | | |
| EX-06 | M | Bulk expense import | Upload CSV of 10 rows | All create as Draft | | |
| EX-07 | H | Expense in closed period blocked | Approve expense dated in closed period | Rejected with period-closed error | | |
| EX-08 | H | Attachment upload | Attach receipt PDF to EX-01 | File visible on detail view | | |

---

## 9. Suppliers & Procurement

| ID | Priority | Objective | Steps | Expected Result | Result | Notes |
|----|----------|-----------|-------|-----------------|--------|-------|
| SUP-01 | H | Create supplier | Suppliers → New `Kisumu Stationers Ltd`, KRA PIN, Payables acct | Saved with opening balance 0 | | |
| SUP-02 | H | Opening balance | Set opening 12,000 | GL Dr Suppliers Opening BF / Cr AP - Kisumu Stationers | | |
| PROC-01 | H | Requisition → PO → GRN → Invoice full flow | Follow procurement wizard | Each step transitions state; inventory increases at GRN; GL posts at Invoice | | |
| PROC-02 | H | Payment voucher for invoice | Create PV, mark Paid | GL Dr AP / Cr Bank; supplier balance reduces | | |
| PROC-03 | M | Cancel PO | Cancel from status `Open` | Status flips; no downstream docs allowed | | |

---

## 10. Bank Accounts & Reconciliation

| ID | Priority | Objective | Steps | Expected Result | Result | Notes |
|----|----------|-----------|-------|-----------------|--------|-------|
| BA-01 | C | Create bank account | Finance → Banks → New `KCB Usenge`, A/C `1122334455`, GL `1010` | Listed with 0 balance | | |
| BA-02 | H | Delete blocked when postings exist | Delete after any receipt posted | Delete blocked | | |
| BR-01 | H | Import statement CSV | Bank Rec → Import CSV (sample_kcb.csv) | Rows staged for matching | | |
| BR-02 | H | Auto-match | Run Auto-Match | Matches on ref+amount+date | | |
| BR-03 | H | Manual match | Manually match unmatched row | Status flips to `matched` | | |
| BR-04 | H | Reconciled balance | Complete reconciliation for Jul 2026 | Reconciled balance = GL bank balance | | |

---

## 11. Budgets & Capitation

| ID | Priority | Objective | Steps | Expected Result | Result | Notes |
|----|----------|-----------|-------|-----------------|--------|-------|
| BUD-01 | H | Create budget per vote head | Budgets → 2026 → set amounts per vote head per term | Saved | | |
| BUD-02 | H | Actuals derived from GL | Post an expense | Budget vs Actual updates live | | |
| BUD-03 | H | Overspend soft warning | Overspend with policy `warn` | Warning banner, save allowed | | |
| BUD-04 | H | Overspend hard block | Set policy `block`, exceed | Save blocked with error | | |
| CAP-01 | H | Record capitation grant | Capitation → Record 500,000 from MoE | GL Dr Bank / Cr Capitation Income | | |
| CAP-02 | H | Allocate across vote heads | Split per BOM heads | Balanced transfer entries posted | | |

---

## 12. Assets & Depreciation

| ID | Priority | Objective | Steps | Expected Result | Result | Notes |
|----|----------|-----------|-------|-----------------|--------|-------|
| AST-01 | H | Add asset | Assets → New `Toyota Hiace KDG 123A`, Cost 3,200,000, useful life 8y, straight-line | Asset row saved | | |
| AST-02 | H | Monthly depreciation | Run monthly depreciation | GL Dr Depreciation Expense / Cr Accumulated Depreciation | | |
| AST-03 | H | Dispose asset | Dispose at 800,000 | Gain/loss computed and posted | | |

---

## 13. Financial Reports

| ID | Priority | Objective | Steps | Expected Result | Result | Notes |
|----|----------|-----------|-------|-----------------|--------|-------|
| RPT-01 | C | Income Statement | Finance → Reports → Income Statement `Term 2` | Revenue − Expenses = Surplus, matches Trial Balance | | |
| RPT-02 | C | Balance Sheet | Reports → Balance Sheet as of today | Assets = Liabilities + Equity | | |
| RPT-03 | H | AP Aging | Reports → AP Aging | Buckets 0-30/31-60/61-90/90+ populated from supplier GL | | |
| RPT-04 | H | Fee Collection Report | Reports → Fee Collection Term 2 | Matches sum of receipts | | |
| RPT-05 | H | Export any report | Export PDF & XLSX | Both open, headers include school + period | | |

---

## 14. Bursar Dashboard

| ID | Priority | Objective | Steps | Expected Result | Result | Notes |
|----|----------|-----------|-------|-----------------|--------|-------|
| DASH-01 | C | KPIs render | Login as Bursar → Dashboard | Collections MTD, Term Surplus, Unallocated, Bank Balances all render numbers | | |
| DASH-02 | H | 30-day trend chart | Verify chart | Recharts line chart with 30 buckets | | |
| DASH-03 | H | Recent receipts table | Post new receipt → refresh | New receipt appears at top | | |
| DASH-04 | H | Bank balances | Balance total = sum of bank GL | Cross-check with Trial Balance | | |

---

## 15. Audit Trail

| ID | Priority | Objective | Steps | Expected Result | Result | Notes |
|----|----------|-----------|-------|-----------------|--------|-------|
| AUD-01 | C | Actions logged | Perform a fee adjustment | `audit_logs` row created with old + new JSON | | |
| AUD-02 | H | Diff viewer | Open row → **View Diff** | Side-by-side, changed fields highlighted | | |
| AUD-03 | C | Seal chain | Audit Trail → **Seal chain** | Unsealed rows get sequence, prev_hash, entry_hash | | |
| AUD-04 | C | Verify chain OK | Click **Verify** | Banner turns green: `Chain intact, N entries` | | |
| AUD-05 | C | Tamper detection | (Test env) manually update an old_values field via SQL → Verify | Banner turns red with broken sequence ID | | |
| AUD-06 | H | Filter by user / entity / date | Apply filters | Rows filter correctly, pagination works | | |

---

## 16. Permissions & Security

| ID | Priority | Objective | Steps | Expected Result | Result | Notes |
|----|----------|-----------|-------|-----------------|--------|-------|
| SEC-01 | C | Enterprise gate blocks Cloud | Switch tenant to Cloud → hit `/finance/bursar-dashboard` | Redirected / upgrade prompt, backend 403 on enterprise routes | | |
| SEC-02 | C | Bursar cannot close period | Bursar tries POST `/accounting/periods/close` | 403 | | |
| SEC-03 | C | Clerk cannot approve expense | Clerk approves → | 403 | | |
| SEC-04 | C | Cross-tenant isolation | Bursar of School A tries `GET /students/{schoolB_id}` | 404 or 403, never leaks data | | |
| SEC-05 | H | Session isolation | Two tabs, different schools | Each keeps its scope; no leakage | | |
| SEC-06 | H | SQL injection on filters | Put `' OR 1=1 --` in report filter | Handled safely, no crash, no data leak | | |
| SEC-07 | H | Rate limit on public payment API | 20 rapid calls | 429 after threshold | | |
| SEC-08 | H | Secrets never in logs | Grep server logs | No API keys, no cookies | | |

---

## 17. Validation & Edge Cases

| ID | Priority | Objective | Steps | Expected Result | Result | Notes |
|----|----------|-----------|-------|-----------------|--------|-------|
| EDGE-01 | H | Zero-value receipt rejected | Try to save receipt = 0 | Validation error | | |
| EDGE-02 | H | Fractional cents rounded to 2dp | Enter 100.126 | Stored as 100.13 | | |
| EDGE-03 | H | Concurrent payments (advisory lock) | Fire two receipts for same student simultaneously | Both post, no imbalance | | |
| EDGE-04 | M | Very long narration (500 chars) | Save receipt | Accepted or truncated cleanly | | |
| EDGE-05 | M | Special characters in payee | `M/S Kamau & Sons Ltd 🙂` | Saved & rendered correctly | | |
| EDGE-06 | H | Time-zone correctness | Post at 23:59 EAT | Rows dated in EAT, not UTC previous day | | |

---

## 18. Performance

| ID | Priority | Objective | Steps | Expected Result | Result | Notes |
|----|----------|-----------|-------|-----------------|--------|-------|
| PERF-01 | H | 5,000 payments load | Seed 5,000 receipts → open Fee Collection page 1 | First paint < 2s, pagination server-side | | |
| PERF-02 | H | Trial balance under load | Trial Balance with 100k GL rows | Response < 3s | | |
| PERF-03 | H | Bulk assign 1,000 students | Assign fee structure to 1,000 students | Completes < 30s, all GL entries balanced | | |
| PERF-04 | H | Audit chain seal 100k rows | Run seal | Completes < 60s, memory stable | | |

---

## Sign-off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| QA Lead | | | |
| Bursar | | | |
| Principal | | | |
| Head of Engineering | | | |
