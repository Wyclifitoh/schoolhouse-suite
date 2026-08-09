/**
 * ROUTE → PERMISSION MAP
 * ---------------------------------------------------------------
 * The single place that says "which permission code(s) let a user open
 * this page". Access is granted when the user holds ANY of the codes.
 *
 * This exists so that page access is DATABASE-DRIVEN: a custom role that
 * gets `payroll:read` granted in Settings → Roles can immediately open
 * /payroll without a code change. Hardcoded `roles={[...]}` props on routes
 * are only a legacy fallback — new pages should rely on this map.
 *
 * Keys are route patterns using `:param` segments, matched most-specific
 * first. An empty array means "any authenticated member of the school".
 */
import type { PermissionCode } from "@/hooks/usePermission";

type Codes = PermissionCode[];

export const ROUTE_PERMISSIONS: Record<string, Codes> = {
  "/dashboard": [],
  "/profile": [],
  "/change-password": [],

  // Students & parents
  "/students": ["students:read"],
  "/students/disabled": ["students:read"],
  "/students/:studentId": ["students:read"],
  "/parents": ["parents:read"],
  "/parents/:id": ["parents:read"],
  "/promotion": ["students:promote"],
  "/archives": ["students:read", "reports:read"],

  // Academics
  "/classes": ["classes:read"],
  "/streams": ["classes:read"],
  "/subjects": ["subjects:read", "subjects:manage"],
  "/class-timetable": ["timetable:read"],
  "/teacher-timetable": ["timetable:read"],
  "/assign-class-teacher": ["classes:update", "timetable:manage"],
  "/subject-allocation": ["subjects:manage", "timetable:manage"],
  "/teacher-allocation": ["subjects:manage", "timetable:manage"],
  "/settings/academics": ["settings:read", "settings:update"],
  "/clubs": ["students:read"],
  "/clubs/:id": ["students:read"],
  "/events": ["events:read"],
  "/homework": ["homework:read", "homework:manage"],
  "/lesson-plans": ["lessonplans:read", "lessonplans:manage"],
  "/lesson-plans/new": ["lessonplans:manage"],
  "/lesson-plans/:id": ["lessonplans:read", "lessonplans:manage"],

  // Attendance
  "/attendance": ["attendance:read"],
  "/staff-attendance": ["attendance:read", "staff:read"],

  // Assessments / exams
  "/assessments": ["exams:read"],
  "/assessments/tasks": ["exams:read"],
  "/assessments/marks/:taskId": ["exams:create", "exams:update"],
  "/assessments/results": ["exams:read"],
  "/assessments/report-cards": ["exams:read"],
  "/assessments/templates": ["exams:update", "settings:update"],
  "/assessments/analytics": ["exams:read", "reports:read"],
  "/assessments/remark-bands": ["assessments:bands:manage"],
  "/assessments/settings": [
    "exams:update",
    "assessments:bands:manage",
    "settings:update",
  ],
  "/assessments/:id": ["exams:read"],
  "/examinations": ["exams:read"],
  "/exams/entry": ["exams:create", "exams:update"],
  "/exams/review": ["exams:publish", "exams:update"],
  "/exams/analytics": ["exams:read", "reports:read"],
  "/reports/cards": ["exams:read", "reports:read"],

  // Finance
  "/finance": ["finance:fees:read"],
  "/fee-assignment": ["finance:fees:assign"],
  "/fee-discounts": ["finance:fees:waive"],
  "/student-fees/:studentId": ["finance:fees:read", "payments:read"],
  "/payments": ["payments:read"],
  "/excess-payments": ["payments:read"],
  "/unallocated-payments": ["payments:read"],
  "/fee-reminders": ["finance:fees:read", "communication:send"],
  "/fee-adjustments": ["finance:fees:waive"],
  "/finance-audit": ["audit:read", "finance:fees:read"],
  "/finance/brought-forward": ["finance:fees:update"],
  "/reports/reconciliation": ["payments:read", "reports:read"],
  "/expenses": ["expenses:read"],
  "/income": ["income:read"],
  "/payments/in-kind": ["payments:read"],
  "/payments/bulk-bursary": ["finance:fees:waive", "payments:create"],

  // HR
  "/staff-directory": ["staff:read"],
  "/staff/:id": ["staff:read"],
  "/leave-management": ["leaves:read", "leaves:create"],
  "/payroll": ["payroll:read"],
  "/departments": ["staff:read"],
  "/designations": ["staff:read"],
  "/ratings": ["staff:read"],

  // Communication
  "/communication": ["communication:read"],
  "/communication/send": ["communication:send"],
  "/communication/campaigns": ["communication:read"],
  "/communication/automations": ["communication:update"],
  "/communication/scheduled": ["communication:read"],
  "/communication/history": ["communication:read"],
  "/communication/settings": ["communication:update", "settings:update"],
  "/communication/sms": ["communication:send"],
  "/communication/email": ["communication:send"],
  "/communication/noticeboard": ["communication:read"],
  "/communication/templates": ["communication:update"],
  "/communication/sms-log": ["communication:read"],
  "/communication/email-log": ["communication:read"],

  // Inventory & library
  "/inventory": ["inventory:read"],
  "/inventory/catalog": ["inventory:read"],
  "/inventory/sell": ["inventory:sell"],
  "/inventory/history": ["inventory:read"],
  "/inventory/suppliers": ["suppliers:manage"],
  "/inventory/purchase-orders": ["inventory:update", "suppliers:manage"],
  "/inventory/categories": ["inventory:update"],
  "/inventory/issuances": ["inventory:read"],
  "/inventory/movements": ["inventory:read"],
  "/inventory/reports": ["inventory:reports", "reports:read", "inventory:read"],
  "/library": ["library:read", "library:manage"],

  // Reports workspace
  "/reports": ["reports:read"],
  "/reports/category/:category": ["reports:read"],
  "/reports/finance": ["reports:read"],
  "/reports/students": ["reports:read"],
  "/reports/attendance": ["reports:read"],
  "/reports/examinations": ["reports:read"],
  "/reports/hr": ["reports:read"],
  "/reports/homework": ["reports:read"],
  "/reports/library": ["reports:read"],
  "/reports/transport": ["reports:read"],
  "/reports/user-logs": ["audit:read"],
  "/reports/audit-trail": ["audit:read"],
  "/audit-trail": ["audit:read"],
  "/user-logs": ["audit:read"],

  // Administration
  "/settings": ["settings:read"],
  "/settings/roles": ["roles:read", "roles:manage"],
  "/settings/roles/:role/permissions": ["roles:assign_permissions", "roles:manage"],
  "/settings/billing": ["billing:read", "billing:manage"],
  "/settings/api-keys": ["apikeys:manage"],
};

const segments = (p: string) => p.split("/").filter(Boolean);

const matches = (pattern: string, path: string) => {
  const a = segments(pattern);
  const b = segments(path);
  if (a.length !== b.length) return false;
  return a.every((seg, i) => seg.startsWith(":") || seg === b[i]);
};

/**
 * Resolves the permission codes required for a pathname.
 * Returns `undefined` when the route is not in the map (no extra restriction).
 */
export function permissionsForPath(pathname: string): Codes | undefined {
  if (ROUTE_PERMISSIONS[pathname]) return ROUTE_PERMISSIONS[pathname];
  if (pathname in ROUTE_PERMISSIONS) return ROUTE_PERMISSIONS[pathname];
  // Prefer literal-heavy patterns over param-heavy ones.
  const candidates = Object.keys(ROUTE_PERMISSIONS)
    .filter((pattern) => matches(pattern, pathname))
    .sort(
      (x, y) =>
        segments(x).filter((s) => s.startsWith(":")).length -
        segments(y).filter((s) => s.startsWith(":")).length,
    );
  return candidates.length ? ROUTE_PERMISSIONS[candidates[0]] : undefined;
}
