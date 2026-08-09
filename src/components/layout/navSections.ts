/**
 * Presentation-only metadata: groups the children of each primary nav module
 * into logical sections inside the dropdown menus. Keys are existing routes —
 * no routes are added, removed or renamed here.
 */

export const NAV_SECTION_BY_URL: Record<string, string> = {
  // Dashboard
  "/dashboard": "Overview",

  // Student Management
  "/students": "Students",
  "/students/disabled": "Students",
  "/parents": "Guardians",
  "/attendance": "Attendance",
  "/promotion": "Progression",

  // Academics
  "/classes": "Structure",
  "/streams": "Structure",
  "/subjects": "Structure",
  "/subject-categories": "Structure",
  "/subject-allocation": "Allocations",
  "/teacher-allocation": "Allocations",
  "/assign-class-teacher": "Allocations",
  "/class-timetable": "Timetables",
  "/teacher-timetable": "Timetables",
  "/lesson-plans": "Learning",
  "/homework": "Learning",
  "/clubs": "Learning",

  // Assessments & Reports
  "/assessments": "Assessments",
  "/assessments/tasks": "Assessments",
  "/assessments/results": "Results",
  "/assessments/report-cards": "Results",
  "/assessments/summative": "Results",
  "/assessments/templates": "Setup",
  "/assessments/remark-bands": "Setup",
  "/assessments/analytics": "Insights",

  // Finance (falls back here when an item has no explicit `section`)
  "/finance": "Setup",
  "/finance/vote-heads": "Setup",
  "/finance/bank-accounts": "Setup",
  "/fee-discounts": "Setup",
  "/fee-assignment": "Student Finance",
  "/finance/brought-forward": "Student Finance",
  "/finance/student-account": "Student Finance",
  "/fee-adjustments": "Student Finance",
  "/fee-reminders": "Student Finance",
  "/payments": "Student Finance",
  "/excess-payments": "Student Finance",
  "/unallocated-payments": "Student Finance",
  "/payments/in-kind": "Student Finance",
  "/payments/bulk-bursary": "Student Finance",
  "/finance/cash-book": "Accounting",
  "/finance/general-ledger": "Accounting",
  "/finance/bank-reconciliation": "Accounting",
  "/finance/budgets": "Accounting",
  "/finance/capitation": "Accounting",
  "/expenses": "Procurement & Payables",
  "/income": "Accounting",
  "/finance/procurement": "Procurement & Payables",
  "/finance/payment-vouchers": "Procurement & Payables",
  "/finance/assets": "Procurement & Payables",
  "/finance/reports": "Reports & Audit",
  "/finance/bursar-dashboard": "Reports & Audit",
  "/finance/audit-trail": "Reports & Audit",

  // Human Resources
  "/staff-directory": "People",
  "/departments": "Organisation",
  "/designations": "Organisation",
  "/staff-attendance": "Time & Leave",
  "/leave-management": "Time & Leave",
  "/payroll": "Payroll",
  "/ratings": "Performance",

  // Communication
  "/communication": "Overview",
  "/communication/send": "Messaging",
  "/communication/campaigns": "Messaging",
  "/communication/scheduled": "Messaging",
  "/communication/history": "Messaging",
  "/communication/templates": "Setup",
  "/communication/automations": "Setup",
  "/communication/settings": "Setup",
  "/communication/noticeboard": "Announcements",
  "/events": "Announcements",

  // Inventory & Store
  "/inventory": "Overview",
  "/inventory/catalog": "Stock",
  "/inventory/categories": "Stock",

  "/inventory/sell": "Sales",
  "/inventory/history": "Sales",
  "/inventory/assignments": "Sales",
  "/inventory/suppliers": "Procurement",
  "/inventory/purchase-orders": "Procurement",

  // Workspaces & secondary modules
  "/reports": "Reporting",
  "/library": "Overview",
  "/settings": "Administration",
  "/settings/roles": "Administration",
  "/archives": "Administration",
  "/audit-trail": "Compliance",
  "/user-logs": "Compliance",

  // Reports
  "/reports/students": "Academic",
  "/reports/attendance": "Academic",
  "/reports/finance": "Finance",
  "/reports/hr": "Operations",
  "/reports/library": "Operations",
};

/** Preferred display order of sections; unknown sections come last. */
export const NAV_SECTION_ORDER = [
  "Overview",
  "Students",
  "Guardians",
  "Attendance",
  "Progression",
  "Structure",
  "Allocations",
  "Timetables",
  "Learning",
  "Assessments",
  "Results",
  "Insights",
  "Setup",
  "Student Finance",
  "Fees",
  "Payments",
  "Accounting",
  "Procurement & Payables",
  "Reports & Audit",
  "People",
  "Organisation",
  "Time & Leave",
  "Payroll",
  "Performance",
  "Messaging",
  "Announcements",
  "Stock",
  "Sales",
  "Procurement",
  "Academic",
  "Finance",
  "Operations",
  "Reporting",
  "Administration",
  "Compliance",
  "More",
];

export function sectionFor(url: string, explicit?: string): string {
  return explicit || NAV_SECTION_BY_URL[url] || "More";
}

export function groupIntoSections<T extends { url: string; section?: string }>(
  items: T[],
) {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = sectionFor(item.url, item.section);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return [...map.entries()].sort(
    (a, b) =>
      (NAV_SECTION_ORDER.indexOf(a[0]) + 1 || 999) -
      (NAV_SECTION_ORDER.indexOf(b[0]) + 1 || 999),
  );
}
