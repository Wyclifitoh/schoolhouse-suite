# CHUO Flow — Enterprise Finance QA & Documentation Pack

This folder is the single source of truth for testing and using the Enterprise
Finance Module (CHUO Flow edition). It contains three companion documents:

| Document | Audience | Purpose |
|----------|----------|---------|
| [`finance-qa-checklist.md`](./finance-qa-checklist.md) | QA Engineer / Tester | Executable end-to-end test manual covering every Finance module. |
| [`finance-user-manual.md`](./finance-user-manual.md) | Bursar / Accounts Clerk / Principal / Admin | Plain-language, step-by-step user guide. |
| [`finance-test-data.md`](./finance-test-data.md) | Tester / Trainer | Realistic Kenyan secondary-school sample data to seed the system. |

## Reading order

1. Read the **User Manual** to understand the intended behaviour of each
   feature.
2. Load the **Test Data** into a fresh CHUO Flow tenant (e.g. `usenge.chuoflow.co.ke`).
3. Execute the **QA Checklist** top-to-bottom, marking Pass / Fail / Blocked.

## Environment assumptions

- Tenant edition = `enterprise` (Cloud edition tests should return **HTTP 403**
  for enterprise-only endpoints).
- Active Academic Year: **2026**, Active Term: **Term 2**.
- At least one **OPEN** accounting period covering today.
- Roles seeded: `super_admin`, `principal`, `bursar`, `accounts_clerk`,
  `class_teacher`, `parent`.
- Lovable Cloud backend running with migrations up to
  `2026_08_12_phase15_audit_hardening.sql` applied.

## Definitions used across the docs

- **Vote Head** — a budget line / income or expense head (e.g. Tuition, Boarding).
- **Fee Structure** — the term-scoped price list per grade/stream.
- **Student Fee Account** — the per-student running statement (Dr = charges, Cr = payments).
- **GL** — General Ledger (`general_ledger_entries` table).
- **Posting Ref** — idempotency key for every GL posting.
- **Period** — accounting period; must be OPEN before any posting can be made.
