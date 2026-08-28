import {
  GraduationCap, Users, Banknote, Calendar, Briefcase, Library, Package,
  Shield, MessageSquare, FileBadge, BarChart3, Wallet, Receipt, Percent,
  BookOpenCheck, Truck, Activity, Scale, Bell, ClipboardList,
} from "lucide-react";

export interface ReportDef {
  /** stable id */
  id: string;
  title: string;
  description: string;
  /** existing application route */
  url: string;
  category: ReportCategoryKey;
  keywords?: string[];
  popular?: boolean;
  icon?: any;
}

export type ReportCategoryKey =
  | "academic"
  | "students"
  | "finance"
  | "attendance"
  | "hr"
  | "communication"
  | "inventory"
  | "administration";

export interface ReportCategoryDef {
  key: ReportCategoryKey;
  label: string;
  description: string;
  icon: any;
}

export const REPORT_CATEGORIES: ReportCategoryDef[] = [
  {
    key: "academic",
    label: "Academic",
    description: "Assessments, results, report cards and performance analytics",
    icon: FileBadge,
  },
  {
    key: "students",
    label: "Students",
    description: "Enrolment registers, guardians and student records",
    icon: GraduationCap,
  },
  {
    key: "finance",
    label: "Finance",
    description: "Fees, payments, balances and collection analytics",
    icon: Banknote,
  },
  {
    key: "attendance",
    label: "Attendance",
    description: "Student and staff attendance summaries and trends",
    icon: Calendar,
  },
  {
    key: "hr",
    label: "Human Resources",
    description: "Staff, payroll, leave and performance reporting",
    icon: Briefcase,
  },
  {
    key: "communication",
    label: "Communication",
    description: "Messaging delivery, campaigns and notices",
    icon: MessageSquare,
  },
  {
    key: "inventory",
    label: "Inventory & Library",
    description: "Store sales, stock, suppliers and library circulation",
    icon: Package,
  },
  {
    key: "administration",
    label: "Administration",
    description: "Audit trail, user activity and compliance logs",
    icon: Shield,
  },
];

/**
 * Every entry points to a route that already exists in CHUO — no new
 * functionality is introduced here.
 */
export const REPORTS: ReportDef[] = [
  // Academic
  {
    id: "exam-reports",
    title: "Examination Reports",
    description: "Exam performance by class, stream and subject.",
    url: "/reports/examinations",
    category: "academic",
    icon: FileBadge,
    popular: true,
    keywords: ["exam", "marks", "results", "performance"],
  },
  {
    id: "assessment-results",
    title: "Assessment Results",
    description: "Recorded assessment scores and competency outcomes.",
    url: "/assessments/results",
    category: "academic",
    icon: ClipboardList,
    popular: true,
    keywords: ["assessment", "results", "cbc", "competency"],
  },
  {
    id: "report-cards",
    title: "Report Cards",
    description: "Generate and print termly student report cards.",
    url: "/assessments/report-cards",
    category: "academic",
    icon: FileBadge,
    keywords: ["report card", "termly", "print"],
  },
  {
    id: "summative-reports",
    title: "Summative Reports",
    description: "End-of-term summative performance reporting.",
    url: "/assessments/summative",
    category: "academic",
    icon: BarChart3,
    keywords: ["summative", "term", "performance"],
  },
  {
    id: "assessment-analytics",
    title: "Assessment Analytics",
    description: "Trends, distributions and subject-level insights.",
    url: "/assessments/analytics",
    category: "academic",
    icon: BarChart3,
    keywords: ["analytics", "insights", "performance"],
  },
  {
    id: "homework-reports",
    title: "Homework Reports",
    description: "Homework issued, submitted and outstanding.",
    url: "/reports/homework",
    category: "academic",
    icon: BookOpenCheck,
    keywords: ["homework", "assignments"],
  },

  // Students
  {
    id: "student-reports",
    title: "Student Register",
    description: "Enrolment register by class, stream and academic year.",
    url: "/reports/students",
    category: "students",
    icon: GraduationCap,
    popular: true,
    keywords: ["students", "register", "enrolment", "nominal roll"],
  },
  {
    id: "guardians",
    title: "Guardians & Contacts",
    description: "Parent and guardian contact directory.",
    url: "/parents",
    category: "students",
    icon: Users,
    keywords: ["parents", "guardians", "contacts"],
  },
  {
    id: "disabled-students",
    title: "Archived Students",
    description: "Deactivated and archived student records.",
    url: "/students/disabled",
    category: "students",
    icon: Users,
    keywords: ["archived", "disabled", "inactive students"],
  },
  {
    id: "promotion",
    title: "Promotion & Progression",
    description: "Class progression outcomes between academic years.",
    url: "/promotion",
    category: "students",
    icon: GraduationCap,
    keywords: ["promotion", "progression"],
  },

  // Finance
  {
    id: "finance-reports",
    title: "Fee Collection Report",
    description: "Collection performance by class, stream and academic period.",
    url: "/reports/finance",
    category: "finance",
    icon: Banknote,
    popular: true,
    keywords: ["fee", "fees", "collection", "revenue"],
  },
  {
    id: "outstanding-fees",
    title: "Outstanding Fees",
    description: "Students with outstanding fee balances.",
    url: "/finance",
    category: "finance",
    icon: Scale,
    popular: true,
    keywords: ["fee", "balances", "arrears", "outstanding", "debtors"],
  },
  {
    id: "payment-summary",
    title: "Payment Summary",
    description: "Payments received by method, date and receipt.",
    url: "/payments",
    category: "finance",
    icon: Wallet,
    popular: true,
    keywords: ["payments", "receipts", "mpesa", "cash", "fee"],
  },
  {
    id: "fee-statement",
    title: "Fee Statements",
    description: "Detailed per-student fee statements and ledgers.",
    url: "/fee-assignment",
    category: "finance",
    icon: Receipt,
    popular: true,
    keywords: ["fee", "statement", "ledger", "invoice"],
  },
  {
    id: "fee-discounts",
    title: "Fee Discounts & Bursaries",
    description: "Discounts, waivers and bursary awards.",
    url: "/fee-discounts",
    category: "finance",
    icon: Percent,
    keywords: ["fee", "discount", "bursary", "waiver"],
  },
  {
    id: "fee-adjustments",
    title: "Fee Adjustments",
    description: "Manual fee adjustments and corrections.",
    url: "/fee-adjustments",
    category: "finance",
    icon: Scale,
    keywords: ["fee", "adjustment", "credit note"],
  },
  {
    id: "excess-payments",
    title: "Excess Payments",
    description: "Overpayments available for allocation.",
    url: "/excess-payments",
    category: "finance",
    icon: Wallet,
    keywords: ["excess", "overpayment", "credit"],
  },
  {
    id: "unallocated-payments",
    title: "Unallocated Payments",
    description: "Payments received but not yet allocated to fees.",
    url: "/unallocated-payments",
    category: "finance",
    icon: Wallet,
    keywords: ["unallocated", "suspense", "payments"],
  },
  {
    id: "brought-forward",
    title: "Brought Forward Balances",
    description: "Opening balances carried into the current period.",
    url: "/finance/brought-forward",
    category: "finance",
    icon: Scale,
    keywords: ["balance", "brought forward", "opening"],
  },
  {
    id: "reconciliation",
    title: "Reconciliation",
    description: "Reconcile bank and mobile money transactions.",
    url: "/reports/reconciliation",
    category: "finance",
    icon: Scale,
    keywords: ["reconcile", "bank", "mpesa"],
  },
  {
    id: "expenses",
    title: "Expenses",
    description: "School expenditure and petty cash records.",
    url: "/expenses",
    category: "finance",
    icon: Wallet,
    keywords: ["expenses", "expenditure", "petty cash"],
  },
  {
    id: "income",
    title: "Other Income",
    description: "Non-fee income sources and receipts.",
    url: "/income",
    category: "finance",
    icon: Banknote,
    keywords: ["income", "revenue"],
  },
  {
    id: "finance-audit",
    title: "Finance Audit",
    description: "Financial change history and audit checks.",
    url: "/finance-audit",
    category: "finance",
    icon: Shield,
    keywords: ["audit", "finance", "compliance"],
  },
  {
    id: "fee-reminders",
    title: "Fee Reminders",
    description: "Reminder messages sent to fee defaulters.",
    url: "/fee-reminders",
    category: "finance",
    icon: Bell,
    keywords: ["fee", "reminder", "defaulters"],
  },

  // Attendance
  {
    id: "attendance-reports",
    title: "Attendance Summary",
    description: "Student attendance rates by class and period.",
    url: "/reports/attendance",
    category: "attendance",
    icon: Calendar,
    popular: true,
    keywords: ["attendance", "absence", "present"],
  },
  {
    id: "daily-attendance",
    title: "Daily Attendance Register",
    description: "Day-by-day marking register.",
    url: "/attendance",
    category: "attendance",
    icon: Calendar,
    keywords: ["attendance", "register", "daily"],
  },
  {
    id: "staff-attendance",
    title: "Staff Attendance",
    description: "Staff clock-in / clock-out records.",
    url: "/staff-attendance",
    category: "attendance",
    icon: Calendar,
    keywords: ["attendance", "staff", "clock"],
  },

  // HR
  {
    id: "hr-reports",
    title: "HR Reports",
    description: "Staff establishment, departments and designations.",
    url: "/reports/hr",
    category: "hr",
    icon: Briefcase,
    keywords: ["hr", "staff", "establishment"],
  },
  {
    id: "staff-directory",
    title: "Staff Directory",
    description: "Full staff listing with roles and contacts.",
    url: "/staff-directory",
    category: "hr",
    icon: Users,
    keywords: ["staff", "directory", "employees"],
  },
  {
    id: "payroll",
    title: "Payroll",
    description: "Payroll runs, deductions and net pay.",
    url: "/payroll",
    category: "hr",
    icon: Wallet,
    keywords: ["payroll", "salary", "pay"],
  },
  {
    id: "leave",
    title: "Leave Records",
    description: "Leave applications, approvals and balances.",
    url: "/leave-management",
    category: "hr",
    icon: Calendar,
    keywords: ["leave", "absence", "holiday"],
  },
  {
    id: "staff-ratings",
    title: "Staff Performance Ratings",
    description: "Appraisal ratings and performance scores.",
    url: "/ratings",
    category: "hr",
    icon: BarChart3,
    keywords: ["ratings", "appraisal", "performance"],
  },

  // Communication
  {
    id: "message-history",
    title: "Message History",
    description: "Delivery history for SMS and email messages.",
    url: "/communication/history",
    category: "communication",
    icon: MessageSquare,
    keywords: ["sms", "email", "messages", "delivery"],
  },
  {
    id: "campaigns",
    title: "Campaign Performance",
    description: "Campaign sends, recipients and outcomes.",
    url: "/communication/campaigns",
    category: "communication",
    icon: MessageSquare,
    keywords: ["campaign", "bulk sms", "messaging"],
  },
  {
    id: "notices",
    title: "Noticeboard",
    description: "Published notices and announcements.",
    url: "/communication/noticeboard",
    category: "communication",
    icon: Bell,
    keywords: ["notices", "announcements", "noticeboard"],
  },

  // Inventory & Library
  {
    id: "inventory-sales",
    title: "Store Sales History",
    description: "Items sold to students with amounts and dates.",
    url: "/inventory/history",
    category: "inventory",
    icon: Package,
    keywords: ["store", "sales", "inventory"],
  },
  {
    id: "inventory-catalog",
    title: "Stock Catalog",
    description: "Product catalog with stock levels and pricing.",
    url: "/inventory/catalog",
    category: "inventory",
    icon: Package,
    keywords: ["stock", "catalog", "products", "inventory"],
  },
  {
    id: "suppliers",
    title: "Suppliers & Purchases",
    description: "Suppliers and purchase order activity.",
    url: "/inventory/suppliers",
    category: "inventory",
    icon: Truck,
    keywords: ["suppliers", "purchase orders", "procurement"],
  },
  {
    id: "library-reports",
    title: "Library Reports",
    description: "Book circulation, issues, returns and fines.",
    url: "/reports/library",
    category: "inventory",
    icon: Library,
    keywords: ["library", "books", "borrowing", "fines"],
  },
  {
    id: "transport-reports",
    title: "Transport Reports",
    description: "Transport routes and student assignments.",
    url: "/reports/transport",
    category: "inventory",
    icon: Truck,
    keywords: ["transport", "bus", "routes"],
  },

  // Administration
  {
    id: "audit-trail",
    title: "Audit Trail",
    description: "System-wide record of data changes.",
    url: "/reports/audit-trail",
    category: "administration",
    icon: Shield,
    keywords: ["audit", "trail", "compliance", "changes"],
  },
  {
    id: "user-logs",
    title: "User Activity Logs",
    description: "Sign-ins and user activity across the system.",
    url: "/reports/user-logs",
    category: "administration",
    icon: Activity,
    keywords: ["logs", "users", "activity", "security"],
  },
  {
    id: "archives",
    title: "Archives",
    description: "Archived academic periods and historical data.",
    url: "/archives",
    category: "administration",
    icon: Shield,
    keywords: ["archive", "history", "past terms"],
  },
];

export function reportsByCategory(key: ReportCategoryKey) {
  return REPORTS.filter((r) => r.category === key);
}

export function categoryByKey(key?: string) {
  return REPORT_CATEGORIES.find((c) => c.key === key);
}

export function searchReports(query: string, scope?: ReportCategoryKey) {
  const q = query.trim().toLowerCase();
  const base = scope ? reportsByCategory(scope) : REPORTS;
  if (!q) return base;
  return base.filter((r) =>
    [r.title, r.description, ...(r.keywords || [])]
      .join(" ")
      .toLowerCase()
      .includes(q),
  );
}
