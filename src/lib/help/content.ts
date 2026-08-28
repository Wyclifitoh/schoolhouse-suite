/**
 * CENTRALISED HELP CONTENT
 * ------------------------------------------------------------------
 * Every help article, troubleshooting guide, glossary term and release
 * note lives here so content can be updated in one place instead of
 * being scattered across components.
 *
 * Articles are plain data: a set of blocks rendered by <HelpArticleView/>.
 * Anything in the app can deep-link to an article by slug:
 *     /help/a/fee-structures
 */

import { PermissionCode } from "@/hooks/usePermission";

export type HelpBlock =
  | { type: "p"; text: string }
  | { type: "steps"; items: string[] }
  | { type: "list"; items: string[] }
  | { type: "note"; text: string }
  | { type: "warning"; text: string }
  | { type: "heading"; text: string };

export interface HelpArticle {
  slug: string;
  title: string;
  summary: string;
  category: HelpCategoryId;
  /** Optional gate — article is de-prioritised (not hidden) without it. */
  permission?: PermissionCode;
  keywords?: string[];
  popular?: boolean;
  blocks: HelpBlock[];
  related?: string[];
}

export interface TroubleshootingArticle {
  slug: string;
  title: string;
  category: HelpCategoryId;
  problem: string;
  causes: string[];
  solution: string[];
  checkNext: string[];
  keywords?: string[];
}

export type HelpCategoryId =
  | "getting-started"
  | "students"
  | "academics"
  | "assessments"
  | "finance"
  | "inventory"
  | "hr"
  | "reports"
  | "users"
  | "portal"
  | "troubleshooting";

export interface HelpCategory {
  id: HelpCategoryId;
  title: string;
  description: string;
  icon: string; // lucide icon name resolved in the UI
}

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Set up your school, academic year, terms and user accounts.",
    icon: "Rocket",
  },
  {
    id: "students",
    title: "Students",
    description: "Admissions, imports, profiles, promotion and transfers.",
    icon: "Users",
  },
  {
    id: "academics",
    title: "Academics",
    description: "Classes, streams, subjects and teacher allocation.",
    icon: "GraduationCap",
  },
  {
    id: "assessments",
    title: "Assessments",
    description: "Create assessments, enter marks, publish and report.",
    icon: "ClipboardList",
  },
  {
    id: "finance",
    title: "Finance",
    description: "Fee structures, payments, balances, statements and reports.",
    icon: "Wallet",
  },
  {
    id: "inventory",
    title: "Inventory",
    description: "Catalog, suppliers, stock movements, sales and issuance.",
    icon: "Package",
  },
  {
    id: "hr",
    title: "Human Resources",
    description: "Staff, departments, leave, payroll and staff accounts.",
    icon: "Briefcase",
  },
  {
    id: "reports",
    title: "Reports",
    description: "Academic, financial and student reports plus exports.",
    icon: "BarChart3",
  },
  {
    id: "users",
    title: "Users & Permissions",
    description: "Roles, permissions, multiple roles and access control.",
    icon: "Shield",
  },
  {
    id: "portal",
    title: "Parent & Student Portal",
    description: "Portal login, results, fees, statements and report cards.",
    icon: "School",
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    description: "Practical answers to the issues schools hit most often.",
    icon: "LifeBuoy",
  },
];

// ---------------------------------------------------------------------
// ARTICLES
// ---------------------------------------------------------------------

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: "getting-started",
    title: "Getting started with Chuo",
    summary:
      "The order to set things up so the rest of the system works correctly.",
    category: "getting-started",
    popular: true,
    keywords: ["setup", "first", "new school", "checklist"],
    blocks: [
      {
        type: "p",
        text: "Chuo works best when the school is configured from the top down: the academic calendar first, then structure, then people, then money.",
      },
      {
        type: "steps",
        items: [
          "Complete the school profile (name, contacts, logo).",
          "Create the academic year and set the current term.",
          "Create classes and streams.",
          "Add subjects, then allocate teachers to them.",
          "Add staff and give each of them the right roles.",
          "Add or import students into classes and streams.",
          "Create the fee structure for the current term and assign it.",
          "Configure assessment settings and grading bands.",
        ],
      },
      {
        type: "note",
        text: "The Getting Started checklist on your dashboard tracks these automatically from real data — nothing is marked complete unless it actually exists.",
      },
    ],
    related: ["academic-year-and-terms", "term-switching", "user-roles"],
  },
  {
    slug: "academic-year-and-terms",
    title: "Academic year and terms",
    summary:
      "What the current academic year and term control across the system.",
    category: "getting-started",
    popular: true,
    keywords: ["term", "year", "current", "calendar"],
    blocks: [
      {
        type: "p",
        text: "Almost every record in Chuo — fees, payments, assessments, attendance and reports — is stored against an academic year and a term.",
      },
      {
        type: "list",
        items: [
          "Current academic year: the default year new records are created in.",
          "Current term: the default term for billing, marks entry and reporting.",
          "Terms cannot overlap, and a term with history cannot be deleted.",
        ],
      },
      {
        type: "note",
        text: "Switching the current term never edits or deletes previous-term data. Previous terms remain fully readable and reportable.",
      },
    ],
    related: ["term-switching", "fee-structures"],
  },
  {
    slug: "term-switching",
    title: "Switching the current term",
    summary: "What to review before switching, and what happens afterwards.",
    category: "getting-started",
    popular: true,
    keywords: ["switch term", "new term", "rollover", "carry forward"],
    blocks: [
      {
        type: "heading",
        text: "Before you switch",
      },
      {
        type: "list",
        items: [
          "Review and publish (or lock) assessments for the closing term.",
          "Reconcile finance: confirm payments, unallocated money and balances.",
          "Confirm class and stream membership is accurate.",
        ],
      },
      { type: "heading", text: "What happens on switch" },
      {
        type: "list",
        items: [
          "New fee items are created as fresh rows for the new term — editing them cannot change the previous term.",
          "Outstanding balances become the new term's Balance B/F.",
          "Unused credit from previous terms shows as Excess B/F and is applied to new fees automatically.",
        ],
      },
      {
        type: "warning",
        text: "The new term starts with no assessments and no fee assignments until you create them. That is expected, not a data loss.",
      },
    ],
    related: ["fee-structures", "student-balances"],
  },
  {
    slug: "adding-students",
    title: "Adding and importing students",
    summary: "Add students individually or bring in a whole list at once.",
    category: "students",
    permission: "students:create",
    popular: true,
    keywords: ["admission", "import", "csv", "enrol"],
    blocks: [
      {
        type: "steps",
        items: [
          "Open Students and choose Add Student for a single admission.",
          "For bulk intake, choose Import Students and download the template first.",
          "Match every student to a class and stream — unassigned students will not appear in class lists or assessments.",
          "Review the import summary and fix any rejected rows before re-importing.",
        ],
      },
      {
        type: "note",
        text: "The admission number must be unique within your school. Re-using one is the most common cause of a failed import row.",
      },
    ],
    related: ["student-promotion", "why-cant-i-find-a-student"],
  },
  {
    slug: "student-promotion",
    title: "Promoting students",
    summary: "Move a cohort to the next class at the end of the year.",
    category: "students",
    permission: "students:promote",
    keywords: ["promote", "graduate", "repeat", "next class"],
    blocks: [
      {
        type: "p",
        text: "Promotion moves selected students from a source class to a destination class. Students you exclude stay where they are (repeat).",
      },
      {
        type: "steps",
        items: [
          "Confirm results for the closing year are final.",
          "Select the source class and the destination class.",
          "Review the student list carefully — deselect anyone repeating or leaving.",
          "Complete the promotion and spot-check a few profiles.",
        ],
      },
      {
        type: "warning",
        text: "Promotion changes class membership for every selected student. Review the list before confirming.",
      },
    ],
    related: ["adding-students", "term-switching"],
  },
  {
    slug: "classes-and-streams",
    title: "Classes, streams and subjects",
    summary: "How academic structure fits together.",
    category: "academics",
    keywords: ["class", "stream", "subject", "structure"],
    blocks: [
      {
        type: "list",
        items: [
          "Class: the grade or form level, e.g. Grade 5.",
          "Stream: a section within a class, e.g. Grade 5 RED. Streams keep class sizes manageable and drive registers and mark sheets.",
          "Subject: what is taught and assessed. Subjects must be allocated to teachers before those teachers can enter marks.",
        ],
      },
    ],
    related: ["teacher-allocation", "creating-assessments"],
  },
  {
    slug: "teacher-allocation",
    title: "Teacher subject allocation",
    summary: "Give teachers access to the subjects and classes they teach.",
    category: "academics",
    keywords: ["allocation", "teacher", "subject", "class teacher"],
    blocks: [
      {
        type: "p",
        text: "Allocation links a teacher to a subject in a specific class or stream. It controls which mark sheets a teacher can open.",
      },
      {
        type: "note",
        text: "If a teacher cannot see their subjects, check the allocation for the current academic year and term first, then their role permissions.",
      },
    ],
    related: ["why-cant-a-teacher-see-their-subjects", "user-roles"],
  },
  {
    slug: "creating-assessments",
    title: "Creating assessments and entering marks",
    summary: "From assessment creation through to published results.",
    category: "assessments",
    permission: "exams:create",
    popular: true,
    keywords: ["assessment", "marks", "cbe", "exam"],
    blocks: [
      {
        type: "steps",
        items: [
          "Create the assessment with a clear, recognisable name.",
          "Allocate subjects and papers to be assessed.",
          "Open the assessment so teachers can enter marks.",
          "Review entry progress and outliers.",
          "Lock the assessment to freeze editing, then publish results.",
        ],
      },
      {
        type: "note",
        text: "Reaching 100% marks entry never publishes anything by itself — publishing is always a deliberate action.",
      },
    ],
    related: ["assessment-statuses", "assessment-weighting"],
  },
  {
    slug: "assessment-statuses",
    title: "Understanding assessment statuses",
    summary: "Draft, Open, Completed, Published, Locked and Archived.",
    category: "assessments",
    popular: true,
    keywords: ["status", "lifecycle", "publish", "lock", "archive"],
    blocks: [
      {
        type: "list",
        items: [
          "Draft — being set up. Not visible to teachers for marks entry.",
          "Open — marks can be entered and edited.",
          "Completed — entry finished and awaiting review. Marks are frozen.",
          "Published — results are visible to parents and students.",
          "Locked — editing is frozen. Published results stay visible.",
          "Archived — kept for the record and reporting only.",
        ],
      },
      {
        type: "note",
        text: "The Status guide button on the Assessments page shows the same information with the exact actions allowed from each stage.",
      },
    ],
    related: ["creating-assessments", "why-cant-i-publish-an-assessment"],
  },
  {
    slug: "assessment-weighting",
    title: "Assessment weighting",
    summary: "How weights combine several assessments into one result.",
    category: "assessments",
    keywords: ["weight", "weighting", "average", "contribution"],
    blocks: [
      {
        type: "p",
        text: "A weight is the share an assessment contributes to the combined result. An assessment weighted 30% contributes 30% of the final mark regardless of the raw total.",
      },
      {
        type: "note",
        text: "Weights across the assessments in a reporting period should add up to 100%. Chuo will still calculate if they do not, but the result becomes harder to explain to parents.",
      },
    ],
    related: ["assessment-statuses"],
  },
  {
    slug: "fee-structures",
    title: "Fee structures",
    summary: "What students are expected to pay for an academic period.",
    category: "finance",
    permission: "finance:fees:read",
    popular: true,
    keywords: ["fee", "structure", "billing", "invoice", "assign"],
    blocks: [
      {
        type: "p",
        text: "A fee structure defines the fee items payable for a class in a specific academic year and term. Assigning it creates the student's bill.",
      },
      {
        type: "steps",
        items: [
          "Create or review the fee items for the current term.",
          "Assign the structure to the classes it applies to.",
          "Apply discounts, bursaries or adjustments where needed.",
          "Check the Fee Report to confirm billing looks right before communicating with parents.",
        ],
      },
      {
        type: "warning",
        text: "Changing a fee structure affects every student assigned to it. Review the affected students before saving.",
      },
    ],
    related: ["student-balances", "recording-payments"],
  },
  {
    slug: "recording-payments",
    title: "Recording payments",
    summary: "Capture a payment and allocate it to the right fees.",
    category: "finance",
    permission: "payments:create",
    popular: true,
    keywords: ["payment", "receipt", "mpesa", "cash", "allocate"],
    blocks: [
      {
        type: "steps",
        items: [
          "Open Payments and choose Record Payment.",
          "Select the student, the term the payment belongs to, and the method.",
          "Enter the amount and reference, then save.",
          "Print or download the receipt for the parent.",
        ],
      },
      {
        type: "note",
        text: "Money is allocated to outstanding fees oldest-first. Anything left over is held as credit and applied automatically to future fees.",
      },
    ],
    related: ["student-balances", "reversing-a-payment"],
  },
  {
    slug: "student-balances",
    title: "Student balances and statements",
    summary: "How the outstanding balance is calculated.",
    category: "finance",
    popular: true,
    keywords: ["balance", "outstanding", "statement", "b/f", "arrears"],
    blocks: [
      {
        type: "p",
        text: "Outstanding balance = Balance brought forward + billed fees for the period − discounts − payments allocated.",
      },
      {
        type: "list",
        items: [
          "Balance B/F — what was still owed when the term opened.",
          "Excess B/F — unused credit carried in from earlier terms.",
          "Balance — the closing position, which becomes next term's B/F.",
        ],
      },
      {
        type: "note",
        text: "Balances are always derived from actual payment allocations, so statements, receipts, the Fee Report and the dashboard agree with each other.",
      },
    ],
    related: ["recording-payments", "why-is-the-balance-different"],
  },
  {
    slug: "reversing-a-payment",
    title: "Reversing or voiding a payment",
    summary: "When to reverse, and what it changes.",
    category: "finance",
    permission: "payments:reverse",
    keywords: ["reverse", "void", "refund", "correction"],
    blocks: [
      {
        type: "warning",
        text: "Reversing a payment changes the financial transaction trail and the student's balance. It is recorded in the audit log and cannot be silently undone.",
      },
      {
        type: "steps",
        items: [
          "Open the payment and confirm the reference, amount and student.",
          "Reverse it with a clear reason.",
          "Re-record the correct payment if this was a data-entry error.",
        ],
      },
    ],
    related: ["recording-payments", "why-cant-i-reverse-a-payment"],
  },
  {
    slug: "inventory-basics",
    title: "Catalog, stock and sales",
    summary: "Run the school store with a reliable stock ledger.",
    category: "inventory",
    permission: "inventory:read",
    keywords: ["inventory", "stock", "store", "sale", "supplier"],
    blocks: [
      {
        type: "steps",
        items: [
          "Add categories, then products to the catalog.",
          "Record purchases or opening stock so quantities are accurate.",
          "Sell to students, or issue trackable items to staff.",
          "Use Movements to see every stock change and why it happened.",
        ],
      },
    ],
    related: ["inventory-adjustments"],
  },
  {
    slug: "inventory-adjustments",
    title: "Inventory adjustments",
    summary: "Correcting stock counts without losing the audit trail.",
    category: "inventory",
    permission: "inventory:update",
    keywords: ["adjustment", "damaged", "lost", "stock take"],
    blocks: [
      {
        type: "p",
        text: "An adjustment records a difference between counted stock and system stock. Every adjustment keeps a reason so the ledger stays explainable.",
      },
      {
        type: "note",
        text: "Use Damaged or Lost rather than a plain adjustment where the reason is known — reports separate them.",
      },
    ],
    related: ["inventory-basics"],
  },
  {
    slug: "staff-and-hr",
    title: "Staff, departments and leave",
    summary: "Manage people, structure and time off.",
    category: "hr",
    permission: "staff:read",
    keywords: ["staff", "hr", "department", "leave", "payroll"],
    blocks: [
      {
        type: "steps",
        items: [
          "Add the staff member with their contact details.",
          "Assign a department and designation.",
          "Assign roles so they get the right access.",
          "Send login credentials where the staff member needs a Chuo account.",
        ],
      },
    ],
    related: ["user-roles"],
  },
  {
    slug: "reports-and-exports",
    title: "Reports and exports",
    summary: "Find, filter and export the report you need.",
    category: "reports",
    permission: "reports:read",
    keywords: ["report", "export", "excel", "pdf", "download"],
    blocks: [
      {
        type: "p",
        text: "The Report Center groups every report by area. Reports respect your school, academic year and term context, plus your permissions.",
      },
      {
        type: "note",
        text: "Exports open in Excel-compatible format. Filters applied on screen are applied to the export as well.",
      },
    ],
    related: ["student-balances"],
  },
  {
    slug: "user-roles",
    title: "Roles, permissions and multiple roles",
    summary: "How access is decided in Chuo.",
    category: "users",
    permission: "roles:read",
    popular: true,
    keywords: ["role", "permission", "access", "rbac", "admin"],
    blocks: [
      {
        type: "p",
        text: "Access is decided by permissions, never by a role name. A user may hold several roles at once and receives the union of all their permissions.",
      },
      {
        type: "list",
        items: [
          "Roles group permissions so they can be granted consistently.",
          "Changing a role's permissions applies to every user holding it, within seconds.",
          "Administrators hold a wildcard permission that grants everything.",
        ],
      },
    ],
    related: ["why-cant-a-user-access-a-module", "teacher-allocation"],
  },
  {
    slug: "portal-getting-started",
    title: "Using the parent and student portal",
    summary: "Logging in, viewing results, fees and report cards.",
    category: "portal",
    keywords: ["parent", "student", "portal", "login", "password"],
    blocks: [
      {
        type: "steps",
        items: [
          "Open the portal link provided by the school and sign in with the phone number or email registered with the school.",
          "Use Forgot password to reset your password if you cannot sign in.",
          "Results shows published assessment results and report cards you can download.",
          "Fees shows current fees, payments made and the outstanding balance, plus statements.",
          "Profile lets you update the details the school allows you to change.",
        ],
      },
      {
        type: "note",
        text: "Results appear only after the school publishes them. If a result is missing, the assessment has not been published yet.",
      },
    ],
    related: ["assessment-statuses", "student-balances"],
  },
  {
    slug: "data-safety",
    title: "Data safety and backups",
    summary: "How your school's data is protected and recovered.",
    category: "getting-started",
    permission: "settings:read",
    keywords: ["backup", "restore", "data", "safety", "recovery"],
    blocks: [
      {
        type: "p",
        text: "Your school's records — students, staff, finance, assessments and inventory — are stored on the Chuo server managed by your provider.",
      },
      {
        type: "list",
        items: [
          "Destructive actions (deletes, reversals, publishes, term switches) are recorded in the audit log with the user and timestamp.",
          "Most mistakes are recoverable from the audit trail without a restore.",
          "Restoration from a backup is requested through your school administrator and handled by your Chuo provider.",
        ],
      },
      { type: "heading", text: "What happens when something is deleted" },
      {
        type: "list",
        items: [
          "Most records are deactivated rather than erased — students, staff and fee items stay in the system and remain visible in history and reports.",
          "Payments are never erased. Corrections are made by voiding or reversing, which leaves an audit trail.",
          "Deleting a class, subject or term is blocked whenever records already depend on it.",
        ],
      },
      { type: "heading", text: "How recovery works" },
      {
        type: "steps",
        items: [
          "Check first whether the record was only deactivated — the Disabled and Archives pages often bring it straight back.",
          "If not, open the audit log and find the action that removed or changed it; most mistakes can be undone from that record.",
          "If a restore is genuinely needed, report it from Help › Get help, stating what was lost and roughly when.",
          "Your administrator raises it with your Chuo provider, who confirms what can be recovered before anything is changed.",
        ],
      },
      {
        type: "note",
        text: "Only administrators with settings permission can request a restoration, and every request is logged with who asked and what changed.",
      },
      {
        type: "warning",
        text: "Chuo does not display a backup schedule unless your deployment reports one. Confirm the actual backup arrangement with your provider rather than assuming one exists.",
      },
    ],

  },
];

// ---------------------------------------------------------------------
// TROUBLESHOOTING
// ---------------------------------------------------------------------

export const TROUBLESHOOTING: TroubleshootingArticle[] = [
  {
    slug: "why-cant-i-find-a-student",
    title: "Why can't I find a student?",
    category: "students",
    problem: "A student you expect to see does not appear in a list or search.",
    causes: [
      "The student is inactive, archived or was transferred out.",
      "You are viewing a different academic year, term, class or stream.",
      "The student was never assigned to a class.",
      "Your role does not include access to that class.",
    ],
    solution: [
      "Clear the class, stream and status filters and search by admission number.",
      "Check the Disabled/Inactive students page.",
      "Confirm the academic year and term selected in the header.",
    ],
    checkNext: [
      "Open the student's profile and confirm their class assignment.",
      "Ask an administrator to confirm your access to that class.",
    ],
  },
  {
    slug: "why-is-a-student-missing-from-a-class",
    title: "Why is a student missing from a class?",
    category: "students",
    problem: "A student is enrolled but does not appear in the class list.",
    causes: [
      "No stream assigned within the class.",
      "The student was admitted into a different academic year.",
      "A promotion moved them to another class.",
    ],
    solution: [
      "Open the student profile and set the correct class and stream.",
      "Check the promotion history for the student.",
    ],
    checkNext: ["Refresh the class list and confirm the student now appears."],
  },
  {
    slug: "why-cant-i-promote-a-student",
    title: "Why can't I promote a student?",
    category: "students",
    problem: "Promotion is unavailable or a student cannot be selected.",
    causes: [
      "You do not hold the students:promote permission.",
      "No destination class exists for the next level.",
      "The student is inactive.",
    ],
    solution: [
      "Ask an administrator to grant the promotion permission.",
      "Create the destination class first.",
      "Reactivate the student, then promote.",
    ],
    checkNext: ["Re-open Promotion and confirm both classes are selectable."],
  },
  {
    slug: "why-did-my-student-import-fail",
    title: "Why did my student import fail?",
    category: "students",
    problem: "Some or all rows were rejected during import.",
    causes: [
      "Duplicate admission numbers.",
      "Class or stream names that do not match existing records exactly.",
      "Missing required columns or a modified template.",
      "Dates in an unexpected format.",
    ],
    solution: [
      "Download a fresh template and copy your data into it.",
      "Fix the rejected rows listed in the import summary and re-import only those rows.",
    ],
    checkNext: [
      "Confirm the imported count matches your source list.",
      "Spot-check a few profiles for correct class and stream.",
    ],
  },
  {
    slug: "why-cant-i-enter-marks",
    title: "Why can't I enter marks?",
    category: "assessments",
    problem: "The mark sheet is read-only or unavailable.",
    causes: [
      "The assessment is not in the Open status.",
      "You are not allocated to that subject, class or stream.",
      "You do not hold the marks entry permission.",
    ],
    solution: [
      "Ask the assessment owner to open the assessment.",
      "Ask an administrator to allocate you to the subject for this term.",
    ],
    checkNext: [
      "Check the assessment status badge.",
      "Confirm your subject allocation for the current term.",
    ],
  },
  {
    slug: "why-is-a-student-missing-from-an-assessment",
    title: "Why is a student missing from an assessment?",
    category: "assessments",
    problem: "A student does not appear on the mark sheet.",
    causes: [
      "The student is not in the class or stream the assessment covers.",
      "The student was admitted after the assessment was created.",
      "The student is inactive.",
    ],
    solution: [
      "Assign the student to the correct class and stream.",
      "Refresh the mark sheet — the roster is read live from class membership.",
    ],
    checkNext: ["Confirm the student's status is active."],
  },
  {
    slug: "why-cant-i-publish-an-assessment",
    title: "Why can't I publish an assessment?",
    category: "assessments",
    problem: "The publish action is missing or disabled.",
    causes: [
      "The assessment is not yet in a status that allows publishing.",
      "You do not hold the exams:publish permission.",
      "Marks entry is still incomplete and the workflow requires review first.",
    ],
    solution: [
      "Move the assessment through review, then publish.",
      "Ask an administrator for the publishing permission.",
    ],
    checkNext: [
      "Open the Status guide on the Assessments page to see which actions are allowed from the current stage.",
    ],
  },
  {
    slug: "why-are-some-marks-missing",
    title: "Why are some marks missing?",
    category: "assessments",
    problem: "Results show blanks for some students or subjects.",
    causes: [
      "Marks were never entered for that subject or paper.",
      "The subject is not allocated for that class.",
      "The student joined after marks entry closed.",
    ],
    solution: [
      "Re-open the assessment and complete the missing entries.",
      "Allocate the missing subject, then enter marks.",
    ],
    checkNext: ["Check the marks entry progress indicator per subject."],
  },
  {
    slug: "why-does-the-ranking-look-different",
    title: "Why does the ranking look different?",
    category: "assessments",
    problem: "Positions changed unexpectedly between views.",
    causes: [
      "Ranking scope differs — stream versus whole class or grade.",
      "Missing marks are treated differently from zero.",
      "Weighting was changed after the first calculation.",
    ],
    solution: [
      "Confirm the ranking scope selected on the results page.",
      "Complete missing marks before comparing rankings.",
    ],
    checkNext: ["Re-generate the results after all marks are in."],
  },
  {
    slug: "why-is-the-balance-different",
    title: "Why is the student's balance different?",
    category: "finance",
    problem: "The balance on one page does not match another.",
    causes: [
      "You are comparing a term balance with a lifetime balance.",
      "A different term is selected in the header.",
      "A fee was adjusted after the payment was recorded.",
      "A payment was recorded against a different term.",
    ],
    solution: [
      "Compare like with like: select the same term on both pages.",
      "Open the statement, which shows opening balance, billing, payments and closing balance in order.",
    ],
    checkNext: [
      "Check the fee item for an Adjusted badge.",
      "Ask an administrator to run the ledger integrity repair if figures still disagree.",
    ],
  },
  {
    slug: "why-isnt-a-payment-appearing",
    title: "Why isn't a payment appearing?",
    category: "finance",
    problem: "A payment was recorded but is not visible.",
    causes: [
      "It was recorded against a different term or student.",
      "It is unallocated and waiting to be matched.",
      "It was voided or reversed.",
    ],
    solution: [
      "Search by receipt or transaction reference in Payments.",
      "Check Unallocated Payments and match it to the student.",
    ],
    checkNext: ["Confirm the payment date falls in the selected term."],
  },
  {
    slug: "why-cant-i-reverse-a-payment",
    title: "Why can't I reverse a payment?",
    category: "finance",
    problem: "The reverse or void action is unavailable.",
    causes: [
      "You do not hold the payments:reverse or payments:delete permission.",
      "The payment is already reversed.",
      "The record belongs to a closed historical period.",
    ],
    solution: [
      "Ask a finance administrator to perform the reversal.",
      "Record a correcting entry where reversal is not permitted.",
    ],
    checkNext: ["Check the payment status and audit history."],
  },
  {
    slug: "why-is-a-fee-item-missing",
    title: "Why is a fee item missing?",
    category: "finance",
    problem: "An expected fee item is not on the student's bill.",
    causes: [
      "The fee structure has not been assigned to that class for this term.",
      "The item was unassigned or cancelled.",
      "The item belongs to a different academic year.",
    ],
    solution: [
      "Open Fee Assignment and assign the structure to the class.",
      "Check the student's fee list for cancelled items.",
    ],
    checkNext: ["Confirm the term selected in the header."],
  },
  {
    slug: "what-should-i-do-before-switching-terms",
    title: "What should I do before switching terms?",
    category: "getting-started",
    problem: "You are about to move the school into a new term.",
    causes: [
      "Unpublished assessments.",
      "Unreconciled payments or unallocated money.",
      "Class lists that are out of date.",
    ],
    solution: [
      "Publish or lock the closing term's assessments.",
      "Clear unallocated payments and confirm balances.",
      "Confirm class and stream membership.",
    ],
    checkNext: [
      "After switching, create the new term's fee structure and assessments.",
    ],
  },
  {
    slug: "why-is-the-new-term-showing-no-configuration",
    title: "Why is the new term showing no configuration?",
    category: "getting-started",
    problem: "A newly selected term looks empty.",
    causes: [
      "Fee structures, assessments and timetables are per-term and start empty.",
    ],
    solution: [
      "Create the term's fee structure and assign it.",
      "Create the term's assessments.",
    ],
    checkNext: [
      "Previous term data is untouched — switch back to view or report on it.",
    ],
  },
  {
    slug: "why-cant-a-user-access-a-module",
    title: "Why can't a user access a module?",
    category: "users",
    problem: "A user sees Access Denied or a missing menu item.",
    causes: [
      "Their roles do not include the required permission.",
      "They belong to a different school.",
      "Their account is inactive.",
    ],
    solution: [
      "Open Roles & Permissions and grant the permission to one of their roles.",
      "Confirm the user is a member of the correct school and is active.",
    ],
    checkNext: [
      "Permission changes apply within seconds — ask the user to refresh.",
    ],
  },
  {
    slug: "why-cant-i-assign-a-permission",
    title: "Why can't I assign a permission?",
    category: "users",
    problem: "Permission checkboxes are disabled or saving fails.",
    causes: [
      "You do not hold roles:assign_permissions or roles:manage.",
      "The role is a protected system role.",
    ],
    solution: [
      "Ask a school administrator to make the change.",
      "Duplicate the system role and edit the copy instead.",
    ],
    checkNext: ["Confirm the change on the role's permission summary."],
  },
  {
    slug: "why-cant-a-teacher-see-their-subjects",
    title: "Why can't a teacher see their subjects?",
    category: "users",
    problem: "A teacher's subject list is empty.",
    causes: [
      "No subject allocation for the current academic year and term.",
      "The allocation was made for a different class or stream.",
      "Missing subject or assessment read permissions.",
    ],
    solution: [
      "Open Subject Allocation and allocate the teacher for this term.",
      "Grant the required read permissions to their role.",
    ],
    checkNext: ["Ask the teacher to refresh and re-open the assessment."],
  },
];

// ---------------------------------------------------------------------
// GLOSSARY
// ---------------------------------------------------------------------

export interface GlossaryTerm {
  term: string;
  definition: string;
  article?: string;
}

export const GLOSSARY: GlossaryTerm[] = [
  {
    term: "Academic Year",
    definition:
      "The school year records are grouped under. It sets the default context for fees, assessments and reports.",
    article: "academic-year-and-terms",
  },
  {
    term: "Term",
    definition:
      "A period within the academic year. Fees, marks, attendance and reports are all scoped to a term.",
    article: "academic-year-and-terms",
  },
  {
    term: "Class",
    definition: "A grade or form level, for example Grade 5 or Form 2.",
    article: "classes-and-streams",
  },
  {
    term: "Stream",
    definition:
      "A section within a class, for example Grade 5 RED. Streams drive registers, mark sheets and class lists.",
    article: "classes-and-streams",
  },
  {
    term: "Subject",
    definition:
      "A learning area that is taught and assessed. Subjects are allocated to teachers per class.",
    article: "teacher-allocation",
  },
  {
    term: "Assessment",
    definition:
      "A recorded evaluation of learner performance — continuous, formative or summative.",
    article: "creating-assessments",
  },
  {
    term: "Score",
    definition: "The raw mark a learner obtained in an assessed item.",
  },
  {
    term: "Grade",
    definition:
      "The band a score falls into according to the school's grading scale.",
  },
  {
    term: "Competency",
    definition:
      "A CBE skill or ability a learner is assessed against, reported as a performance level rather than only a mark.",
  },
  {
    term: "Report Card",
    definition:
      "The consolidated document of a learner's results, comments and attendance for a period.",
  },
  {
    term: "Fee Structure",
    definition:
      "The set of fee items payable by a class for an academic year and term.",
    article: "fee-structures",
  },
  {
    term: "Invoice",
    definition:
      "The bill created for a student when a fee structure is assigned to them.",
    article: "fee-structures",
  },
  {
    term: "Payment",
    definition:
      "Money received from a parent or guardian, allocated against outstanding fees.",
    article: "recording-payments",
  },
  {
    term: "Balance B/F",
    definition:
      "Balance brought forward — what was still owed when the term opened.",
    article: "student-balances",
  },
  {
    term: "Excess B/F",
    definition:
      "Unused credit carried into the term from earlier terms. It is applied automatically to new fees.",
    article: "student-balances",
  },
  {
    term: "Outstanding Balance",
    definition:
      "Balance brought forward plus billing, less discounts and payments allocated.",
    article: "student-balances",
  },
  {
    term: "Promotion",
    definition:
      "Moving students from one class to the next at the end of an academic year.",
    article: "student-promotion",
  },
  {
    term: "Role",
    definition: "A named group of permissions that can be granted to users.",
    article: "user-roles",
  },
  {
    term: "Permission",
    definition:
      "A single capability, such as recording a payment. Access is always decided by permissions, never role names.",
    article: "user-roles",
  },
  {
    term: "Published",
    definition:
      "Results have been released and are visible to parents and students in the portal.",
    article: "assessment-statuses",
  },
  {
    term: "Locked",
    definition:
      "A record is frozen for editing. Published information stays visible.",
    article: "assessment-statuses",
  },
];

// ---------------------------------------------------------------------
// RELEASE NOTES
// ---------------------------------------------------------------------

export interface ReleaseNote {
  version: string;
  date: string;
  highlights?: string[];
  added?: string[];
  improved?: string[];
  fixed?: string[];
  important?: string[];
}

export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: "August 2026",
    date: "2026-08-11",
    added: [
      "Chuo Help Center with role-aware articles, troubleshooting and a glossary.",
      "Getting Started checklist that reads real school configuration.",
      "Recently viewed shortcuts, feedback and Report a Problem.",
      "Fee Report with Balance B/F and Excess B/F columns and Excel export.",
    ],
    improved: [
      "Clearer empty states, confirmations and next-step guidance across modules.",
      "Assessment workflow and status guidance.",
      "Roles & permissions: multi-role support with instant propagation.",
      "Finance balances now derive from payment allocations everywhere.",
    ],
    fixed: [
      "Trapped payment allocations after downward fee adjustments.",
      "Stale brought-forward balances after term switching.",
    ],
    important: [
      "Nightly ledger integrity checks now run automatically for every school.",
    ],
  },
];

// ---------------------------------------------------------------------
// ROLE-BASED PRIORITISATION
// ---------------------------------------------------------------------

/**
 * Categories surfaced first for a user, based on the permissions they hold.
 * Nothing is hidden — this only changes ordering and the "for you" section.
 */
export const ROLE_PRIORITY_RULES: {
  permission: PermissionCode;
  categories: HelpCategoryId[];
}[] = [
  { permission: "settings:update", categories: ["getting-started", "users"] },
  { permission: "exams:create", categories: ["assessments", "academics"] },
  { permission: "payments:create", categories: ["finance", "reports"] },
  { permission: "finance:fees:read", categories: ["finance", "reports"] },
  { permission: "payroll:read", categories: ["hr"] },
  { permission: "staff:read", categories: ["hr"] },
  { permission: "inventory:read", categories: ["inventory"] },
  { permission: "students:read", categories: ["students"] },
];

// ---------------------------------------------------------------------
// PRINTABLE GUIDES — built from the same articles, never duplicated text
// ---------------------------------------------------------------------

export interface PrintableGuide {
  slug: string;
  title: string;
  audience: string;
  articles: string[];
}

export const PRINTABLE_GUIDES: PrintableGuide[] = [
  {
    slug: "administrator",
    title: "Chuo Administrator Guide",
    audience: "School administrators",
    articles: [
      "getting-started",
      "academic-year-and-terms",
      "term-switching",
      "user-roles",
      "fee-structures",
      "reports-and-exports",
      "data-safety",
    ],
  },
  {
    slug: "teacher",
    title: "Teacher Guide",
    audience: "Teachers and class teachers",
    articles: [
      "classes-and-streams",
      "teacher-allocation",
      "creating-assessments",
      "assessment-statuses",
      "assessment-weighting",
    ],
  },
  {
    slug: "finance",
    title: "Accountant / Finance Guide",
    audience: "Finance officers and accountants",
    articles: [
      "fee-structures",
      "recording-payments",
      "student-balances",
      "reversing-a-payment",
      "reports-and-exports",
    ],
  },
  {
    slug: "hr",
    title: "HR Guide",
    audience: "HR officers",
    articles: ["staff-and-hr", "user-roles"],
  },
  {
    slug: "inventory",
    title: "Inventory Guide",
    audience: "Store managers and POS attendants",
    articles: ["inventory-basics", "inventory-adjustments"],
  },
  {
    slug: "portal",
    title: "Parent / Student Portal Guide",
    audience: "Parents and students",
    articles: ["portal-getting-started", "student-balances"],
  },
];

// ---------------------------------------------------------------------
// LOOKUPS
// ---------------------------------------------------------------------

export const articleBySlug = (slug: string) =>
  HELP_ARTICLES.find((a) => a.slug === slug);

export const troubleshootingBySlug = (slug: string) =>
  TROUBLESHOOTING.find((a) => a.slug === slug);

export const articlesByCategory = (id: HelpCategoryId) =>
  HELP_ARTICLES.filter((a) => a.category === id);

export const troubleshootingByCategory = (id: HelpCategoryId) =>
  TROUBLESHOOTING.filter((a) => a.category === id);

export interface HelpSearchHit {
  kind: "article" | "troubleshooting" | "glossary";
  slug: string;
  title: string;
  summary: string;
  category?: HelpCategoryId;
}

export function searchHelp(query: string): HelpSearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: HelpSearchHit[] = [];

  for (const a of HELP_ARTICLES) {
    const hay = [a.title, a.summary, ...(a.keywords || [])]
      .join(" ")
      .toLowerCase();
    if (hay.includes(q))
      hits.push({
        kind: "article",
        slug: a.slug,
        title: a.title,
        summary: a.summary,
        category: a.category,
      });
  }
  for (const t of TROUBLESHOOTING) {
    const hay = [t.title, t.problem, ...(t.keywords || [])]
      .join(" ")
      .toLowerCase();
    if (hay.includes(q))
      hits.push({
        kind: "troubleshooting",
        slug: t.slug,
        title: t.title,
        summary: t.problem,
        category: t.category,
      });
  }
  for (const g of GLOSSARY) {
    if (`${g.term} ${g.definition}`.toLowerCase().includes(q))
      hits.push({
        kind: "glossary",
        slug: g.term,
        title: g.term,
        summary: g.definition,
      });
  }
  return hits.slice(0, 40);
}
