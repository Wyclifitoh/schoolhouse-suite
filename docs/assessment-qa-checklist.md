# CHUO High School Assessment Module — QA Test Manual

This document is the official regression testing guide for the CHUO High School
Assessment module. It is written as a step-by-step procedure. Execute the tests
in the exact order presented. For every case, mark **✅ PASS** or **❌ FAIL** in
the Result column and log any observation in Notes. Any FAIL must block release
until fixed and re-run.

## Reference Sample Data

All sample data below uses realistic Kenyan secondary school information. Reuse
these entities across sections so cross-module tests (Marks Entry → Results →
Report Cards) reference the same records.

**Tester Account**
- Email: `qa.admin@chuoschools.ac.ke`
- Role: School Admin (full permissions)

**School under test**
- Name: `Nairobi Boys High School`
- Curriculum: Mixed (CBE Junior School + 8-4-4 Senior School)
- Academic Year: `2026`
- Term: `Term 2`

**Grades used**
- Grade 9 (CBE Junior Secondary)
- Form 2 (8-4-4)
- Form 3 (8-4-4)
- Form 4 (8-4-4)

**Streams**
- Form 3 East, Form 3 West
- Form 4 East, Form 4 West
- Grade 9 Blue, Grade 9 Green

**Teachers**
| Payroll No | Name | TSC No | Subjects |
|---|---|---|---|
| T-001 | John Kamau | 123456 | Mathematics, Physics |
| T-002 | Grace Wanjiru | 234567 | English, Literature |
| T-003 | Peter Otieno | 345678 | Kiswahili |
| T-004 | Mary Achieng | 456789 | Biology, Chemistry |
| T-005 | David Mwangi | 567890 | Geography, History & Government |
| T-006 | Faith Njeri | 678901 | CRE, Business Studies |
| T-007 | Samuel Kiptoo | 789012 | Agriculture, Computer Studies |

**Students (Form 3 East — abbreviated roster; create at least 20 for meaningful analytics)**
| Adm No | Name | Gender | KCPE |
|---|---|---|---|
| NB/2024/001 | Brian Mwangi | M | 385 |
| NB/2024/002 | Cynthia Achieng | F | 372 |
| NB/2024/003 | Dennis Kiprop | M | 341 |
| NB/2024/004 | Esther Njoki | F | 398 |
| NB/2024/005 | Felix Omondi | M | 315 |
| NB/2024/006 | Gladys Kerubo | F | 366 |
| NB/2024/007 | Henry Muturi | M | 290 |
| NB/2024/008 | Irene Wambui | F | 411 |
| NB/2024/009 | James Otieno | M | 355 |
| NB/2024/010 | Kelvin Barasa | M | 322 |

---

## 1. System Configuration

### TC-1.1 — Log in as School Admin
1. Open the app URL in Chrome.
2. On the login page enter Email `qa.admin@chuoschools.ac.ke` and the tester
   password.
3. Click **Sign In**.

Expected:
- Redirect to `/dashboard`.
- Header shows school name `Nairobi Boys High School`.
- Term switcher shows `2026 — Term 2`.

Result: ☐

### TC-1.2 — Confirm Academic Year & Term
1. Click the Term Switcher in the top bar.
2. Verify `Academic Year 2026` and `Term 2` are set as current.
3. If not, select them and click **Apply**.

Expected: Banner reflects `2026 · Term 2` on every page after refresh.

Result: ☐

### TC-1.3 — Confirm Backend Health
1. Open browser DevTools → Network tab.
2. Reload the dashboard.
3. Filter by `/api/v1/`.

Expected:
- All requests return 200. No 500 or 404.
- `/api/v1/schools/me` returns the correct school.

Result: ☐

---

## 2. Grading Systems

### TC-2.1 — Open Grading Systems Tab
1. Sidebar → **Assessments → Settings**.
2. Click the **Grading Systems** tab.

Expected:
- Two seeded systems visible:
  - `CBE Default (Migrated)` — curriculum CBC, marked *Default*.
  - `8-4-4 Default (KCSE)` — curriculum 8-4-4, marked *Default*.
- Each row shows a level count > 0.

Result: ☐

### TC-2.2 — View Default 8-4-4 Levels
1. Click the row `8-4-4 Default (KCSE)`.
2. Click **Setup Levels**.

Expected 12 rows (A, A-, B+, B, B-, C+, C, C-, D+, D, D-, E) with points
12 → 1 and score ranges covering 0–100 with no gaps.

Result: ☐

### TC-2.3 — Create Custom 8-4-4 Grading System
1. Click **New Grading System**.
2. Enter:
   - Name: `WikiTeq KCSE`
   - Description: `Internal KCSE variant with 5-mark E boundary.`
   - Curriculum Type: `8-4-4`
   - Default: unchecked
3. Click **Save**.

Expected: Row appears in the list with `0` levels and `Active`.

Result: ☐

### TC-2.4 — Configure Levels for `WikiTeq KCSE`
1. Click row → **Setup Levels**.
2. Add these 12 rows:

| Code | Min | Max | Points | Description |
|---|---|---|---|---|
| A | 80 | 100 | 12 | Excellent |
| A- | 75 | 79 | 11 | Very Good |
| B+ | 70 | 74 | 10 | Very Good |
| B | 65 | 69 | 9 | Good |
| B- | 60 | 64 | 8 | Good |
| C+ | 55 | 59 | 7 | Above Average |
| C | 50 | 54 | 6 | Average |
| C- | 45 | 49 | 5 | Below Average |
| D+ | 40 | 44 | 4 | Weak |
| D | 35 | 39 | 3 | Poor |
| D- | 30 | 34 | 2 | Very Poor |
| E | 0 | 29 | 1 | Fail |

3. Click **Save**.

Expected: Toast `Levels updated`. Reopen — the 12 rows persist.

Result: ☐

### TC-2.5 — Validate Range Coverage
1. Reopen the levels editor for `WikiTeq KCSE`.
2. Delete the row for `D-`.
3. Click **Save**.

Expected: Save succeeds but preview shows a gap 30–34. Restore the row and save again.

Result: ☐

### TC-2.6 — Create Custom CBE Grading System
1. **New Grading System**:
   - Name: `CBE 2026 Rubric`
   - Curriculum Type: `CBC`
   - Description: `Updated CBE performance descriptors.`
2. Save.
3. Setup Levels with:

| Code | Band | Min | Max | Points | Description |
|---|---|---|---|---|---|
| EE | EE | 76 | 100 | 4 | Exceeding Expectation |
| ME | ME | 51 | 75 | 3 | Meeting Expectation |
| AE | AE | 26 | 50 | 2 | Approaching Expectation |
| BE | BE | 0 | 25 | 1 | Below Expectation |

Expected: Persists after refresh.

Result: ☐

### TC-2.7 — Set as Default (Toggle)
1. Edit `WikiTeq KCSE`, tick **Default**, Save.

Expected: `8-4-4 Default (KCSE)` loses its Default flag automatically.

Result: ☐

### TC-2.8 — Revert Default
1. Edit `8-4-4 Default (KCSE)`, tick **Default**, Save.

Expected: `WikiTeq KCSE` becomes non-default.

Result: ☐

### TC-2.9 — Delete Unused Grading System
1. Create a throwaway system `Delete Me` (8-4-4, no levels, not default).
2. Delete it from the row menu.

Expected: Confirmation dialog; row disappears; toast `Deleted`.

Result: ☐

---

## 3. Subject Categories

### TC-3.1 — Auto-seed on First Load
1. Sidebar → **Academics → Subject Categories**.

Expected: Six seeded rows: `Languages`, `Sciences`, `Mathematics`, `Humanities`,
`Technical`, `Applied Sciences`. Each has a default calculation type
(LANGUAGE / SCIENCE / GENERAL).

Result: ☐

### TC-3.2 — Bind Default Grading System per Category
1. Edit `Sciences`:
   - Default Grading System: `WikiTeq KCSE`
   - Default Calculation: `SCIENCE`
2. Edit `Languages`:
   - Default Grading System: `WikiTeq KCSE`
   - Default Calculation: `LANGUAGE`
3. Edit `Mathematics`, `Humanities`, `Technical`, `Applied Sciences`:
   - Default Grading System: `WikiTeq KCSE`
   - Default Calculation: `GENERAL`
4. Save each.

Expected: List view shows the bound grading system name per row.

Result: ☐

### TC-3.3 — Create New Category
1. Click **New Category**.
2. Enter:
   - Name: `Vocational`
   - Description: `Vocational subjects (Home Science, Art & Design).`
   - Default Grading System: `WikiTeq KCSE`
   - Default Calculation: `GENERAL`
3. Save.

Expected: Row appears, `Active`, subject count 0.

Result: ☐

### TC-3.4 — Prevent Duplicate Names
1. Try creating another category named `Languages`.

Expected: Backend returns a validation error toast; no duplicate row created.

Result: ☐

### TC-3.5 — Deactivate Category
1. Edit `Vocational`, uncheck **Active**, Save.
2. Reload the page.

Expected: Row shows `Inactive`. Category should not appear in Subject creation
category dropdown.

Result: ☐

### TC-3.6 — Delete Empty Category
1. Delete `Vocational`.

Expected: Deleted immediately (subject count is 0).

Result: ☐

---

## 4. Subjects

### TC-4.1 — Open Subjects
1. Sidebar → **Academics → Subjects**.

Expected: Table lists any existing seed subjects. Curriculum filter defaults to
`All`.

Result: ☐

### TC-4.2 — Create English (Language)
1. Click **New Subject**.
2. Enter:
   - Code: `ENG`
   - Name: `English`
   - Curriculum: `8-4-4`
   - Category: `Languages`
   - Grading System: *(leave blank to inherit category default)*
   - Max Score: `100`
   - Compulsory: ✔
3. Save.

Expected: Row shows Category `Languages`, Grading System `WikiTeq KCSE` (inherited).

Result: ☐

### TC-4.3 — Create Kiswahili (Language)
- Code `KIS`, Name `Kiswahili`, Curriculum `8-4-4`, Category `Languages`, Compulsory ✔.

Result: ☐

### TC-4.4 — Create Mathematics
- Code `MAT`, Name `Mathematics`, Curriculum `8-4-4`, Category `Mathematics`, Compulsory ✔.

Result: ☐

### TC-4.5 — Create Sciences
Create each with Curriculum `8-4-4`, Category `Sciences`, Max Score `100`,
Compulsory unchecked:
- `BIO` — Biology
- `CHE` — Chemistry
- `PHY` — Physics

Result: ☐

### TC-4.6 — Create Humanities
- `GEO` — Geography, Category `Humanities`
- `HIS` — History & Government, Category `Humanities`
- `CRE` — Christian Religious Education, Category `Humanities`

Result: ☐

### TC-4.7 — Create Technicals
- `BUS` — Business Studies, Category `Technical`
- `AGR` — Agriculture, Category `Applied Sciences`
- `COM` — Computer Studies, Category `Technical`

Result: ☐

### TC-4.8 — Override Grading System at Subject Level
1. Edit `Mathematics`.
2. Grading System: `8-4-4 Default (KCSE)` (override the category default).
3. Save.

Expected: Subject row shows Grading System `8-4-4 Default (KCSE)`.
Category default remains `WikiTeq KCSE`.

Result: ☐

### TC-4.9 — Create a CBE Subject
- Code `MTC`, Name `Mathematics (Junior)`, Curriculum `CBC`, Category
  `Mathematics`, Grading System: inherit.

Expected: Grading System resolves to `CBE 2026 Rubric` or `CBE Default
(Migrated)` depending on category binding.

Result: ☐

### TC-4.10 — Validation: Missing Code
1. Try to create a subject with blank Code.

Expected: Form error `Code is required`. No API call fires.

Result: ☐

### TC-4.11 — Validation: Duplicate Code
1. Attempt to create another subject with code `ENG`.

Expected: Server returns `Duplicate subject code`; toast displays it.

Result: ☐

### TC-4.12 — Deactivate Subject
1. Edit `Computer Studies`, uncheck Active, Save.

Expected: Subject disappears from Subject Allocation dropdowns but remains in
the Subjects list with badge `Inactive`.

Result: ☐

---

## 5. Paper Configuration

### TC-5.1 — Open Paper Structure for English
1. Subjects → row `English` → **⋮ menu → Papers**.

Expected: Papers dialog opens with empty state.

### TC-5.2 — Configure English Papers (Weighted Language)
Add three rows:

| Paper No | Name | Max | Contribution % |
|---|---|---|---|
| 1 | Functional Writing | 60 | 40 |
| 2 | Comprehension & Grammar | 80 | 40 |
| 3 | Creative Composition | 60 | 20 |

Save.

Expected:
- Total contribution shows `100%` in green.
- Toast `Papers saved`.

Result: ☐

### TC-5.3 — Contribution ≠ 100% Rejected
1. Reopen Papers for `English`.
2. Change Paper 3 contribution to `10%`.
3. Save.

Expected: Save button disabled or error `Contributions must total 100%`.

Restore to 20% and Save again.

Result: ☐

### TC-5.4 — Configure Biology Papers (Science 60:40)
English uses weighted; Biology uses Science compute (theory 60, practical 40).
Add:

| Paper No | Name | Max | Contribution % |
|---|---|---|---|
| 1 | Theory Paper 1 | 80 | 30 |
| 2 | Theory Paper 2 | 80 | 30 |
| 3 | Practical | 40 | 40 |

Save.

Result: ☐

### TC-5.5 — Configure Chemistry Papers
Same structure as Biology (80/80/40, 30/30/40).

Result: ☐

### TC-5.6 — Configure Physics Papers
Same structure as Biology.

Result: ☐

### TC-5.7 — Configure Kiswahili Papers

| Paper No | Name | Max | Contribution % |
|---|---|---|---|
| 1 | Insha | 40 | 25 |
| 2 | Lugha | 80 | 50 |
| 3 | Fasihi | 80 | 25 |

Save.

Result: ☐

### TC-5.8 — Mathematics Single Paper
1. Open Papers dialog.
2. Add:
   - Paper 1 `Mathematics Paper 1` Max `100` Contribution `50`
   - Paper 2 `Mathematics Paper 2` Max `100` Contribution `50`

Save.

Result: ☐

### TC-5.9 — Paper Max Exceeds Subject Max
1. Edit Mathematics: Max Score `100`.
2. Try adding a paper with Max `150`.

Expected: Validation error `Paper max cannot exceed subject max`.

Result: ☐

### TC-5.10 — Delete a Paper
1. Delete Paper 3 from Kiswahili.
2. Total drops to 75%. Save should be blocked. Re-add Paper 3.

Result: ☐

---

## 6. Teachers

### TC-6.1 — Open Staff Directory
1. Sidebar → **HR → Staff Directory**.

Result: ☐

### TC-6.2 — Create Teacher John Kamau
1. Click **New Staff**.
2. Enter:
   - First Name: `John`
   - Last Name: `Kamau`
   - Payroll No: `T-001`
   - National ID: `22334455`
   - TSC No: `123456`
   - Email: `john.kamau@nbhs.ac.ke`
   - Phone: `+254712345001`
   - Role: `Teacher`
   - Designation: `Senior Teacher`
   - Department: `Mathematics & Sciences`
3. Save.

Expected: Toast `Staff created`. Row appears.

Result: ☐

### TC-6.3 — Create All Remaining Teachers
Repeat TC-6.2 for T-002 through T-007 using the reference table at the top of
this document. Use email pattern `firstname.lastname@nbhs.ac.ke` and phones
`+254712345002` through `+254712345007`.

Result: ☐

### TC-6.4 — Assign Subjects to Teachers
1. For each teacher, click **Edit → Subjects tab**.
2. Tick the subjects per the reference table.
3. Save.

Expected: Teacher card shows subject chips.

Result: ☐

---

## 7. Classes & Streams

### TC-7.1 — Create Grades
1. Sidebar → **Academics → Classes**.
2. Ensure grades exist: `Grade 9`, `Form 2`, `Form 3`, `Form 4`. If missing:
   - Click **New Grade** → Name e.g. `Form 3`, Level `Senior Secondary`,
     Curriculum `8-4-4`, Order `11`.

Result: ☐

### TC-7.2 — Create Streams
1. Sidebar → **Academics → Streams**.
2. For each grade, click **New Stream** and enter:

| Grade | Stream Name | Capacity | Class Teacher |
|---|---|---|---|
| Form 3 | East | 40 | Grace Wanjiru |
| Form 3 | West | 40 | John Kamau |
| Form 4 | East | 40 | Mary Achieng |
| Form 4 | West | 40 | David Mwangi |
| Grade 9 | Blue | 45 | Faith Njeri |
| Grade 9 | Green | 45 | Peter Otieno |

Result: ☐

### TC-7.3 — Assign Class Teacher
1. Sidebar → **Academics → Assign Class Teacher**.
2. Verify assignments made in TC-7.2 appear.
3. Reassign `Form 3 East` to `John Kamau` then back to `Grace Wanjiru`.

Expected: Change persists after refresh.

Result: ☐

---

## 8. Subject Allocation (Class Level)

### TC-8.1 — Allocate Compulsory Subjects to Form 3
1. Sidebar → **Academics → Subject Allocation**.
2. Filter: Grade `Form 3`.
3. In the **Compulsory** panel, allocate:
   - English (Grace Wanjiru)
   - Kiswahili (Peter Otieno)
   - Mathematics (John Kamau)
   - Biology (Mary Achieng)
   - Chemistry (Mary Achieng)
4. Save.

Expected: Rows saved and appear immediately in the roster panel.

Result: ☐

### TC-8.2 — Create Optional Group (Form 3)
1. Click **New Optional Group**.
2. Enter:
   - Name: `Group III (Humanities & Sciences)`
   - Min Picks: `2`
   - Max Picks: `3`
3. Add subjects: Physics, Geography, History & Government, CRE, Business Studies, Agriculture, Computer Studies.
4. Save.

Result: ☐

### TC-8.3 — Validation: Optional Group Bounds
1. Try creating a group with Min `4` and Max `2`.

Expected: Error `Min cannot exceed Max`.

Result: ☐

### TC-8.4 — Repeat Allocation for Form 4
Repeat TC-8.1 and TC-8.2 for `Form 4` with the same subject/teacher
assignments.

Result: ☐

---

## 9. Student Subject Registration

### TC-9.1 — Register Students Under `Form 3 East`
1. Sidebar → **Students** → Filter Stream `Form 3 East`.
2. Create each student from the sample roster (Adm No, Names, Gender, KCPE,
   DOB `2008-05-14` etc.).

Result: ☐

### TC-9.2 — Open Registration Panel
1. Subject Allocation → filter Grade `Form 3`, Stream `East`.
2. Click the **Registration** tab.

Expected: List of 20 students with checkboxes per optional subject in Group III.

Result: ☐

### TC-9.3 — Bulk Register Compulsory
1. Click **Bulk Register → All Compulsory**.
2. Confirm.

Expected: Every student is now registered for English, Kiswahili, Mathematics,
Biology, Chemistry. Toast `Registered 100 rows`.

Result: ☐

### TC-9.4 — Register Optional Picks
Register these specific picks:

| Adm No | Optionals |
|---|---|
| NB/2024/001 | Physics, Geography, Business Studies |
| NB/2024/002 | Geography, History, CRE |
| NB/2024/003 | Physics, Agriculture |
| NB/2024/004 | Physics, Geography, Computer Studies |
| NB/2024/005 | History, CRE, Business Studies |
| NB/2024/006 | Geography, Business Studies, Agriculture |
| NB/2024/007 | Physics, History |
| NB/2024/008 | Physics, Geography, Business Studies |
| NB/2024/009 | History, CRE, Agriculture |
| NB/2024/010 | Physics, Geography, Computer Studies |

Save.

Result: ☐

### TC-9.5 — Enforce Min/Max Picks
1. For NB/2024/007, try to remove Physics leaving only History.

Expected: Error `At least 2 optional subjects required from Group III`.

Result: ☐

### TC-9.6 — Enforce Max Picks
1. For NB/2024/003, add Geography, History, CRE and Computer Studies.

Expected: Error `At most 3 optional subjects allowed`.

Result: ☐

---

## 10. Assessment Creation — CBE

### TC-10.1 — Create CBE Opener
1. Sidebar → **Assessments → Assessments**.
2. Click **New Assessment**.
3. Enter:
   - Name: `Grade 9 CBE Opener Assessment 2026 T2`
   - Curriculum: `CBC`
   - Term: `2026 · Term 2`
   - Weight: `30`
   - Start Date: today
   - End Date: today + 3 days
   - Classes: `Grade 9 Blue`, `Grade 9 Green`
4. Save.

Expected: Row appears with curriculum badge `CBE`; status `Draft`.

Result: ☐

### TC-10.2 — Verify Subject Snapshot (CBE)
1. Open the assessment → **Subjects** tab.

Expected: Compulsory subjects allocated to Grade 9 are listed with the resolved
Grading System name.

Result: ☐

### TC-10.3 — Publish CBE Assessment
1. Click **Publish**.

Expected: Status flips to `Published`. Confirmation toast.

Result: ☐

---

## 11. Assessment Creation — 8-4-4

### TC-11.1 — Create 8-4-4 End Term
1. **New Assessment**.
2. Enter:
   - Name: `Form 3 & 4 End Term 2 Examination 2026`
   - Curriculum: `8-4-4`
   - Term: `2026 · Term 2`
   - Weight: `70`
   - Classes: `Form 3 East`, `Form 3 West`, `Form 4 East`, `Form 4 West`
3. Save.

Expected: Row shows curriculum `8-4-4`, status `Draft`.

Result: ☐

### TC-11.2 — Verify Per-Grade Snapshot
1. Open the assessment → **Subject Configuration** tab.
2. Toggle Grade filter between `Form 3` and `Form 4`.

Expected:
- Both grades show snapshots for each subject with paper structure copied from
  Subject Configuration.
- Grading System column shows the resolved system per subject.

Result: ☐

### TC-11.3 — Assessment-Scoped Paper Override
1. Under Form 3, edit `Biology` papers.
2. Reduce to a single paper: Paper 1 `Biology Composite`, Max 100, Contribution
   100.
3. Save.

Expected: Form 3 Biology now shows 1 paper; Form 4 Biology still shows 3 papers.
Row shows `Customized` badge.

Result: ☐

### TC-11.4 — Publish 8-4-4 Assessment
Click **Publish**. Expect status → `Published`.

Result: ☐

### TC-11.5 — Snapshot Freeze After Marks Entry
*(Deferred verification — checked in TC-13.11.)*

---

## 12. Marks Entry — CBE

### TC-12.1 — Open CBE Marks Entry
1. Sidebar → **Assessments → Marks Entry**.
2. Select `Grade 9 CBE Opener Assessment 2026 T2`.
3. Select Class `Grade 9 Blue`, Subject `Mathematics (Junior)`.

Expected: Roster loads; each row shows score input and grade preview column.

Result: ☐

### TC-12.2 — Enter Scores and Verify Grades
Enter scores for 6 students:

| Student | Score | Expected Grade |
|---|---|---|
| Blue-01 | 82 | EE |
| Blue-02 | 65 | ME |
| Blue-03 | 40 | AE |
| Blue-04 | 15 | BE |
| Blue-05 | 76 | EE |
| Blue-06 | 51 | ME |

Click **Save Marks**.

Expected: Grade previews match; toast `Marks saved`.

Result: ☐

### TC-12.3 — Auto-generated Remarks
1. Reopen the same page.

Expected: Each saved row has an auto-remark matching the band (e.g. `Meeting
Expectation — keep it up`).

Result: ☐

### TC-12.4 — Capture Competencies
1. Click **Competencies** on a student.
2. Rate each strand `EE / ME / AE / BE`.
3. Save.

Expected: Persists across reload.

Result: ☐

### TC-12.5 — Validation: Score Out of Range
Enter `120`. Expect error `Score must be 0–100`.

Result: ☐

---

## 13. Marks Entry — 8-4-4

### TC-13.1 — Open 8-4-4 Marks Entry
1. Marks Entry → select `Form 3 & 4 End Term 2 Examination 2026`.
2. Class `Form 3 East`, Subject `English`.

Expected: Roster shows 20 students. Paper columns visible: `P1 /60`, `P2 /80`,
`P3 /60`, plus `Total /100`, `Grade`, `Points`.

Result: ☐

### TC-13.2 — Enter English Marks (Weighted Language)

| Adm | P1/60 | P2/80 | P3/60 | Expected % | Grade |
|---|---|---|---|---|---|
| NB/2024/001 | 48 | 64 | 45 | 80.0 | A |
| NB/2024/002 | 42 | 56 | 42 | 70.0 | B+ |
| NB/2024/003 | 30 | 48 | 30 | 50.0 | C |
| NB/2024/004 | 54 | 72 | 54 | 90.0 | A |
| NB/2024/005 | 24 | 40 | 24 | 40.0 | D+ |
| NB/2024/006 | 36 | 52 | 36 | 60.0 | B- |
| NB/2024/007 | 18 | 32 | 18 | 30.0 | D- |
| NB/2024/008 | 51 | 68 | 51 | 85.0 | A |
| NB/2024/009 | 33 | 48 | 33 | 55.0 | C+ |
| NB/2024/010 | 27 | 44 | 27 | 45.0 | C- |

Formula reminder: `%` = (P1/60·0.40 + P2/80·0.40 + P3/60·0.20) × 100.

Save.

Expected: Computed % matches the table within ±0.5.

Result: ☐

### TC-13.3 — Enter Biology Marks (Form 4 — Science 3-paper 30/30/40)
1. Class `Form 4 East`, Subject `Biology`.
2. Enter:

| Adm | P1/80 | P2/80 | P3/40 | Expected % |
|---|---|---|---|---|
| NB/2023/001 | 64 | 60 | 32 | 80.0 |
| NB/2023/002 | 40 | 44 | 20 | 51.0 |
| NB/2023/003 | 20 | 24 | 12 | 27.0 |

Save.

Result: ☐

### TC-13.4 — Enter Biology (Form 3 — Single Paper Override)
1. Class `Form 3 East`, Subject `Biology`.

Expected: Only one paper column visible (`Biology Composite /100`) — proves the
per-grade override is honored.

Enter 55, 78, 42, 91, 30, 66, 22, 88, 47, 60. Save.

Result: ☐

### TC-13.5 — Enter Kiswahili
Class `Form 3 East`. Weighted 25/50/25:

| Adm | P1/40 | P2/80 | P3/80 | Expected % |
|---|---|---|---|---|
| NB/2024/001 | 32 | 64 | 64 | 80.0 |
| NB/2024/002 | 24 | 56 | 48 | 66.5 |
| NB/2024/003 | 16 | 40 | 32 | 45.0 |

Save.

Result: ☐

### TC-13.6 — Enter Mathematics
Two papers, 50/50 average.

| Adm | P1/100 | P2/100 | Expected % |
|---|---|---|---|
| NB/2024/001 | 78 | 82 | 80.0 |
| NB/2024/002 | 60 | 66 | 63.0 |
| NB/2024/003 | 30 | 34 | 32.0 |

Save.

Result: ☐

### TC-13.7 — Enter Chemistry (Form 3 East)
Same 3-paper Science structure as Biology Form 4. Enter values for all 20
students within realistic ranges (20–85).

Result: ☐

### TC-13.8 — Enter Physics (Only Registered Students)
1. Open Marks Entry for Physics, Form 3 East.

Expected: Roster only lists students registered for Physics per TC-9.4
(001, 003, 004, 007, 008, 010). NB/2024/002, 005, 006, 009 must NOT appear.

Enter scores. Save.

Result: ☐

### TC-13.9 — Missing Paper Behavior
1. For NB/2024/001 in Biology (Form 4), clear Paper 3 and Save.

Expected: Total recomputes using P1+P2 only *if* the compute engine handles
partial (documented behavior: missing paper = 0 for that paper).

Result: ☐

### TC-13.10 — Score Out of Paper Max
1. Try entering `85` for Physics Paper 3 (max 40).

Expected: Field turns red; save blocked with `Score exceeds paper max`.

Result: ☐

### TC-13.11 — Assessment Config Locked After Marks
1. Return to the Assessment Subject Configuration for `Form 3 East → Biology`.
2. Attempt to change the paper structure.

Expected: Fields are read-only with badge `Locked (marks entered)`.

Result: ☐

### TC-13.12 — Bulk Import CSV
1. Download the CSV template from Marks Entry (`Bulk Import → Template`).
2. Fill in 20 rows for Form 3 East, Geography.
3. Upload.

Expected: Preview modal shows validation summary; on Confirm, marks appear in
the grid.

Result: ☐

### TC-13.13 — Concurrent Save Conflict
1. Open the same Marks Entry page in two tabs.
2. Save different values for the same student.

Expected: Second save receives a conflict warning or overwrites with an audit
entry; no data corruption.

Result: ☐

---

## 14. Computation

### TC-14.1 — Trigger Compute Results (CBE)
1. Open `Grade 9 CBE Opener Assessment 2026 T2` → **Results** tab.
2. Click **Compute Results**.

Expected: Progress toast → results grid populates with grade + points per
subject and mean band.

Result: ☐

### TC-14.2 — Trigger Compute Results (8-4-4)
1. Open the 8-4-4 assessment → **Results** tab.
2. Click **Compute Results**.

Expected: Rows show per-subject grade + points, total points, mean points,
mean grade, position.

Result: ☐

### TC-14.3 — Missing Marks = 0 for Ranking
1. Verify NB/2024/007 (who is not registered for CRE) has no CRE column but
   still receives a rank.
2. Verify NB/2024/001 (missing one paper if left blank in TC-13.9) has that
   paper counted as 0.

Result: ☐

### TC-14.4 — Best Seven Aggregate (KCSE)
1. For a Form 4 student, verify the aggregate uses only their best 7 subjects.
2. Confirm the ordering rule: English + Mathematics + best sciences +
   humanities per KCSE cluster.

Result: ☐

### TC-14.5 — Mean Grade from Mean Points
1. Take a Form 4 student with mean points = 9.2.
2. Confirm mean grade is `B` (per WikiTeq KCSE scale).

Result: ☐

### TC-14.6 — Recompute
1. Change one score in Marks Entry.
2. Click **Recompute**.

Expected: Only affected rows update; positions re-rank; audit entry logged.

Result: ☐

### TC-14.7 — Publish Results
Click **Publish Results**.
Expected: Status → `Published`. Parents/students can see them (verified later).

Result: ☐

### TC-14.8 — Lock Results
Click **Lock**. Try to re-enter a mark.

Expected: Marks Entry read-only with badge `Results Locked`.

Result: ☐

---

## 15. Results Page

### TC-15.1 — Filter by Stream
1. Assessments → Results.
2. Filter Stream `Form 3 East`.

Expected: Only 20 students shown, ranked 1–20.

Result: ☐

### TC-15.2 — Filter by Grade
Filter Grade `Form 3` (both streams).
Expected: 40 rows if both streams have marks; else all with marks.

Result: ☐

### TC-15.3 — Sort by Total Points
Click column `Total Points`.
Expected: Order descending; row 1 has highest points.

Result: ☐

### TC-15.4 — Student Detail Drawer
Click NB/2024/001 row.
Expected: Right drawer shows subjects table + 6-term trend chart + remarks.

Result: ☐

### TC-15.5 — Remarks
1. In drawer, edit Class Teacher's remark to
   `Excellent progress — maintain the momentum.`
2. Edit Head Teacher remark to `A commendable performance.`
3. Save.

Expected: Persists after refresh; appears on Report Card.

Result: ☐

---

## 16. Report Cards

### TC-16.1 — Generate Single CBE Report Card
1. Sidebar → **Assessments → Report Cards**.
2. Assessment `Grade 9 CBE Opener Assessment 2026 T2`.
3. Student `Grade 9 Blue — Blue-01`.
4. Click **Generate**.

Expected: PDF opens with school header, bands, competencies, remarks.
Wording: `LEARNER'S NAME`.

Result: ☐

### TC-16.2 — Generate 8-4-4 Report Card (Zeraki-style)
1. Assessment `Form 3 & 4 End Term 2 Examination 2026`.
2. Student `NB/2024/001`.
3. Generate.

Expected: PDF shows:
- Subject-centric grid (papers NOT shown to student).
- Grade, points, subject remark per row.
- Mean grade + total points + position + stream position.
- Class teacher & head teacher remarks.

Result: ☐

### TC-16.3 — Toggle `Show Position`
1. Report Card Templates → edit template → uncheck `Show Position`.
2. Regenerate NB/2024/001's card.

Expected: Position row hidden.

Restore setting.

Result: ☐

### TC-16.4 — Bulk Generate Stream ZIP
1. Report Cards → filter Stream `Form 3 East`.
2. Click **Generate All → ZIP**.

Expected: ZIP downloads with 20 PDFs named `NB-2024-001_Brian_Mwangi.pdf` etc.
No `archiver is not a function` error.

Result: ☐

### TC-16.5 — Combined PDF Download
Click **Generate All → Combined PDF**.
Expected: Single PDF with 20 cards, page breaks between students.

Result: ☐

### TC-16.6 — Class Report
Reports → Class Report → Form 3 East → generate.
Expected: Summary with mean, top/bottom students, subject means.

Result: ☐

### TC-16.7 — Subject Report (Biology, Form 4)
Expected: Distribution across grades, teacher name, mean.

Result: ☐

### TC-16.8 — Teacher Report (John Kamau)
Expected: All subjects and streams taught, mean per stream.

Result: ☐

### TC-16.9 — KCSE Aggregate Report
1. Reports → **KCSE Aggregate**.
2. Grade `Form 4`, Assessment same.

Expected: Table with best-7 breakdown, mean grade, points, KCSE cluster.

Result: ☐

---

## 17. Analytics

### TC-17.1 — Overview Cards
Assessments → Analytics → assessment `Form 3 & 4 End Term 2 Examination 2026`.
Expected: Cards `Total Students`, `Mean Score`, `Mean Grade`, `Best/Worst
Performing Subject`.

Result: ☐

### TC-17.2 — Subject Bars
Expected: Bar chart per subject with mean %; hover shows count and mean.

Result: ☐

### TC-17.3 — Grade Distribution
Expected: Bar chart A → E with counts summing to (students × subjects).

Result: ☐

### TC-17.4 — Stream Comparison
Filter Grade `Form 3` → view Stream comparison.
Expected: Two bars (East, West) with distinct means.

Result: ☐

### TC-17.5 — Leaderboard Pagination
Scroll to Leaderboard → set page size 5 → paginate.
Expected: Ranks preserved, pagination stable.

Result: ☐

### TC-17.6 — Filter Persistence
Refresh page.
Expected: Filter state (assessment, grade, stream) persists via URL or context.

Result: ☐

---

## 18. Rankings

### TC-18.1 — Rank by Mean Score (CBE)
Results filter Assessment `Grade 9 CBE Opener` → sort by Mean %.
Expected: Correct descending order.

Result: ☐

### TC-18.2 — Rank by Total Points (8-4-4)
Assessment `Form 3 & 4 End Term 2 Examination 2026` → sort by Total Points.
Expected: Row 1 = highest points; ties broken by mean score.

Result: ☐

### TC-18.3 — Stream Position vs Overall Position
Verify NB/2024/001's `Stream Pos` and `Overall Pos` differ where appropriate.

Result: ☐

### TC-18.4 — Rank Recomputes After Edit
Change NB/2024/002 English P2 from 56 to 78, Save, Recompute.
Expected: NB/2024/002 rank improves; other ranks shift.

Result: ☐

---

## 19. Exports

### TC-19.1 — Export Results to PDF
Results → Export → PDF (Form 3 East).
Expected: Lato-styled PDF with school header, ranked table.

Result: ☐

### TC-19.2 — Export Results to Excel
Export → XLSX.
Expected: File opens in Excel with columns: Rank, Adm No, Name, per-subject
grade+points, Total Points, Mean, Grade.

Result: ☐

### TC-19.3 — Export Results to CSV
Export → CSV.
Expected: UTF-8 CSV, opens cleanly in Google Sheets.

Result: ☐

### TC-19.4 — Analytics Export PDF
Analytics → Export.
Expected: PDF matches on-screen charts.

Result: ☐

### TC-19.5 — Rankings CSV
Rankings tab → Export CSV.
Expected: Rows ordered by rank.

Result: ☐

---

## 20. Negative Testing

### TC-20.1 — Publish Without Marks
Create a new assessment, publish, compute results without any marks.
Expected: Warning `No marks recorded` — no crash.

Result: ☐

### TC-20.2 — Delete a Published Assessment
Try deleting `Form 3 & 4 End Term 2 Examination 2026` after publish.
Expected: Blocked with error `Cannot delete published assessment`.

Result: ☐

### TC-20.3 — Delete Grading System In Use
Try deleting `WikiTeq KCSE` while assigned to subjects.
Expected: FK error / friendly message `System is in use`.

Result: ☐

### TC-20.4 — Delete Subject with Marks
Delete `English` after marks entry.
Expected: Blocked or soft-deactivated.

Result: ☐

### TC-20.5 — Non-Numeric Marks
Enter `abc` in Marks Entry.
Expected: Field validation error; no save.

Result: ☐

### TC-20.6 — SQL Injection Guard
Enter `'; DROP TABLE assessments;--` as an assessment name.
Expected: Accepted as plain text; no side effects; no 500.

Result: ☐

### TC-20.7 — XSS Guard
Enter `<script>alert(1)</script>` as a remark.
Expected: Rendered as text on the Report Card, not executed.

Result: ☐

### TC-20.8 — Cross-Tenant Access
Log in as another school's admin. Attempt `GET /api/v1/assessments/{id}` where
id belongs to Nairobi Boys.
Expected: 404 or 403.

Result: ☐

### TC-20.9 — Unauthorized Role
Log in as `Teacher` role. Try to publish results.
Expected: 403 Forbidden.

Result: ☐

### TC-20.10 — Compute While Locked
Try computing after Lock.
Expected: Error `Results locked. Unlock to recompute.`

Result: ☐

---

## 21. Performance Testing

### TC-21.1 — Marks Entry Roster Load Time (20 students)
Measure time from clicking subject to grid render.
Target: < 1.5 s on production.

Result: ☐

### TC-21.2 — Compute Results — Full Assessment
Trigger compute for Form 3 & 4 (est. 80+ students × 8 subjects).
Target: < 15 s.

Result: ☐

### TC-21.3 — Bulk Report Card ZIP
Generate 40 Form 3 report cards.
Target: < 60 s; ZIP < 20 MB.

Result: ☐

### TC-21.4 — Analytics Page First Paint
Target: < 2 s.

Result: ☐

### TC-21.5 — Concurrent Marks Entry
Two teachers editing different subjects at the same time.
Expected: No lock contention; both saves succeed.

Result: ☐

### TC-21.6 — Large Class (500 Students)
Import 500 students under a test stream; enter marks in bulk CSV.
Target: Import < 20 s; grid pagination works.

Result: ☐

---

## 22. Edge Cases

### TC-22.1 — Score Exactly on Boundary
Enter 80.00 for English → Expected Grade `A` (per WikiTeq KCSE where A = 80–100).
Enter 79.99 → Expected `A-`.

Result: ☐

### TC-22.2 — Absent Student
Mark NB/2024/005 absent (leave scores blank + tick Absent).
Expected: Row shows `ABS`; excluded from mean but ranked last with 0 points.

Result: ☐

### TC-22.3 — Transferred Student Mid-Term
Transfer NB/2024/006 to another stream after marks entry.
Expected: Historical marks remain visible under `Form 3 East` archive.

Result: ☐

### TC-22.4 — Zero Total Score
Enter 0 for all papers in Chemistry for one student.
Expected: Grade `E`, Points `1`.

Result: ☐

### TC-22.5 — Perfect Score
Enter maximum in all papers.
Expected: Grade `A`, Points `12`, no computational overflow.

Result: ☐

### TC-22.6 — Mixed Curriculum Same School
Verify Grade 9 CBE assessment and Form 3 8-4-4 assessment coexist without
contamination in Analytics or Rankings.

Result: ☐

### TC-22.7 — Subject Without Papers Configured
Create `Music` subject with no paper structure. Attach to an assessment.
Expected: Marks Entry uses single-column `Score /100`.

Result: ☐

### TC-22.8 — Optional Group Under-Selection at Compute Time
A student has only 1 optional pick.
Expected: Compute either enforces min or reports the student under `Data
Quality Warnings`.

Result: ☐

### TC-22.9 — Assessment Spanning Two Grades with Different Paper Structures
Verify Biology in Form 3 (1 paper override) vs Form 4 (3 papers) produces
correct grades in one combined assessment (already exercised in TC-13.3/4;
re-verify here after compute).

Result: ☐

### TC-22.10 — Grading System Change Mid-Term
Attempt to change `WikiTeq KCSE` levels after marks are entered.
Expected: Change permitted for the *live template*, but assessment already
uses its frozen snapshot — results unchanged until recompute against new
snapshot (documented behavior).

Result: ☐

### TC-22.11 — Deactivate Subject Mid-Term
Deactivate `Business Studies` after marks are entered.
Expected: Existing marks & results preserved; new assessments do not offer it.

Result: ☐

### TC-22.12 — Time Zone Handling
Change local time to `Africa/Nairobi -1 h` and enter marks.
Expected: `submitted_at` timestamps stored in UTC and displayed in EAT.

Result: ☐

### TC-22.13 — Special Characters in Names
Add student `Björk O'Brien-Muthoni`.
Expected: Renders correctly in grid, PDF, exports (UTF-8 preserved).

Result: ☐

### TC-22.14 — Very Long Remark
Enter a 2,000-character remark.
Expected: Saved, wrapped correctly on Report Card; no overflow.

Result: ☐

### TC-22.15 — Duplicate Publish
Click **Publish** twice quickly.
Expected: Debounced; only one publish event; no duplicate audit entries.

Result: ☐

---

## Sign-off

| Role | Name | Date | Signature |
|---|---|---|---|
| QA Engineer | | | |
| Assessment Product Owner | | | |
| Engineering Lead | | | |
| Release Manager | | | |

**Release blocked if any test in Sections 1–20 is `❌ FAIL`.** Sections 21 and
22 findings must be triaged but may ship as known limitations.