# CHUO Flow — Finance Test Data (Usenge High School)

> Realistic Kenyan secondary-school seed data for QA. Load into a fresh
> tenant before running the QA checklist. Amounts in KES.

## 1. School profile

| Field | Value |
|-------|-------|
| Name | Usenge High School |
| Motto | *Elimu ni Nuru* |
| Subdomain | `usenge.chuoflow.co.ke` |
| Edition | Enterprise (Flow) |
| Address | P.O. Box 45, Usenge, Siaya County |
| Phone | +254 712 000 111 |
| Email | info@usenge.ac.ke |
| KRA PIN | P051123456X |
| M-Pesa Paybill | 400200 (Acct = Admission No.) |

## 2. Academic calendar

| Year | Term | Start | End |
|------|------|-------|-----|
| 2025 | Term 3 | 01 Sep 2025 | 29 Nov 2025 |
| 2026 | Term 1 | 06 Jan 2026 | 04 Apr 2026 |
| 2026 | **Term 2 (Active)** | 05 May 2026 | 08 Aug 2026 |
| 2026 | Term 3 | 01 Sep 2026 | 27 Nov 2026 |

## 3. Classes and streams

| Grade | Streams | Capacity |
|-------|---------|----------|
| Form 1 | Boarders, Day Scholars | 40 + 40 |
| Form 2 | Boarders, Day Scholars | 38 + 42 |
| Form 3 | Sciences, Arts | 36 + 34 |
| Form 4 | Sciences, Arts | 32 + 30 |

## 4. Chart of Accounts (sample additions)

| Code | Name | Type |
|------|------|------|
| 1010 | KCB Usenge — 1122334455 | Asset (Bank) |
| 1011 | Equity Siaya — 0102030405 | Asset (Bank) |
| 1012 | Cash on Hand | Asset |
| 1013 | Petty Cash | Asset |
| 1200 | Fees Receivable | Asset |
| 1300 | Inventory | Asset |
| 1500 | Motor Vehicles | Asset |
| 1510 | Accum. Depreciation — MV | Asset (contra) |
| 2100 | Accounts Payable | Liability |
| 2200 | Advance Fees (Credits) | Liability |
| 3100 | Retained Surplus | Equity |
| 4100 | Tuition Income | Income |
| 4110 | Boarding Income | Income |
| 4120 | Lunch Income | Income |
| 4130 | Transport Income | Income |
| 4140 | Activity Income | Income |
| 4150 | Development Income | Income |
| 4160 | Uniform Income | Income |
| 4900 | Capitation — MoE | Income |
| 6100 | Utilities Expense | Expense |
| 6110 | Motor Vehicle Repairs | Expense |
| 6120 | Stationery Expense | Expense |
| 6130 | Salaries & Wages | Expense |
| 6900 | Depreciation Expense | Expense |

## 5. Vote Heads

| Name | Type | Income/Expense Acct | Receivable/Payable Acct |
|------|------|---------------------|-------------------------|
| Tuition | Income | 4100 | 1200 |
| Boarding | Income | 4110 | 1200 |
| Lunch | Income | 4120 | 1200 |
| Transport | Income | 4130 | 1200 |
| Activity | Income | 4140 | 1200 |
| Development | Income | 4150 | 1200 |
| Uniform | Income | 4160 | 1200 |
| Utilities | Expense | 6100 | 2100 |
| MV Repairs | Expense | 6110 | 2100 |
| Stationery | Expense | 6120 | 2100 |
| Salaries | Expense | 6130 | 2100 |

## 6. Bank accounts

| Name | Account No. | Branch | Opening Balance | GL |
|------|-------------|--------|-----------------|----|
| KCB Usenge | 1122334455 | Bondo | 120,000 | 1010 |
| Equity Siaya | 0102030405 | Siaya | 45,500 | 1011 |
| Cash on Hand | — | — | 2,500 | 1012 |
| Petty Cash | — | — | 1,000 | 1013 |

## 7. Fee Structures — 2026 Term 2

### Form 1 Boarders (total KES 24,500)

| Vote Head | Amount |
|-----------|--------|
| Tuition | 10,000 |
| Boarding | 8,000 |
| Lunch | 2,000 |
| Activity | 1,500 |
| Development | 2,500 |
| Uniform | 500 |

### Form 1 Day Scholars (total KES 16,500)

| Vote Head | Amount |
|-----------|--------|
| Tuition | 10,000 |
| Lunch | 2,000 |
| Activity | 1,500 |
| Development | 2,500 |
| Uniform | 500 |

### Form 3 Sciences (total KES 27,000)

| Vote Head | Amount |
|-----------|--------|
| Tuition | 12,000 |
| Boarding | 9,000 |
| Lunch | 2,000 |
| Activity | 1,500 |
| Development | 2,500 |

### Form 4 Sciences (total KES 29,500)

| Vote Head | Amount |
|-----------|--------|
| Tuition | 13,000 |
| Boarding | 10,000 |
| Lunch | 2,000 |
| Activity | 2,000 |
| Development | 2,500 |

## 8. Discounts / Bursaries

| Name | Type | Value |
|------|------|-------|
| Bursary 25% | Percentage | 25 |
| CDF Bursary Flat | Flat | 5,000 |
| Staff Child Waiver | Percentage | 100 |
| Orphan Waiver | Flat | 10,000 |

## 9. Sample students (10 of many)

| Adm No. | Name | Class | Stream | Parent | Phone |
|---------|------|-------|--------|--------|-------|
| USH/2026/001 | Brian Otieno Ochieng | Form 1 | Boarders | Peter Ochieng | +254 722 111 001 |
| USH/2026/002 | Mercy Achieng Adhiambo | Form 1 | Day Scholars | Grace Adhiambo | +254 722 111 002 |
| USH/2026/003 | Kevin Omondi Owino | Form 2 | Boarders | Mary Owino | +254 722 111 003 |
| USH/2026/004 | Faith Wanjiku Njeri | Form 2 | Day Scholars | John Njeri | +254 722 111 004 |
| USH/2025/015 | Daniel Kiprop Rono | Form 3 | Sciences | Sarah Rono | +254 722 111 005 |
| USH/2025/016 | Cynthia Awuor Okoth | Form 3 | Arts | Michael Okoth | +254 722 111 006 |
| USH/2024/032 | Samuel Kamau Mwangi | Form 4 | Sciences | Alice Mwangi | +254 722 111 007 |
| USH/2024/033 | Linet Chebet Tanui | Form 4 | Sciences | Joseph Tanui | +254 722 111 008 |
| USH/2024/034 | Vincent Barasa Wafula | Form 4 | Arts | Rose Wafula | +254 722 111 009 |
| USH/2026/007 | Emmanuel Muli Nzomo | Form 1 | Boarders | Ann Nzomo | +254 722 111 010 |

## 10. Suppliers

| Name | KRA PIN | Phone | Opening Bal | Payables Acct |
|------|---------|-------|-------------|---------------|
| Kisumu Stationers Ltd | P051200011X | +254 733 200 001 | 12,000 | 2100 |
| Bondo Bakers | P051200012X | +254 733 200 002 | 0 | 2100 |
| Siaya Motor Spares | P051200013X | +254 733 200 003 | 4,500 | 2100 |
| Kenya Power | P000000001A | 97771 | 0 | 2100 |
| Nyanza Milk Suppliers | P051200015X | +254 733 200 005 | 8,200 | 2100 |

## 11. Sample payments to record (Term 2)

| Date | Adm No. | Method | Amount | Ref | Bank |
|------|---------|--------|--------|-----|------|
| 08 May 2026 | USH/2026/001 | Cash | 10,000 | — | Cash on Hand |
| 08 May 2026 | USH/2026/001 | Bank | 5,000 | KCB-778812 | KCB Usenge |
| 09 May 2026 | USH/2026/002 | M-Pesa STK | 16,500 | RXA1B2C3D4 | KCB Usenge |
| 10 May 2026 | USH/2026/003 | Cheque | 20,000 | 000451 | Equity Siaya |
| 12 May 2026 | USH/2025/015 | M-Pesa C2B | 27,000 | RXB1F2G3H4 | KCB Usenge |
| 14 May 2026 | USH/2024/032 | Bank | 29,500 | KCB-778999 | KCB Usenge |
| 15 May 2026 | USH/2026/007 | In-Kind (5 bags maize @ 4,000) | 20,000 | INK-001 | Inventory |
| 16 May 2026 | USH/2026/004 | Cash | 8,000 (partial) | — | Cash on Hand |
| 20 May 2026 | USH/2024/033 | M-Pesa STK | 30,000 (overpay 500) | RXC7H8I9 | KCB Usenge |
| 25 May 2026 | USH/2024/034 | Bank | 26,000 | KCB-779100 | KCB Usenge |

## 12. Sample expenses

| Date | Vote Head | Payee | Amount | Bank | Notes |
|------|-----------|-------|--------|------|-------|
| 07 May 2026 | Utilities | Kenya Power | 3,200 | KCB Usenge | May electricity |
| 09 May 2026 | Stationery | Kisumu Stationers | 6,400 | KCB Usenge | Exam papers |
| 11 May 2026 | MV Repairs | Siaya Motor Spares | 12,750 | KCB Usenge | School van service |
| 15 May 2026 | Salaries | Payroll | 245,000 | KCB Usenge | May salaries |
| 18 May 2026 | Utilities | Nyanza Water | 4,100 | KCB Usenge | May water |

## 13. Petty cash transactions

| Date | Type | Description | Amount |
|------|------|-------------|--------|
| 05 May 2026 | Top-up from KCB | Term float | 5,000 |
| 06 May 2026 | Expense | Airtime — Bursar's line | 500 |
| 08 May 2026 | Expense | Tea & snacks — visitors | 750 |
| 12 May 2026 | Expense | Postage — KNEC forms | 350 |
| 20 May 2026 | Expense | Photocopy — mid-term exams | 1,200 |

## 14. Budget (Term 2)

| Vote Head | Budget | Policy |
|-----------|--------|--------|
| Utilities | 40,000 | Warn |
| Stationery | 25,000 | Warn |
| MV Repairs | 30,000 | Warn |
| Salaries | 750,000 | Block |

## 15. Capitation

| Date | Source | Amount | Bank | Allocations |
|------|--------|--------|------|-------------|
| 15 May 2026 | Ministry of Education (Free Day SSE) | 500,000 | KCB Usenge | Tuition 250,000 · Boarding 150,000 · Activity 50,000 · Development 50,000 |

## 16. Assets

| Name | Cost | Purchase Date | Useful Life | Method |
|------|------|--------------|-------------|--------|
| Toyota Hiace KDG 123A | 3,200,000 | 12 Jan 2024 | 8 years | Straight line |
| Dell Optiplex Desktops ×5 | 350,000 | 06 Feb 2025 | 4 years | Straight line |
| Photocopier Kyocera 3212i | 210,000 | 22 May 2025 | 5 years | Straight line |
| Chemistry Lab Set | 480,000 | 10 Sep 2025 | 10 years | Straight line |

## 17. Sample bank statement (for reconciliation)

CSV shape (`sample_kcb_may_2026.csv`):

```csv
date,description,reference,debit,credit,balance
2026-05-01,Opening Balance,,,,120000.00
2026-05-08,MPESA/USH20260001/BRIAN OTIENO,MPESA778812,,5000.00,125000.00
2026-05-09,MPESA STK USH20260002,RXA1B2C3D4,,16500.00,141500.00
2026-05-10,CHQ 000451 KEVIN OMONDI,000451,,20000.00,161500.00
2026-05-11,SIAYA MOTOR SPARES,PV-0001,12750.00,,148750.00
2026-05-12,C2B USH20250015,RXB1F2G3H4,,27000.00,175750.00
2026-05-14,DEP USH20240032,KCB778999,,29500.00,205250.00
2026-05-15,PAYROLL MAY,PV-SAL-05,245000.00,,-39750.00
2026-05-15,MOE CAPITATION,MOE-2026-2,,500000.00,460250.00
2026-05-18,NYANZA WATER,PV-0003,4100.00,,456150.00
2026-05-25,DEP USH20240034,KCB779100,,26000.00,482150.00
2026-05-31,BANK CHARGES,BC-05,850.00,,481300.00
```

## 18. Scenarios to reproduce during QA

1. **Overpayment credit** — Linet Tanui pays 30,000 against 29,500. Verify
   500 advance credit.
2. **Bursary application** — Emmanuel Nzomo gets a 25% bursary before payment;
   final balance = 18,375.
3. **Void & re-post** — Void Brian Otieno's cash 10,000. Post fresh
   receipt of 12,000. Statement should show reversal + new receipt.
4. **Cross-term brought forward** — Kevin Omondi ends Term 1 owing 4,000.
   Applying BF to Term 2 must show opening 4,000.
5. **Period close attempt with imbalance** — Force imbalance in staging,
   close should fail with clear error.
6. **Bank reconciliation** — Import the CSV above, auto-match; one bank
   charge (850) should remain to be posted manually.
7. **Budget overspend** — Try to approve 800,000 salaries against 750,000
   budget with **Block** policy — must be rejected.
8. **Audit tamper detection** — Manually edit an `audit_logs.new_values`
   field via SQL; verify chain must report the broken sequence.

## 19. Anonymisation & re-use

All names, admission numbers, PINs and phone numbers are fictitious. Safe to
use in demos and screenshots. Replace `usenge` with your target tenant
subdomain if reusing for another school demo.
