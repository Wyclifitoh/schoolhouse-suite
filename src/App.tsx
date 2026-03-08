import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SchoolProvider } from "@/contexts/SchoolContext";
import { TermProvider } from "@/contexts/TermContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Auth pages
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Unauthorized from "./pages/Unauthorized";

// Dashboard pages
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Finance from "./pages/Finance";
import FeeAssignment from "./pages/FeeAssignment";
import StudentFees from "./pages/StudentFees";
import Payments from "./pages/Payments";
import ExcessPayments from "./pages/ExcessPayments";
import FeeReminders from "./pages/FeeReminders";
import Parents from "./pages/Parents";
import Attendance from "./pages/Attendance";
import Inventory from "./pages/Inventory";
import Settings from "./pages/Settings";
import Examinations from "./pages/Examinations";
import Classes from "./pages/Classes";
import Library from "./pages/Library";
import Expenses from "./pages/Expenses";
import Communication from "./pages/Communication";
import Promotion from "./pages/Promotion";
import ParentPortal from "./pages/ParentPortal";
import StudentPanel from "./pages/StudentPanel";
import Homework from "./pages/Homework";

// Academic Module
import ClassTimetable from "./pages/academics/ClassTimetable";
import TeacherTimetable from "./pages/academics/TeacherTimetable";
import AssignClassTeacher from "./pages/academics/AssignClassTeacher";
import Subjects from "./pages/academics/Subjects";
import Streams from "./pages/academics/Streams";

// HR Module
import StaffDirectory from "./pages/StaffDirectory";
import StaffAttendance from "./pages/StaffAttendance";
import LeaveManagement from "./pages/LeaveManagement";
import Payroll from "./pages/Payroll";
import Departments from "./pages/Departments";

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
      <SchoolProvider>
        <TooltipProvider>
          <ErrorBoundary>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* Protected routes */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
                <Route path="/parents" element={<ProtectedRoute><Parents /></ProtectedRoute>} />
                <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />

                {/* Academic Module */}
                <Route path="/classes" element={<ProtectedRoute><Classes /></ProtectedRoute>} />
                <Route path="/streams" element={<ProtectedRoute><Streams /></ProtectedRoute>} />
                <Route path="/subjects" element={<ProtectedRoute><Subjects /></ProtectedRoute>} />
                <Route path="/class-timetable" element={<ProtectedRoute><ClassTimetable /></ProtectedRoute>} />
                <Route path="/teacher-timetable" element={<ProtectedRoute><TeacherTimetable /></ProtectedRoute>} />
                <Route path="/assign-class-teacher" element={<ProtectedRoute roles={["super_admin", "school_admin", "deputy_admin"]}><AssignClassTeacher /></ProtectedRoute>} />
                <Route path="/examinations" element={<ProtectedRoute><Examinations /></ProtectedRoute>} />
                <Route path="/homework" element={<ProtectedRoute><Homework /></ProtectedRoute>} />
                <Route path="/promotion" element={<ProtectedRoute roles={["super_admin", "school_admin", "deputy_admin"]}><Promotion /></ProtectedRoute>} />
                <Route path="/communication" element={<ProtectedRoute><Communication /></ProtectedRoute>} />

                {/* Finance Module */}
                <Route path="/finance" element={<ProtectedRoute roles={["super_admin", "school_admin", "deputy_admin", "finance_officer"]}><Finance /></ProtectedRoute>} />
                <Route path="/fee-assignment" element={<ProtectedRoute roles={["super_admin", "school_admin", "deputy_admin", "finance_officer"]}><FeeAssignment /></ProtectedRoute>} />
                <Route path="/student-fees/:studentId" element={<ProtectedRoute><StudentFees /></ProtectedRoute>} />
                <Route path="/payments" element={<ProtectedRoute roles={["super_admin", "school_admin", "deputy_admin", "finance_officer", "front_office"]}><Payments /></ProtectedRoute>} />
                <Route path="/excess-payments" element={<ProtectedRoute roles={["super_admin", "school_admin", "deputy_admin", "finance_officer"]}><ExcessPayments /></ProtectedRoute>} />
                <Route path="/fee-reminders" element={<ProtectedRoute roles={["super_admin", "school_admin", "deputy_admin", "finance_officer"]}><FeeReminders /></ProtectedRoute>} />

                {/* Expenses Module */}
                <Route path="/expenses" element={<ProtectedRoute roles={["super_admin", "school_admin", "deputy_admin", "finance_officer"]}><Expenses /></ProtectedRoute>} />

                {/* HR Module */}
                <Route path="/staff-directory" element={<ProtectedRoute roles={["super_admin", "school_admin", "deputy_admin"]}><StaffDirectory /></ProtectedRoute>} />
                <Route path="/staff-attendance" element={<ProtectedRoute roles={["super_admin", "school_admin", "deputy_admin"]}><StaffAttendance /></ProtectedRoute>} />
                <Route path="/leave-management" element={<ProtectedRoute roles={["super_admin", "school_admin", "deputy_admin"]}><LeaveManagement /></ProtectedRoute>} />
                <Route path="/payroll" element={<ProtectedRoute roles={["super_admin", "school_admin", "deputy_admin", "finance_officer"]}><Payroll /></ProtectedRoute>} />
                <Route path="/departments" element={<ProtectedRoute roles={["super_admin", "school_admin", "deputy_admin"]}><Departments /></ProtectedRoute>} />

                {/* Admin */}
                <Route path="/inventory" element={<ProtectedRoute roles={["super_admin", "school_admin", "deputy_admin", "store_manager", "pos_attendant"]}><Inventory /></ProtectedRoute>} />
                <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute roles={["super_admin", "school_admin", "deputy_admin"]}><Settings /></ProtectedRoute>} />
                <Route path="/parent-portal" element={<ProtectedRoute roles={["parent"]}><ParentPortal /></ProtectedRoute>} />
                <Route path="/student-panel" element={<ProtectedRoute roles={["student"]}><StudentPanel /></ProtectedRoute>} />

                {/* Reports */}
                <Route path="/reports/finance" element={<ProtectedRoute roles={["super_admin", "school_admin", "deputy_admin", "finance_officer", "auditor"]}><FinanceReports /></ProtectedRoute>} />
                <Route path="/reports/students" element={<ProtectedRoute><StudentReports /></ProtectedRoute>} />
                <Route path="/reports/attendance" element={<ProtectedRoute><AttendanceReports /></ProtectedRoute>} />
                <Route path="/reports/examinations" element={<ProtectedRoute><ExamReports /></ProtectedRoute>} />
                <Route path="/reports/hr" element={<ProtectedRoute roles={["super_admin", "school_admin", "deputy_admin"]}><HRReports /></ProtectedRoute>} />
                <Route path="/reports/homework" element={<ProtectedRoute><HomeworkReports /></ProtectedRoute>} />
                <Route path="/reports/library" element={<ProtectedRoute><LibraryReports /></ProtectedRoute>} />
                <Route path="/reports/transport" element={<ProtectedRoute roles={["super_admin", "school_admin", "deputy_admin"]}><TransportReports /></ProtectedRoute>} />
                <Route path="/reports/user-logs" element={<ProtectedRoute roles={["super_admin", "school_admin", "deputy_admin"]}><UserLogs /></ProtectedRoute>} />
                <Route path="/reports/audit-trail" element={<ProtectedRoute roles={["super_admin", "school_admin", "deputy_admin", "auditor"]}><AuditTrail /></ProtectedRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ErrorBoundary>
        </TooltipProvider>
      </SchoolProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
