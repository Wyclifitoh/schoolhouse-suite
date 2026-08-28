import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ROUTE_PERMISSIONS, permissionsForPath } from "@/lib/routePermissions";

const app = fs.readFileSync(path.resolve(__dirname, "../App.tsx"), "utf8");
const routePaths = Array.from(app.matchAll(/path="([^"]+)"/g)).map((m) => m[1]);

/** Routes that deliberately live outside the school RBAC map. */
const PUBLIC = [
  "/",
  "/login",
  "/signup",
  "/onboarding",
  "/userLogin",
  "/forgot-password",
  "/reset-password",
  "/unauthorized",
  "*",
];
/** Separate auth contexts with their own guards. */
const OTHER_CONTEXT = (p: string) =>
  p.startsWith("/admin") || p.startsWith("/portal");
/** Identity-scoped routes: access follows who the user IS, not a grant. */
const IDENTITY = ["/parent-portal", "/student-panel"];

const inAppRoutes = routePaths.filter(
  (p) => !PUBLIC.includes(p) && !IDENTITY.includes(p) && !OTHER_CONTEXT(p),
);

/** Business areas that must never be reachable on authentication alone. */
const SENSITIVE = [
  "/finance",
  "/payments",
  "/fee-",
  "/student-fees",
  "/expenses",
  "/income",
  "/payroll",
  "/staff-directory",
  "/leave-management",
  "/assessments",
  "/exams",
  "/examinations",
  "/communication",
  "/inventory",
  "/reports",
  "/settings",
  "/audit-trail",
  "/user-logs",
  "/students",
  "/parents",
];

describe("route permission map", () => {
  it("maps every in-app route", () => {
    const missing = inAppRoutes.filter((p) => !(p in ROUTE_PERMISSIONS));
    expect(missing).toEqual([]);
  });

  it("contains no stale entries", () => {
    const stale = Object.keys(ROUTE_PERMISSIONS).filter(
      (p) => !routePaths.includes(p),
    );
    expect(stale).toEqual([]);
  });

  it("requires an explicit permission on every sensitive route", () => {
    const unguarded = Object.entries(ROUTE_PERMISSIONS)
      .filter(([p]) => SENSITIVE.some((s) => p.startsWith(s)))
      .filter(([, codes]) => codes.length === 0)
      .map(([p]) => p);
    expect(unguarded).toEqual([]);
  });

  it("keeps authenticated-only routes to a documented shortlist", () => {
    const authOnly = Object.entries(ROUTE_PERMISSIONS)
      .filter(([, codes]) => codes.length === 0)
      .map(([p]) => p)
      .sort();
    expect(authOnly).toEqual(["/change-password", "/dashboard", "/profile"]);
  });

  it("resolves parameterised paths, preferring literal segments", () => {
    expect(permissionsForPath("/students/abc-123")).toEqual(["students:read"]);
    expect(permissionsForPath("/students/disabled")).toEqual(["students:read"]);
    expect(permissionsForPath("/payroll")).toEqual(["payroll:read"]);
    expect(permissionsForPath("/reports/category/finance")).toEqual([
      "reports:read",
    ]);
  });

  it("returns undefined for unmapped paths so guards fall back safely", () => {
    expect(permissionsForPath("/definitely-not-a-route")).toBeUndefined();
  });
});
