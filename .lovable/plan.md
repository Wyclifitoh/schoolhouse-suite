# Student Import, Previous Balance & Term Isolation

Scope is large; sequencing into 3 batches. I'll confirm before coding.

## Batch 1 — Student Import + Previous Balance system

### 1.1 Bulk import fixes (`backend/src/modules/students/students.service.js`, `src/components/students/BulkImportDialog.tsx`)
- **DOB parsing**: Excel stores dates as serial numbers (days since 1899-12-30). Current parser is reading raw cell → `1899-11-30` fallback. Add a `parseExcelDate()` helper that:
  - Detects numeric serial → converts via `new Date(Math.round((serial - 25569) * 86400 * 1000))`
  - Accepts ISO strings, `DD/MM/YYYY`, `MM/DD/YYYY`, `YYYY-MM-DD`
  - Returns `null` on failure (do not silently default)
- **Previous Balance**: rename CSV column from `opening_balance` → `previous_balance` (accept both for backward compat). Instead of writing a free-form "Opening Balance (B/F)" `student_fees` row, assign the **protected Previous Balance fee structure** (see 1.2) for the current term with the imported amount.

### 1.2 Protected "Previous Balance" system fee structure
- Migration adds `is_system BOOLEAN DEFAULT false` and `system_code VARCHAR(64) UNIQUE NULL` to `fee_structures` and `fee_categories` (or whichever table the project uses — confirm via repo read).
- On school creation / app boot, seed one `fee_structures` row per school with `system_code = 'PREVIOUS_BALANCE'`, `is_system = true`, name "Previous Balance", amount 0 (per-student override).
- Backend guards in finance routes: reject CREATE that targets `system_code = 'PREVIOUS_BALANCE'`, and reject UPDATE/DELETE on any row where `is_system = true` (returns 403 even for super_admin).
- Frontend Finance pages hide edit/delete buttons when `row.is_system`.

### 1.3 Wire import → Previous Balance assignment
- In `bulkImport` service: after student created, if `previous_balance > 0`, upsert a `student_fees` row scoped by `(student_id, fee_structure_id = previous_balance system structure, term_id = current)` with `amount_due = previous_balance`. Re-import updates instead of duplicating.

## Batch 2 — Brought Forward Balances module + Promotion gating

### 2.1 Backend (`backend/src/modules/finance/carry-forward.controller.js` new + routes)
- `GET /finance/brought-forward/preview?class_id&stream_id&from_term_id` → returns rows `{ student_id, admission_number, full_name, previous_term_balance, existing_bf_amount }`. Computes prev balance = sum of unpaid `student_fees.balance` from `from_term_id`.
- `POST /finance/brought-forward/apply` body `{ to_term_id, entries: [{ student_id, amount }] }` → upserts the Previous Balance `student_fees` row for `to_term_id` (insert if missing, update existing). Idempotent.
- RBAC: super_admin / admin / accountant.

### 2.2 Frontend (`src/pages/finance/BroughtForwardBalances.tsx` new + route + sidebar)
- Class + Stream selectors → load table → editable Amount column → Submit.
- Route under `/finance/brought-forward`, gated by `hasAnyRole(['super_admin','admin','accountant'])`.

### 2.3 Promotion gating
- Confirm `promotion` module exists; if not wired, add a flag check so a student only appears in the new term's class context after promotion. Current code already filters by `student_enrollments.term_id` in most queries — verify and patch any gaps.

## Batch 3 — Term/Year isolation sweep

The infrastructure already exists (`session.middleware.js` resolves `X-Term-Id` / `X-Academic-Year-Id`; `TermContext` propagates via `api.setSession` and invalidates caches on switch). The bug is that **some repositories ignore `req.session`**.

### 3.1 Backend repository audit
Run `backend/scripts/lint-session-isolation.js` (already in repo) and patch any module flagged as not filtering by `req.session.termId` / `academicYearId`:
- assessments, exams, results, report cards
- attendance, homework, lesson plans
- communications, payments, fee assignments
- fee_structures listing (filter by term/year when present)

Each repository's list/get queries get `AND term_id = ? AND academic_year_id = ?` (only where the column exists).

### 3.2 Frontend query key audit
Ensure every list hook includes `selectedTerm?.id` (and `selectedAcademicYear?.id` where relevant) so cache invalidation on switch is clean. Most are already done; sweep `useAssessments`, `useExams`, `useAttendance`, `useHomework`, `useLessonPlans`, `useCommunication`, `useClasses`.

### 3.3 Reports default = current term
Reports pages already read `selectedTerm`; verify default filter is the current term and historical filter is opt-in.

---

## Technical notes

- Excel date parsing in the existing import uses `xlsx` library — set `cellDates: true` on `XLSX.read()` OR detect numeric and convert manually. Manual conversion is safer because it handles both paths.
- Previous Balance system row needs **per-school** seeding; add an idempotent ensure-function called from `bulkImport` and from a one-time migration that seeds existing schools.
- All new tables and altered tables stay in MySQL (project uses MySQL via `backend/src/config/database.js`, NOT Supabase). No Supabase migration needed for this batch.

## Confirm before I start

Reply **"go batch 1"** (or "go all" to run sequentially). I'll start with Batch 1: import DOB fix, Previous Balance system structure, and import wiring.