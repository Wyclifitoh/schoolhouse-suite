/**
 * Presentation-only taxonomy for the Roles & Permissions workspace.
 *
 * NOTHING here grants access. The permission catalog itself always comes from
 * the backend (`/roles/permissions`); this file only decides how those modules
 * are labelled and which business category card they appear under. A module
 * that is not listed simply falls into "Other", so new backend permissions
 * still show up without a code change.
 */

export const MODULE_LABELS: Record<string, string> = {
  students: "Students",
  parents: "Parents & Guardians",
  staff: "Staff",
  classes: "Classes & Streams",
  subjects: "Subjects",
  finance: "Fees & Finance",
  payments: "Payments",
  expenses: "Expenses",
  income: "Income",
  billing: "Billing",
  payroll: "Payroll",
  leaves: "Leave Management",
  attendance: "Student Attendance",
  staff_attendance: "Staff Attendance",
  exams: "Assessments (CBE)",
  assessments: "Assessment Configuration",
  homework: "Homework",
  lessonplans: "Lesson Plans",
  timetable: "Timetable",
  communication: "Communication",
  inventory: "Inventory & Store",
  suppliers: "Suppliers",
  library: "Library",
  reports: "Reports",
  audit: "Audit Trail",
  events: "Events",
  clubs: "Clubs",
  settings: "Settings",
  users: "Users",
  roles: "Roles & Permissions",
  apikeys: "API Keys",
};

export const ACTION_LABELS: Record<string, string> = {
  read: "View",
  create: "Create",
  update: "Edit",
  delete: "Delete",
  manage: "Full manage",
  approve: "Approve",
  assign: "Assign",
  assign_permissions: "Assign permissions",
  waive: "Waive",
  import: "Import",
  export: "Export",
  publish: "Publish",
  promote: "Promote",
  transfer: "Transfer",
  receipt: "Print receipts",
  reverse: "Reverse",
  process: "Process",
  issue: "Issue to staff",
  return: "Process returns",
  purchase: "Purchase orders",
  reports: "Reports",
  sell: "Sell",
  send: "Send",
  bands: "Manage bands",
};

export const ACTION_ORDER = [
  "read",
  "create",
  "update",
  "delete",
  "manage",
  "approve",
  "process",
  "send",
  "sell",
  "assign",
  "assign_permissions",
  "waive",
  "import",
  "export",
  "publish",
  "promote",
  "transfer",
  "receipt",
  "reverse",
  "issue",
];

/** Ordered business categories, each listing the modules it owns. */
export const CATEGORIES: { key: string; label: string; modules: string[] }[] = [
  {
    key: "academics",
    label: "Academics",
    modules: [
      "students",
      "parents",
      "classes",
      "subjects",
      "exams",
      "assessments",
      "attendance",
      "timetable",
      "homework",
      "lessonplans",
      "clubs",
      "events",
    ],
  },
  {
    key: "finance",
    label: "Finance",
    modules: ["finance", "payments", "expenses", "income", "billing"],
  },
  {
    key: "hr",
    label: "Human Resources",
    modules: ["staff", "staff_attendance", "leaves", "payroll"],
  },
  { key: "communication", label: "Communication", modules: ["communication"] },
  {
    key: "inventory",
    label: "Inventory & Store",
    modules: ["inventory", "suppliers"],
  },
  { key: "library", label: "Library", modules: ["library"] },
  { key: "reports", label: "Reports", modules: ["reports"] },
  {
    key: "administration",
    label: "Administration",
    modules: ["users", "roles", "settings", "audit", "apikeys"],
  },
];

export const moduleLabel = (m: string) =>
  MODULE_LABELS[m] ||
  m.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());

export const actionLabel = (a: string) =>
  ACTION_LABELS[a] || a.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const categoryForModule = (m: string) =>
  CATEGORIES.find((c) => c.modules.includes(m))?.key || "other";

export const CATEGORY_LABELS: Record<string, string> = {
  ...Object.fromEntries(CATEGORIES.map((c) => [c.key, c.label])),
  other: "Other",
};

/** "2 hours ago" style relative label. Returns null for missing input. */
export const relativeTime = (iso?: string | null): string | null => {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const mins = Math.round((Date.now() - t) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
};
