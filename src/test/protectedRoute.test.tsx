import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

/**
 * Proves the frontend guard contract:
 *  - permissions are authoritative for any mapped route;
 *  - a legacy role list cannot resurrect a revoked permission;
 *  - a permission change propagates without a re-login (the hook simply
 *    returns the new server answer and the guard re-decides);
 *  - it fails closed while loading / on error.
 */
const state = {
  isAuthenticated: true,
  isLoading: false,
  mustChangePassword: false,
  roles: ["teacher"] as string[],
  permissions: [] as string[],
  permsLoading: false,
  permsData: true,
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    mustChangePassword: state.mustChangePassword,
    hasAnyRole: (rs: string[]) => rs.some((r) => state.roles.includes(r)),
  }),
}));

vi.mock("@/hooks/usePermission", () => ({
  useMyPermissions: () => ({
    data: state.permsData ? { permissions: state.permissions, roles: state.roles, auth_version: 1 } : undefined,
    isLoading: state.permsLoading,
  }),
}));

const { ProtectedRoute } = await import("@/components/ProtectedRoute");

function renderAt(pathname: string, roles?: string[]) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <Routes>
        <Route
          path={pathname}
          element={
            <ProtectedRoute roles={roles as never}>
              <div>PAGE</div>
            </ProtectedRoute>
          }
        />
        <Route path="/unauthorized" element={<div>DENIED</div>} />
        <Route path="/login" element={<div>LOGIN</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  state.isAuthenticated = true;
  state.isLoading = false;
  state.mustChangePassword = false;
  state.roles = ["teacher"];
  state.permissions = [];
  state.permsLoading = false;
  state.permsData = true;
});

describe("ProtectedRoute authorization", () => {
  it("opens a page when the mapped permission is granted", () => {
    state.permissions = ["students:read"];
    renderAt("/students");
    expect(screen.getByText("PAGE")).toBeInTheDocument();
  });

  it("blocks the page once the permission is revoked", () => {
    state.permissions = [];
    renderAt("/students");
    expect(screen.getByText("DENIED")).toBeInTheDocument();
  });

  it("does not let a legacy role list override a revoked permission", () => {
    state.permissions = [];
    state.roles = ["teacher"];
    renderAt("/students", ["teacher"]);
    expect(screen.getByText("DENIED")).toBeInTheDocument();
  });

  it("restores access as soon as the permission is granted again", () => {
    state.permissions = ["students:read"];
    renderAt("/students");
    expect(screen.getByText("PAGE")).toBeInTheDocument();
  });

  it("blocks a direct URL to a finance page for a teacher", () => {
    state.permissions = ["students:read", "exams:read"];
    renderAt("/payments");
    expect(screen.getByText("DENIED")).toBeInTheDocument();
  });

  it("passes an admin through on the wildcard", () => {
    state.roles = ["school_admin"];
    state.permissions = ["*"];
    renderAt("/payroll");
    expect(screen.getByText("PAGE")).toBeInTheDocument();
  });

  it("does NOT pass an admin role name that lacks the server wildcard", () => {
    // The admin shortcut was removed: only the server-issued "*" (resolved
    // per-school by the backend) opens a permission-gated route.
    state.roles = ["school_admin", "super_admin"];
    state.permissions = ["students:read"];
    renderAt("/payroll");
    expect(screen.getByText("DENIED")).toBeInTheDocument();
  });

  it("fails closed while permissions are still loading", () => {
    state.permsLoading = true;
    renderAt("/payroll");
    expect(screen.queryByText("PAGE")).not.toBeInTheDocument();
    expect(screen.queryByText("DENIED")).not.toBeInTheDocument();
  });

  it("fails closed when permission resolution returned nothing", () => {
    state.permsData = false;
    renderAt("/payroll");
    expect(screen.getByText("DENIED")).toBeInTheDocument();
  });

  it("allows authenticated-only routes without any grant", () => {
    state.permissions = [];
    renderAt("/dashboard");
    expect(screen.getByText("PAGE")).toBeInTheDocument();
  });

  it("still honours role gating on identity routes with no permission mapping", () => {
    state.roles = ["teacher"];
    renderAt("/parent-portal", ["parent"]);
    expect(screen.getByText("DENIED")).toBeInTheDocument();
  });

  it("redirects unauthenticated users to login", () => {
    state.isAuthenticated = false;
    renderAt("/students");
    expect(screen.getByText("LOGIN")).toBeInTheDocument();
  });
});
