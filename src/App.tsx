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
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Auth pages
import Login from "./pages/Login";
import UserLogin from "./pages/UserLogin";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Unauthorized from "./pages/Unauthorized";

// Portal pages
import ParentDashboard from "./pages/portal/ParentDashboard";
import ParentChildren from "./pages/portal/ParentChildren";
import ParentChildDetail from "./pages/portal/ParentChildDetail";
import StudentDashboard from "./pages/portal/StudentDashboard";
import ParentDashboardNew from "./pages/portal/parent/Dashboard";
import ParentProfileNew from "./pages/portal/parent/Profile";
import ParentAcademicsNew from "./pages/portal/parent/Academics";
import ParentAttendanceNew from "./pages/portal/parent/Attendance";
import ParentHomeworkNew from "./pages/portal/parent/Homework";
import {
  FinancePage as ParentFinanceNew,
  TimetablePage as ParentTimetableNew,
  CommunicationPage as ParentCommunicationNew,
  CalendarPage as ParentCalendarNew,
  LibraryPage as ParentLibraryNew,
  TransportPage as ParentTransportNew,
  DownloadsPage as ParentDownloadsNew,
  SettingsPage as ParentSettingsNew,
} from "./pages/portal/parent/MorePages";
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
import SetupCenter from "./pages/settings/SetupCenter";
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
import FeeReport from "./pages/finance/FeeReport";

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
import SummativeReports from "./pages/assessments/SummativeReports";
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
import MyProfile from "./pages/MyProfile";

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
import ReportCenter from "./pages/reports/ReportCenter";
import ReportCategoryPage from "./pages/reports/ReportCategory";

// Designations (split from Departments)
import Designations from "./pages/Designations";

// Split communication pages
import CommunicationSms from "./pages/communication/SmsPage";
import CommunicationEmail from "./pages/communication/EmailPage";
import CommunicationNoticeboard from "./pages/communication/NoticeboardPage";
import CommunicationTemplates from "./pages/communication/TemplatesPage";
import CommunicationSmsLog from "./pages/communication/SmsLogPage";
import CommunicationEmailLog from "./pages/communication/EmailLogPage";

// New Communication Hub pages
import CommDashboard from "./pages/communication/DashboardPage";
import CommSend from "./pages/communication/SendMessagePage";
import CommCampaigns from "./pages/communication/CampaignsPage";
import CommAutomations from "./pages/communication/AutomationsPage";
import CommScheduled from "./pages/communication/ScheduledPage";
import CommHistory from "./pages/communication/HistoryPage";
import CommSettings from "./pages/communication/SettingsPage";

// Split inventory pages
import InventoryCatalog from "./pages/inventory/CatalogPage";
import InventorySell from "./pages/inventory/SellPage";
import InventoryHistory from "./pages/inventory/HistoryPage";
import InventorySuppliers from "./pages/inventory/SuppliersPage";
import InventoryPurchaseOrders from "./pages/inventory/PurchaseOrdersPage";
import InventoryCategories from "./pages/inventory/CategoriesPage";
import InventoryIssuances from "./pages/inventory/IssuancesPage";
import InventoryMovements from "./pages/inventory/MovementsPage";
import InventoryReports from "./pages/inventory/ReportsPage";

// Lesson Plans (CBE)
import LessonPlans from "./pages/lesson-plans/LessonPlans";
import LessonPlanEditor from "./pages/lesson-plans/LessonPlanEditor";

import NotFound from "./pages/NotFound";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import Billing from "./pages/Billing";

// Platform (super-admin) console
import AdminLogin from "./pages/admin/AdminLogin";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminSchools from "./pages/admin/AdminSchools";
import AdminSchoolDetail from "./pages/admin/AdminSchoolDetail";
import AdminBilling from "./pages/admin/AdminBilling";
import AdminPlans from "./pages/admin/AdminPlans";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAudit from "./pages/admin/AdminAudit";
import AdminStaff from "./pages/admin/AdminStaff";
import {
  AdminCommunications,
  AdminPlatformHealth,
} from "./pages/admin/placeholders";
import AdminFeatureFlags from "./pages/admin/AdminFeatureFlags";
import AdminSmsOps from "./pages/admin/AdminSmsOps";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PlatformProtectedRoute } from "@/components/admin/PlatformProtectedRoute";
import ApiKeysPage from "./pages/settings/ApiKeys";
import HelpCenter from "./pages/help/HelpCenter";
import HelpCategoryPage from "./pages/help/HelpCategoryPage";
import {
  HelpArticlePage,
  TroubleshootingArticlePage,
} from "./pages/help/HelpArticlePage";
import TroubleshootingIndex from "./pages/help/TroubleshootingIndex";
import GlossaryPage from "./pages/help/GlossaryPage";
import SupportPage from "./pages/help/SupportPage";
import WhatsNewPage from "./pages/help/WhatsNewPage";
import PrintableGuidePage from "./pages/help/PrintableGuidePage";

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
                      <Route path="/signup" element={<Signup />} />
                      <Route path="/onboarding" element={<Onboarding />} />
                      <Route path="/userLogin" element={<UserLogin />} />

                      {/* Platform super-admin console */}
                      <Route path="/admin/login" element={<AdminLogin />} />
                      <Route
                        path="/admin"
                        element={
                          <PlatformProtectedRoute>
                            <AdminLayout>
                              <AdminOverview />
                            </AdminLayout>
                          </PlatformProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/schools"
                        element={
                          <PlatformProtectedRoute>
                            <AdminLayout>
                              <AdminSchools />
                            </AdminLayout>
                          </PlatformProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/schools/:id"
                        element={
                          <PlatformProtectedRoute>
                            <AdminLayout>
                              <AdminSchoolDetail />
                            </AdminLayout>
                          </PlatformProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/billing"
                        element={
                          <PlatformProtectedRoute>
                            <AdminLayout>
                              <AdminBilling />
                            </AdminLayout>
                          </PlatformProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/plans"
                        element={
                          <PlatformProtectedRoute role="platform_admin">
                            <AdminLayout>
                              <AdminPlans />
                            </AdminLayout>
                          </PlatformProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/users"
                        element={
                          <PlatformProtectedRoute>
                            <AdminLayout>
                              <AdminUsers />
                            </AdminLayout>
                          </PlatformProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/staff"
                        element={
                          <PlatformProtectedRoute role="platform_admin">
                            <AdminLayout>
                              <AdminStaff />
                            </AdminLayout>
                          </PlatformProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/audit"
                        element={
                          <PlatformProtectedRoute>
                            <AdminLayout>
                              <AdminAudit />
                            </AdminLayout>
                          </PlatformProtectedRoute>
                        }
                      />
                      {[
                        { path: "/admin/analytics", el: <AdminAnalytics /> },
                        { path: "/admin/sms", el: <AdminSmsOps /> },
                        {
                          path: "/admin/communications",
                          el: <AdminCommunications />,
                        },
                        { path: "/admin/features", el: <AdminFeatureFlags /> },
                        { path: "/admin/health", el: <AdminPlatformHealth /> },
                        { path: "/admin/support", el: <AdminSupport /> },
                      ].map((r) => (
                        <Route
                          key={r.path}
                          path={r.path}
                          element={
                            <PlatformProtectedRoute>
                              <AdminLayout>{r.el}</AdminLayout>
                            </PlatformProtectedRoute>
                          }
                        />
                      ))}

                      <Route
                        path="/forgot-password"
                        element={<ForgotPassword />}
                      />
                      <Route
                        path="/reset-password"
                        element={<ResetPassword />}
                      />
                      <Route path="/unauthorized" element={<Unauthorized />} />

                      {/* Portal routes (parent/student) */}
                      <Route
                        path="/portal/parent"
                        element={
                          <PortalProtectedRoute allow={["parent"]}>
                            <ParentDashboardNew />
                          </PortalProtectedRoute>
                        }
                      />
                      <Route
                        path="/portal/parent/children"
                        element={
                          <PortalProtectedRoute allow={["parent"]}>
                            <ParentChildren />
                          </PortalProtectedRoute>
                        }
                      />
                      <Route
                        path="/portal/parent/children/:childId"
                        element={
                          <PortalProtectedRoute allow={["parent"]}>
                            <ParentChildDetail />
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
                            <ParentAttendanceNew />
                          </PortalProtectedRoute>
                        }
                      />
                      <Route
                        path="/portal/parent/fees"
                        element={
                          <PortalProtectedRoute allow={["parent"]}>
                            <ParentFinanceNew />
                          </PortalProtectedRoute>
                        }
                      />
                      <Route
                        path="/portal/parent/profile"
                        element={
                          <PortalProtectedRoute allow={["parent"]}>
                            <ParentProfileNew />
                          </PortalProtectedRoute>
                        }
                      />
                      <Route
                        path="/portal/parent/academics"
                        element={
                          <PortalProtectedRoute allow={["parent"]}>
                            <ParentAcademicsNew />
                          </PortalProtectedRoute>
                        }
                      />
                      <Route
                        path="/portal/parent/homework"
                        element={
                          <PortalProtectedRoute allow={["parent"]}>
                            <ParentHomeworkNew />
                          </PortalProtectedRoute>
                        }
                      />
                      <Route
                        path="/portal/parent/timetable"
                        element={
                          <PortalProtectedRoute allow={["parent"]}>
                            <ParentTimetableNew />
                          </PortalProtectedRoute>
                        }
                      />
                      <Route
                        path="/portal/parent/communication"
                        element={
                          <PortalProtectedRoute allow={["parent"]}>
                            <ParentCommunicationNew />
                          </PortalProtectedRoute>
                        }
                      />
                      <Route
                        path="/portal/parent/calendar"
                        element={
                          <PortalProtectedRoute allow={["parent"]}>
                            <ParentCalendarNew />
                          </PortalProtectedRoute>
                        }
                      />
                      <Route
                        path="/portal/parent/library"
                        element={
                          <PortalProtectedRoute allow={["parent"]}>
                            <ParentLibraryNew />
                          </PortalProtectedRoute>
                        }
                      />
                      <Route
                        path="/portal/parent/transport"
                        element={
                          <PortalProtectedRoute allow={["parent"]}>
                            <ParentTransportNew />
                          </PortalProtectedRoute>
                        }
                      />
                      <Route
                        path="/portal/parent/downloads"
                        element={
                          <PortalProtectedRoute allow={["parent"]}>
                            <ParentDownloadsNew />
                          </PortalProtectedRoute>
                        }
                      />
                      <Route
                        path="/portal/parent/settings"
                        element={
                          <PortalProtectedRoute allow={["parent"]}>
                            <ParentSettingsNew />
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
                        path="/assessments/summative"
                        element={
                          <ProtectedRoute>
                            <SummativeReports />
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
                            <CommDashboard />
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
                        path="/finance/fee-report"
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
                            <FeeReport />
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
                        path="/profile"
                        element={
                          <ProtectedRoute>
                            <MyProfile />
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
                        path="/settings/setup"
                        element={
                          <ProtectedRoute>
                            <SetupCenter />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/settings/roles"
                        element={
                          <ProtectedRoute
                            roles={["super_admin", "school_admin"]}
                          >
                            <RolesList />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/settings/billing"
                        element={
                          <ProtectedRoute
                            roles={["super_admin", "school_admin", "admin"]}
                          >
                            <Billing />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/settings/roles/:role/permissions"
                        element={
                          <ProtectedRoute
                            roles={["super_admin", "school_admin"]}
                          >
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
                        path="/reports"
                        element={
                          <ProtectedRoute>
                            <ReportCenter />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/reports/category/:category"
                        element={
                          <ProtectedRoute>
                            <ReportCategoryPage />
                          </ProtectedRoute>
                        }
                      />
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
                        path="/communication/send"
                        element={
                          <ProtectedRoute>
                            <CommSend />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/communication/campaigns"
                        element={
                          <ProtectedRoute>
                            <CommCampaigns />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/communication/automations"
                        element={
                          <ProtectedRoute>
                            <CommAutomations />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/communication/scheduled"
                        element={
                          <ProtectedRoute>
                            <CommScheduled />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/communication/history"
                        element={
                          <ProtectedRoute>
                            <CommHistory />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/communication/settings"
                        element={
                          <ProtectedRoute>
                            <CommSettings />
                          </ProtectedRoute>
                        }
                      />
                      {/* Legacy redirects */}

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
                      <Route
                        path="/inventory/issuances"
                        element={
                          <ProtectedRoute>
                            <InventoryIssuances />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/inventory/movements"
                        element={
                          <ProtectedRoute>
                            <InventoryMovements />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/inventory/reports"
                        element={
                          <ProtectedRoute>
                            <InventoryReports />
                          </ProtectedRoute>
                        }
                      />

                      {/* Help Center — available to every signed-in user */}
                      <Route
                        path="/help"
                        element={
                          <ProtectedRoute>
                            <HelpCenter />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/help/c/:categoryId"
                        element={
                          <ProtectedRoute>
                            <HelpCategoryPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/help/a/:slug"
                        element={
                          <ProtectedRoute>
                            <HelpArticlePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/help/troubleshooting"
                        element={
                          <ProtectedRoute>
                            <TroubleshootingIndex />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/help/t/:slug"
                        element={
                          <ProtectedRoute>
                            <TroubleshootingArticlePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/help/glossary"
                        element={
                          <ProtectedRoute>
                            <GlossaryPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/help/support"
                        element={
                          <ProtectedRoute>
                            <SupportPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/help/guide/:slug"
                        element={
                          <ProtectedRoute>
                            <PrintableGuidePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/whats-new"
                        element={
                          <ProtectedRoute>
                            <WhatsNewPage />
                          </ProtectedRoute>
                        }
                      />

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
