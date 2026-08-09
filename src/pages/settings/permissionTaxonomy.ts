/**
 * Presentation-only taxonomy for the Roles & Permissions workspace.
 * Nothing here affects authorization — it groups and labels the permission
 * catalog returned by the API.
 */

export const CATEGORIES = [
  { key: "students", label: "Students & Guardians" },
  { key: "academics", label: "Academics" },
  { key: "assessments", label: "Assessments & Reports" },
  { key: "finance", label: "Finance" },
  { key: "hr", label: "Human Resources" },
  { key: "communication", label: "Communication" },
  { key: "operations", label: "Operations" },
  { key: "administration", label: "Administration" },
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  ...Object.fromEntries(CATEGORIES.map((c) => [c.key, c.label])),
  other: "Other",
};

const MODULE_CATEGORY: Record<string, string> = {
  students: "students",
  parents: "students",
  attendance: "students",
  promotion: "students",
  classes: "academics",
  streams: "academics",
  subjects: "academics",
  timetable: "academics",
  homework: "academics",
  lesson_plans: "academics",
  clubs: "academics",
  assessments: "assessments",
  exams: "assessments",
  grades: "assessments",
  results: "assessments",
  reports: "assessments",
  finance: "finance",
  fees: "finance",
  payments: "finance",
  expenses: "finance",
  income: "finance",
  accounting: "finance",
  budgets: "finance",
  vouchers: "finance",
  procurement: "finance",
  capitation: "finance",
  suppliers: "finance",
  staff: "hr",
  payroll: "hr",
  leave: "hr",
  departments: "hr",
  designations: "hr",
  ratings: "hr",
  communication: "communication",
  messages: "communication",
  sms: "communication",
  events: "communication",
  notices: "communication",
  inventory: "operations",
  library: "operations",
  transport: "operations",
  assets: "operations",
  settings: "administration",
  roles: "administration",
  users: "administration",
  audit: "administration",
  apikeys: "administration",
  archives: "administration",
};

export const ACTION_ORDER = [
  "read",
  "create",
  "update",
  "delete",
  "manage",
  "approve",
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
  "sell",
  "send",
];

const titleize = (s: string) =>
  s
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

export const moduleLabel = (module: string) => titleize(module);
export const actionLabel = (action: string) => titleize(action);

export const categoryForModule = (module: string) =>
  MODULE_CATEGORY[module] || "other";

export function relativeTime(value?: string | null): string | null {
  if (!value) return null;
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return null;
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(value).toLocaleDateString();
}