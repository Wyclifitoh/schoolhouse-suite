import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PortalAuthProvider } from "@/contexts/PortalAuthContext";
import { PlatformAuthProvider } from "@/contexts/PlatformAuthContext";
import { SchoolProvider } from "@/contexts/SchoolContext";
import { TermProvider } from "@/contexts/TermContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PortalProtectedRoute } from "@/components/PortalProtectedRoute";
import { PlatformProtectedRoute } from "@/components/admin/PlatformProtectedRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Admin pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminSchools from "./pages/admin/AdminSchools";
import AdminSchoolDetail from "./pages/admin/AdminSchoolDetail";
import AdminPlans from "./pages/admin/AdminPlans";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAudit from "./pages/admin/AdminAudit";
import AdminStaff from "./pages/admin/AdminStaff";
import AdminBilling from "./pages/admin/AdminBilling";

// Auth pages
import Login from "./pages/Login";
import UserLogin from "./pages/UserLogin";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Unauthorized from "./pages/Unauthorized";
import ApiKeysPage from "./pages/settings/ApiKeys";

// Portal pages
import ParentDashboard from "./pages/portal/ParentDashboard";
import StudentDashboard from "./pages/portal/StudentDashboard";
import {
  ParentResults,
  ParentAttendance,
  ParentFees,
  ParentProfilePage,
  StudentResults,
  StudentAttendance,
  StudentFees as PortalStudentFees,
  StudentProfilePage,
} from "./pages/portal/PortalPages";

// Dashboard pages
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Finance from "./pages/Finance";
import FeeAssignment from "./pages/FeeAssignment";
import FeeDiscounts from "./pages/FeeDiscounts";
import StudentFees from "./pages/StudentFees";
import Payments from "./pages/Payments";
import ExcessPayments from "./pages/ExcessPayments";
import UnallocatedPayments from "./pages/UnallocatedPayments";
import FeeReminders from "./pages/FeeReminders";
import Parents from "./pages/Parents";
import ParentProfile from "./pages/ParentProfile";
import StaffProfile from "./pages/StaffProfile";
import Attendance from "./pages/Attendance";
import Inventory from "./pages/Inventory";
import Settings from "./pages/Settings";
import Examinations from "./pages/Examinations";
import Classes from "./pages/Classes";
import Streams from "./pages/academics/Streams";
import Library from "./pages/Library";
import Expenses from "./pages/Expenses";
import Income from "./pages/Income";
import InKindPayments from "./pages/InKindPayments";
import BulkBursary from "./pages/BulkBursary";
import Communication from "./pages/Communication";
import Promotion from "./pages/Promotion";
import ParentPortal from "./pages/ParentPortal";
import StudentPanel from "./pages/StudentPanel";
import Homework from "./pages/Homework";
import StudentProfile from "./pages/StudentProfile";
import DisabledStudents from "./pages/DisabledStudents";
import FinanceAudit from "./pages/FinanceAudit";
import FeeAdjustments from "./pages/FeeAdjustments";
import Reconciliation from "./pages/Reconciliation";
import Archives from "./pages/Archives";
import BroughtForwardBalances from "./pages/finance/BroughtForwardBalances";

// Exam Module v2
import MarksEntry from "./pages/exams/MarksEntry";
import ExamReview from "./pages/exams/ExamReview";
import ExamAnalytics from "./pages/exams/ExamAnalytics";
import ReportCards from "./pages/exams/ReportCards";
import AssessmentSettings from "./pages/settings/AssessmentSettings";
import {
  RolesList,
  RolePermissionsEditor,
} from "./pages/settings/RolesPermissions";

// Assessments Module v2 (CBC)
import AssessmentsList from "./pages/assessments/Assessments";
import AssessmentDetail from "./pages/assessments/AssessmentDetail";
import AssessmentTasks from "./pages/assessments/AssessmentTasks";
import AssessmentMarksEntry from "./pages/assessments/MarksEntry";
import AssessmentResults from "./pages/assessments/Results";
import AssessmentReportCards from "./pages/assessments/ReportCards";
import AssessmentReportCardTemplates from "./pages/assessments/ReportCardTemplates";
import AssessmentAnalytics from "./pages/assessments/Analytics";
import AssessmentRemarkBands from "./pages/assessments/RemarkBands";
import Events from "./pages/Events";

// Academic Module
import ClassTimetable from "./pages/academics/ClassTimetable";
import TeacherTimetable from "./pages/academics/TeacherTimetable";
import AssignClassTeacher from "./pages/academics/AssignClassTeacher";
import Subjects from "./pages/academics/Subjects";
import SubjectAllocation from "./pages/academics/SubjectAllocation";
import TeacherAllocation from "./pages/academics/TeacherAllocation";
import Clubs from "./pages/academics/clubs/Clubs";
import ClubDetail from "./pages/academics/clubs/ClubDetail";

// HR Module
import StaffDirectory from "./pages/StaffDirectory";
import StaffAttendance from "./pages/StaffAttendance";
import LeaveManagement from "./pages/LeaveManagement";
import Payroll from "./pages/Payroll";
import Departments from "./pages/Departments";
import Ratings from "./pages/Ratings";
import ChangePassword from "./pages/ChangePassword";

// Reports
import FinanceReports from "./pages/reports/FinanceReports";
import StudentReports from "./pages/reports/StudentReports";
import AttendanceReports from "./pages/reports/AttendanceReports";
import ExamReports from "./pages/reports/ExamReports";
import HRReports from "./pages/reports/HRReports";
import HomeworkReports from "./pages/reports/HomeworkReports";
import LibraryReports from "./pages/reports/LibraryReports";
import TransportReports from "./pages/reports/TransportReports";
import UserLogs from "./pages/reports/UserLogs";
import AuditTrail from "./pages/reports/AuditTrail";

// Designations (split from Departments)
import Designations from "./pages/Designations";

// Split communication pages
import CommunicationSms from "./pages/communication/SmsPage";
import CommunicationEmail from "./pages/communication/EmailPage";
import CommunicationNoticeboard from "./pages/communication/NoticeboardPage";
import CommunicationTemplates from "./pages/communication/TemplatesPage";
import CommunicationSmsLog from "./pages/communication/SmsLogPage";
import CommunicationEmailLog from "./pages/communication/EmailLogPage";

// Split inventory pages
import InventoryCatalog from "./pages/inventory/CatalogPage";
import InventorySell from "./pages/inventory/SellPage";
import InventoryHistory from "./pages/inventory/HistoryPage";
import InventorySuppliers from "./pages/inventory/SuppliersPage";
import InventoryPurchaseOrders from "./pages/inventory/PurchaseOrdersPage";
import InventoryCategories from "./pages/inventory/CategoriesPage";

// Lesson Plans (CBE)
import LessonPlans from "./pages/lesson-plans/LessonPlans";
import LessonPlanEditor from "./pages/lesson-plans/LessonPlanEditor";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <PortalAuthProvider>
        <PlatformAuthProvider>
          <SchoolProvider>
            <TermProvider>
              <TooltipProvider>
                <ErrorBoundary>
                  <Toaster />
                  <Sonner />
                <BrowserRouter>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/userLogin" element={<UserLogin />} />
                    <Route
                      path="/forgot-password"
                      element={<ForgotPassword />}
                    />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/unauthorized" element={<Unauthorized />} />

                    {/* Portal routes (parent/student) */}
                    <Route
                      path="/portal/parent"
                      element={
                        <PortalProtectedRoute allow={["parent"]}>
                          <ParentDashboard />
                        </PortalProtectedRoute>
                      }
                    />
                    <Route
                      path="/portal/student"
                      element={
                        <PortalProtectedRoute allow={["student"]}>
                          <StudentDashboard />
                        </PortalProtectedRoute>
                      }
                    />
                    <Route
                      path="/portal/parent/results"
                      element={
                        <PortalProtectedRoute allow={["parent"]}>
                          <ParentResults />
                        </PortalProtectedRoute>
                      }
                    />
                    <Route
                      path="/portal/parent/attendance"
                      element={
                        <PortalProtectedRoute allow={["parent"]}>
                          <ParentAttendance />
                        </PortalProtectedRoute>
                      }
                    />
                    <Route
                      path="/portal/parent/fees"
                      element={
                        <PortalProtectedRoute allow={["parent"]}>
                          <ParentFees />
                        </PortalProtectedRoute>
                      }
                    />
                    <Route
                      path="/portal/parent/profile"
                      element={
                        <PortalProtectedRoute allow={["parent"]}>
                          <ParentProfilePage />
                        </PortalProtectedRoute>
                      }
                    />
                    <Route
                      path="/portal/student/results"
                      element={
                        <PortalProtectedRoute allow={["student"]}>
                          <StudentResults />
                        </PortalProtectedRoute>
                      }
                    />
                    <Route
                      path="/portal/student/attendance"
                      element={
                        <PortalProtectedRoute allow={["student"]}>
                          <StudentAttendance />
                        </PortalProtectedRoute>
                      }
                    />
                    <Route
                      path="/portal/student/fees"
                      element={
                        <PortalProtectedRoute allow={["student"]}>
                          <PortalStudentFees />
                        </PortalProtectedRoute>
                      }
                    />
                    <Route
                      path="/portal/student/profile"
                      element={
                        <PortalProtectedRoute allow={["student"]}>
                          <StudentProfilePage />
                        </PortalProtectedRoute>
                      }
                    />

                    {/* Protected routes */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/students"
                      element={
                        <ProtectedRoute>
                          <Students />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/students/disabled"
                      element={
                        <ProtectedRoute
                          roles={["super_admin", "manager", "admin"]}
                        >
                          <DisabledStudents />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/students/:studentId"
                      element={
                        <ProtectedRoute>
                          <StudentProfile />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/parents"
                      element={
                        <ProtectedRoute>
                          <Parents />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/parents/:id"
                      element={
                        <ProtectedRoute>
                          <ParentProfile />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/staff/:id"
                      element={
                        <ProtectedRoute>
                          <StaffProfile />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/attendance"
                      element={
                        <ProtectedRoute>
                          <Attendance />
                        </ProtectedRoute>
                      }
                    />

                    {/* Academic Module */}
                    <Route
                      path="/classes"
                      element={
                        <ProtectedRoute>
                          <Classes />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/streams"
                      element={
                        <ProtectedRoute>
                          <Streams />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/subjects"
                      element={
                        <ProtectedRoute>
                          <Subjects />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/class-timetable"
                      element={
                        <ProtectedRoute>
                          <ClassTimetable />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/teacher-timetable"
                      element={
                        <ProtectedRoute>
                          <TeacherTimetable />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/assign-class-teacher"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "deputy_admin",
                          ]}
                        >
                          <AssignClassTeacher />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/subject-allocation"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "deputy_admin",
                          ]}
                        >
                          <SubjectAllocation />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/teacher-allocation"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "deputy_admin",
                          ]}
                        >
                          <TeacherAllocation />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/clubs"
                      element={
                        <ProtectedRoute>
                          <Clubs />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/clubs/:id"
                      element={
                        <ProtectedRoute>
                          <ClubDetail />
                        </ProtectedRoute>
                      }
                    />
                    {/* Assessments (renamed from Examinations) */}
                    <Route
                      path="/assessments"
                      element={
                        <ProtectedRoute>
                          <AssessmentsList />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/assessments/tasks"
                      element={
                        <ProtectedRoute>
                          <AssessmentTasks />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/assessments/marks/:taskId"
                      element={
                        <ProtectedRoute>
                          <AssessmentMarksEntry />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/assessments/results"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "deputy_admin",
                            "teacher",
                          ]}
                        >
                          <AssessmentResults />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/assessments/report-cards"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "deputy_admin",
                            "teacher",
                          ]}
                        >
                          <AssessmentReportCards />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/assessments/templates"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "deputy_admin",
                          ]}
                        >
                          <AssessmentReportCardTemplates />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/assessments/analytics"
                      element={
                        <ProtectedRoute>
                          <AssessmentAnalytics />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/assessments/remark-bands"
                      element={
                        <ProtectedRoute>
                          <AssessmentRemarkBands />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/events"
                      element={
                        <ProtectedRoute>
                          <Events />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/assessments/:id"
                      element={
                        <ProtectedRoute>
                          <AssessmentDetail />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/assessments/settings"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "deputy_admin",
                          ]}
                        >
                          <AssessmentSettings />
                        </ProtectedRoute>
                      }
                    />
                    {/* Backward-compatible redirect for legacy /examinations */}
                    <Route
                      path="/examinations"
                      element={
                        <ProtectedRoute>
                          <AssessmentsList />
                        </ProtectedRoute>
                      }
                    />
                    {/* Legacy exam pages (kept for migration) */}
                    <Route
                      path="/exams/entry"
                      element={
                        <ProtectedRoute>
                          <MarksEntry />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/exams/review"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "deputy_admin",
                            "teacher",
                          ]}
                        >
                          <ExamReview />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/exams/analytics"
                      element={
                        <ProtectedRoute>
                          <ExamAnalytics />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/reports/cards"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "deputy_admin",
                            "teacher",
                          ]}
                        >
                          <ReportCards />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings/academics"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "deputy_admin",
                          ]}
                        >
                          <AssessmentSettings />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/homework"
                      element={
                        <ProtectedRoute>
                          <Homework />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/promotion"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "deputy_admin",
                          ]}
                        >
                          <Promotion />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/communication"
                      element={
                        <ProtectedRoute>
                          <Communication />
                        </ProtectedRoute>
                      }
                    />

                    {/* Finance Module */}
                    <Route
                      path="/finance"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "deputy_admin",
                            "finance_officer",
                          ]}
                        >
                          <Finance />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/fee-assignment"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "deputy_admin",
                            "finance_officer",
                          ]}
                        >
                          <FeeAssignment />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/fee-discounts"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "deputy_admin",
                            "finance_officer",
                          ]}
                        >
                          <FeeDiscounts />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/student-fees/:studentId"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "admin",
                            "accountant",
                            "finance_officer",
                          ]}
                        >
                          <StudentFees />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/payments"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "deputy_admin",
                            "finance_officer",
                            "front_office",
                          ]}
                        >
                          <Payments />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/excess-payments"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "deputy_admin",
                            "finance_officer",
                          ]}
                        >
                          <ExcessPayments />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/unallocated-payments"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "deputy_admin",
                            "finance_officer",
                          ]}
                        >
                          <UnallocatedPayments />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/fee-reminders"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "deputy_admin",
                            "finance_officer",
                          ]}
                        >
                          <FeeReminders />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/fee-adjustments"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "deputy_admin",
                            "finance_officer",
                          ]}
                        >
                          <FeeAdjustments />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/finance-audit"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "deputy_admin",
                            "finance_officer",
                            "auditor",
                          ]}
                        >
                          <FinanceAudit />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/finance/brought-forward"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "admin",
                            "accountant",
                            "finance_officer",
                          ]}
                        >
                          <BroughtForwardBalances />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/reports/reconciliation"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "deputy_admin",
                            "finance_officer",
                            "auditor",
                          ]}
                        >
                          <Reconciliation />
                        </ProtectedRoute>
                      }
                    />

                    {/* Expenses Module */}
                    <Route
                      path="/expenses"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "deputy_admin",
                            "finance_officer",
                          ]}
                        >
                          <Expenses />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/income"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "admin",
                            "accountant",
                            "school_admin",
                            "finance_officer",
                          ]}
                        >
                          <Income />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/payments/in-kind"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "admin",
                            "accountant",
                            "finance_officer",
                          ]}
                        >
                          <InKindPayments />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/payments/bulk-bursary"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "admin",
                            "accountant",
                            "finance_officer",
                          ]}
                        >
                          <BulkBursary />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings/api-keys"
                      element={
                        <ProtectedRoute
                          roles={["super_admin", "school_admin", "admin"]}
                        >
                          <ApiKeysPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* HR Module */}
                    <Route
                      path="/staff-directory"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "deputy_admin",
                          ]}
                        >
                          <StaffDirectory />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/staff-attendance"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "deputy_admin",
                          ]}
                        >
                          <StaffAttendance />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/leave-management"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "deputy_admin",
                          ]}
                        >
                          <LeaveManagement />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/payroll"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "deputy_admin",
                            "finance_officer",
                          ]}
                        >
                          <Payroll />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/departments"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "deputy_admin",
                            "admin",
                          ]}
                        >
                          <Departments />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/ratings"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "deputy_admin",
                            "admin",
                            "manager",
                          ]}
                        >
                          <Ratings />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/change-password"
                      element={
                        <ProtectedRoute>
                          <ChangePassword />
                        </ProtectedRoute>
                      }
                    />

                    {/* Admin */}
                    <Route
                      path="/inventory"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "deputy_admin",
                            "store_manager",
                            "pos_attendant",
                          ]}
                        >
                          <Inventory />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/library"
                      element={
                        <ProtectedRoute>
                          <Library />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "deputy_admin",
                          ]}
                        >
                          <Settings />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings/roles"
                      element={
                        <ProtectedRoute roles={["super_admin", "school_admin"]}>
                          <RolesList />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings/roles/:role/permissions"
                      element={
                        <ProtectedRoute roles={["super_admin", "school_admin"]}>
                          <RolePermissionsEditor />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/archives"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "deputy_admin",
                            "auditor",
                          ]}
                        >
                          <Archives />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/parent-portal"
                      element={
                        <ProtectedRoute roles={["parent"]}>
                          <ParentPortal />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/student-panel"
                      element={
                        <ProtectedRoute roles={["student"]}>
                          <StudentPanel />
                        </ProtectedRoute>
                      }
                    />

                    {/* Reports */}
                    <Route
                      path="/reports/finance"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "deputy_admin",
                            "finance_officer",
                            "auditor",
                          ]}
                        >
                          <FinanceReports />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/reports/students"
                      element={
                        <ProtectedRoute>
                          <StudentReports />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/reports/attendance"
                      element={
                        <ProtectedRoute>
                          <AttendanceReports />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/reports/examinations"
                      element={
                        <ProtectedRoute>
                          <ExamReports />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/reports/hr"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "deputy_admin",
                          ]}
                        >
                          <HRReports />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/reports/homework"
                      element={
                        <ProtectedRoute>
                          <HomeworkReports />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/reports/library"
                      element={
                        <ProtectedRoute>
                          <LibraryReports />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/reports/transport"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "deputy_admin",
                          ]}
                        >
                          <TransportReports />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/reports/user-logs"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "deputy_admin",
                          ]}
                        >
                          <UserLogs />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/reports/audit-trail"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "deputy_admin",
                            "auditor",
                          ]}
                        >
                          <AuditTrail />
                        </ProtectedRoute>
                      }
                    />

                    {/* Lesson Plans (CBE) */}
                    <Route
                      path="/lesson-plans"
                      element={
                        <ProtectedRoute>
                          <LessonPlans />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/lesson-plans/new"
                      element={
                        <ProtectedRoute>
                          <LessonPlanEditor />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/lesson-plans/:id"
                      element={
                        <ProtectedRoute>
                          <LessonPlanEditor />
                        </ProtectedRoute>
                      }
                    />

                    {/* Top-level shortcuts for audit + user logs */}
                    <Route
                      path="/audit-trail"
                      element={
                        <ProtectedRoute>
                          <AuditTrail />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/user-logs"
                      element={
                        <ProtectedRoute>
                          <UserLogs />
                        </ProtectedRoute>
                      }
                    />

                    {/* Designations (split from Departments) */}
                    <Route
                      path="/designations"
                      element={
                        <ProtectedRoute
                          roles={[
                            "super_admin",
                            "school_admin",
                            "deputy_admin",
                            "admin",
                          ]}
                        >
                          <Designations />
                        </ProtectedRoute>
                      }
                    />

                    {/* Communication subpages */}
                    <Route
                      path="/communication/sms"
                      element={
                        <ProtectedRoute>
                          <CommunicationSms />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/communication/email"
                      element={
                        <ProtectedRoute>
                          <CommunicationEmail />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/communication/noticeboard"
                      element={
                        <ProtectedRoute>
                          <CommunicationNoticeboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/communication/templates"
                      element={
                        <ProtectedRoute>
                          <CommunicationTemplates />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/communication/sms-log"
                      element={
                        <ProtectedRoute>
                          <CommunicationSmsLog />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/communication/email-log"
                      element={
                        <ProtectedRoute>
                          <CommunicationEmailLog />
                        </ProtectedRoute>
                      }
                    />

                    {/* Inventory subpages */}
                    <Route
                      path="/inventory/catalog"
                      element={
                        <ProtectedRoute>
                          <InventoryCatalog />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/inventory/sell"
                      element={
                        <ProtectedRoute>
                          <InventorySell />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/inventory/history"
                      element={
                        <ProtectedRoute>
                          <InventoryHistory />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/inventory/suppliers"
                      element={
                        <ProtectedRoute>
                          <InventorySuppliers />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/inventory/purchase-orders"
                      element={
                        <ProtectedRoute>
                          <InventoryPurchaseOrders />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/inventory/categories"
                      element={
                        <ProtectedRoute>
                          <InventoryCategories />
                        </ProtectedRoute>
                      }
                    />

                    {/* SaaS Admin Routes */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route
                      path="/admin"
                      element={
                        <PlatformProtectedRoute>
                          <AdminLayout />
                        </PlatformProtectedRoute>
                      }
                    >
                      <Route index element={<AdminOverview />} />
                      <Route path="schools" element={<AdminSchools />} />
                      <Route path="schools/:id" element={<AdminSchoolDetail />} />
                      <Route path="billing" element={<AdminBilling />} />
                      <Route path="plans" element={<AdminPlans />} />
                      <Route path="users" element={<AdminUsers />} />
                      <Route path="staff" element={<AdminStaff />} />
                      <Route path="audit" element={<AdminAudit />} />
                    </Route>

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </ErrorBoundary>
            </TooltipProvider>
          </TermProvider>
        </SchoolProvider>
        </PlatformAuthProvider>
      </PortalAuthProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
