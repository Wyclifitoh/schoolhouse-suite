import {
  GraduationCap,
  Users,
  Banknote,
  CalendarCheck,
  Briefcase,
  MessageSquare,
  Package,
  Shield,
  type LucideIcon,
} from "lucide-react";

export interface ReportDef {
  id: string;
  title: string;
  description: string;
  /** Existing application route — never invented. */
  url: string;
  category: ReportCategoryId;
  keywords?: string[];
  popular?: boolean;
}

export type ReportCategoryId =
  | "academic"
  | "students"
  | "finance"
  | "attendance"
  | "hr"
  | "communication"
  | "inventory"
  | "administration";

export interface ReportCategoryDef {
  id: ReportCategoryId;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const REPORT_CATEGORIES: ReportCategoryDef[] = [
  {
    id: "academic",
    label: "Academic",
    description: "Assessments, results, report cards and performance analytics",
    icon: GraduationCap,
  },
  {
    id: "students",
    label: "Student",
    description: "Enrolment, registers and learner records",
    icon: Users,
  },
  {
    id: "finance",
    label: "Finance",
    description: "Fees, payments, balances and collection analytics",
    icon: Banknote,
  },
  {
    id: "attendance",
    label: "Attendance",
    description: "Learner and staff attendance summaries",
    icon: CalendarCheck,
  },
  {
    id: "hr",
    label: "Human Resources",
    description: "Staff, payroll and workforce reporting",
    icon: Briefcase,
  },
  {
    id: "communication",
    label: "Communication",
    description: "Messaging delivery, campaigns and history",
    icon: MessageSquare,
  },
  {
    id: "inventory",
    label: "Inventory",
    description: "Store sales, stock movement and procurement",
    icon: Package,
  },
  {
    id: "administration",
    label: "Administration",
    description: "Audit trail, system logs and archived records",
    icon: Shield,
  },
];

export const REPORTS: ReportDef[] = [
  // Academic
  {
    id: "assessment-results",
    title: "Assessment Results",
    description: "Class and stream results with ranking for a selected assessment.",
    url: "/assessments/results",
    category: "academic",
    popular: true,
    keywords: ["exam", "marks", "ranking", "results"],
  },
  {
    id: "report-cards",
    title: "Report Cards",
    description: "Generate and print learner report cards.",
    url: "/assessments/report-cards",
    category: "academic",
    keywords: ["report card", "print"],
  },
  {
    id: "report-card-runs",
    title: "Report Card Runs",
    description: "Batch report card generation history and downloads.",
    url: "/reports/cards",
    category: "academic",
    keywords: ["batch", "zip", "report card"],
  },
  {
    id: "summative-reports",
    title: "Summative Reports",
    description: "End of term summative performance reporting.",
    url: "/assessments/summative",
    category: "academic",
    keywords: ["summative", "term"],
  },
  {
    id: "assessment-analytics",
    title: "Assessment Analytics",
    description: "Performance distribution, trends and subject analysis.",
    url: "/assessments/analytics",
    category: "academic",
    popular: true,
    keywords: ["analytics", "performance", "trend"],
  },
  {
    id: "exam-reports",
    title: "Examination Reports",
    description: "Examination-level reporting across classes.",
    url: "/reports/examinations",
    category: "academic",
    keywords: ["exam"],
  },
  {
    id: "homework-reports",
    title: "Homework Reports",
    description: "Homework issued, submitted and outstanding.",
    url: "/reports/homework",
    category: "academic",
    keywords: ["homework", "assignment"],
  },
  {
    id: "library-reports",
    title: "Library Reports",
    description: "Borrowing, returns and library stock reporting.",
    url: "/reports/library",
    category: "academic",
    keywords: ["library", "books", "borrowing"],
  },

  // Students
  {
    id: "student-register",
    title: "Student Register",
    description: "Enrolment register by class, stream and academic period.",
    url: "/reports/students",
    category: "students",
    popular: true,
    keywords: ["register", "enrolment", "students"],
  },

  // Finance
  {
    id: "fee-collection",
    title: "Fee Collection Report",
    description: "Collection performance by class, stream and academic period.",
    url: "/reports/finance",
    category: "finance",
    popular: true,
    keywords: ["fee", "collection", "payments", "outstanding", "balances"],
  },
  {
    id: "financial-reports",
    title: "Financial Reports",
    description: "Income statement, trial balance and financial position.",
    url: "/finance/reports",
    category: "finance",
    popular: true,
    keywords: ["trial balance", "income", "statement", "fee"],
  },
  {
    id: "bursar-dashboard",
    title: "Bursar Dashboard",
    description: "Daily collection, arrears and cash position overview.",
    url: "/finance/bursar-dashboard",
    category: "finance",
    keywords: ["bursar", "cash", "fee"],
  },
  {
    id: "fee-statement",
    title: "Fee Statement",
    description: "Detailed student fee statements and account history.",
    url: "/finance/student-account",
    category: "finance",
    popular: true,
    keywords: ["fee", "statement", "student account", "balance"],
  },
  {
    id: "cash-book",
    title: "Cash Book",
    description: "Receipts and payments recorded per cash or bank account.",
    url: "/finance/cash-book",
    category: "finance",
    keywords: ["cash", "bank", "receipts"],
  },
  {
    id: "general-ledger",
    title: "General Ledger",
    description: "Double-entry ledger postings by account and period.",
    url: "/finance/general-ledger",
    category: "finance",
    keywords: ["ledger", "gl", "accounting"],
  },
  {
    id: "budgets",
    title: "Budget vs Actual",
    description: "Budget allocation against actual expenditure.",
    url: "/finance/budgets",
    category: "finance",
    keywords: ["budget", "expenditure"],
  },
  {
    id: "capitation",
    title: "Capitation Report",
    description: "Capitation receipts and allocation to learners.",
    url: "/finance/capitation",
    category: "finance",
    keywords: ["capitation", "government", "fee"],
  },
  {
    id: "fee-discounts",
    title: "Fee Discounts & Bursaries",
    description: "Discounts, scholarships and bursaries awarded.",
    url: "/fee-discounts",
    category: "finance",
    keywords: ["fee", "discount", "bursary", "scholarship"],
  },
  {
    id: "payment-reconciliation",
    title: "Payment Reconciliation",
    description: "Reconcile received payments against school records.",
    url: "/reports/reconciliation",
    category: "finance",
    keywords: ["payment", "reconciliation", "mpesa", "bank"],
  },

  // Attendance
  {
    id: "attendance-summary",
    title: "Attendance Summary",
    description: "Learner attendance rates by class and period.",
    url: "/reports/attendance",
    category: "attendance",
    popular: true,
    keywords: ["attendance", "absent", "present"],
  },
  {
    id: "staff-attendance",
    title: "Staff Attendance",
    description: "Staff clock-in records and attendance trends.",
    url: "/staff-attendance",
    category: "attendance",
    keywords: ["attendance", "staff", "clock"],
  },

  // HR
  {
    id: "hr-reports",
    title: "HR Reports",
    description: "Staff establishment, departments and designations.",
    url: "/reports/hr",
    category: "hr",
    keywords: ["hr", "staff"],
  },
  {
    id: "payroll",
    title: "Payroll Reports",
    description: "Payroll runs, deductions and net pay summaries.",
    url: "/payroll",
    category: "hr",
    keywords: ["payroll", "salary"],
  },

  // Communication
  {
    id: "message-history",
    title: "Message History",
    description: "Sent SMS and email delivery outcomes.",
    url: "/communication/history",
    category: "communication",
    keywords: ["sms", "email", "delivery", "history"],
  },
  {
    id: "campaign-report",
    title: "Campaign Performance",
    description: "Campaign reach, delivery and failure rates.",
    url: "/communication/campaigns",
    category: "communication",
    keywords: ["campaign", "sms"],
  },

  // Inventory
  {
    id: "sales-history",
    title: "Store Sales History",
    description: "Items sold to learners with values and dates.",
    url: "/inventory/history",
    category: "inventory",
    keywords: ["sales", "store", "inventory"],
  },
  {
    id: "purchase-orders",
    title: "Purchase Orders",
    description: "Orders raised to suppliers and their status.",
    url: "/inventory/purchase-orders",
    category: "inventory",
    keywords: ["purchase", "supplier", "order"],
  },
  {
    id: "staff-issues",
    title: "Staff Item Assignments",
    description: "Items issued to staff, returns and outstanding items.",
    url: "/inventory/assignments",
    category: "inventory",
    keywords: ["assignment", "issue", "staff", "store"],
  },
  {
    id: "transport-reports",
    title: "Transport Reports",
    description: "Transport routes, usage and charges.",
    url: "/reports/transport",
    category: "inventory",
    keywords: ["transport", "bus", "route"],
  },

  // Administration
  {
    id: "audit-trail",
    title: "Audit Trail",
    description: "Tamper-evident log of all record changes.",
    url: "/audit-trail",
    category: "administration",
    keywords: ["audit", "compliance", "log"],
  },
  {
    id: "user-logs",
    title: "User Activity Logs",
    description: "System sign-ins and user activity history.",
    url: "/user-logs",
    category: "administration",
    keywords: ["logs", "users", "activity"],
  },
  {
    id: "archives",
    title: "Archived Records",
    description: "Archived academic years, learners and documents.",
    url: "/archives",
    category: "administration",
    keywords: ["archive", "history"],
  },
];

export const reportsByCategory = (id: ReportCategoryId) =>
  REPORTS.filter((r) => r.category === id);

export function searchReports(query: string, pool: ReportDef[] = REPORTS) {
  const q = query.trim().toLowerCase();
  if (!q) return pool;
  return pool.filter((r) =>
    [r.title, r.description, ...(r.keywords || [])]
      .join(" ")
      .toLowerCase()
      .includes(q),
  );
}
