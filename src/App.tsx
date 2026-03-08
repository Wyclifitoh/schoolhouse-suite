import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SchoolProvider } from "@/contexts/SchoolContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
import Parents from "./pages/Parents";
import Attendance from "./pages/Attendance";
import Inventory from "./pages/Inventory";
import Settings from "./pages/Settings";
import Examinations from "./pages/Examinations";
import Classes from "./pages/Classes";
import Library from "./pages/Library";
import Expenses from "./pages/Expenses";
import Communication from "./pages/Communication";
import Reports from "./pages/Reports";
import Promotion from "./pages/Promotion";
import ParentPortal from "./pages/ParentPortal";
import StudentPanel from "./pages/StudentPanel";
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
                <Route path="/finance" element={<ProtectedRoute roles={["super_admin", "school_admin", "deputy_admin", "finance_officer"]}><Finance /></ProtectedRoute>} />
                <Route path="/fee-assignment" element={<ProtectedRoute roles={["super_admin", "school_admin", "deputy_admin", "finance_officer"]}><FeeAssignment /></ProtectedRoute>} />
                <Route path="/student-fees/:studentId" element={<ProtectedRoute><StudentFees /></ProtectedRoute>} />
                <Route path="/payments" element={<ProtectedRoute roles={["super_admin", "school_admin", "deputy_admin", "finance_officer", "front_office"]}><Payments /></ProtectedRoute>} />
                <Route path="/parents" element={<ProtectedRoute><Parents /></ProtectedRoute>} />
                <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
                <Route path="/inventory" element={<ProtectedRoute roles={["super_admin", "school_admin", "deputy_admin", "store_manager", "pos_attendant"]}><Inventory /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute roles={["super_admin", "school_admin", "deputy_admin"]}><Settings /></ProtectedRoute>} />
                <Route path="/examinations" element={<ProtectedRoute><Examinations /></ProtectedRoute>} />
                <Route path="/classes" element={<ProtectedRoute><Classes /></ProtectedRoute>} />
                <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
                <Route path="/expenses" element={<ProtectedRoute roles={["super_admin", "school_admin", "deputy_admin", "finance_officer"]}><Expenses /></ProtectedRoute>} />
                <Route path="/communication" element={<ProtectedRoute><Communication /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute roles={["super_admin", "school_admin", "deputy_admin", "finance_officer", "auditor"]}><Reports /></ProtectedRoute>} />
                <Route path="/promotion" element={<ProtectedRoute roles={["super_admin", "school_admin", "deputy_admin"]}><Promotion /></ProtectedRoute>} />
                <Route path="/parent-portal" element={<ProtectedRoute roles={["parent"]}><ParentPortal /></ProtectedRoute>} />
                <Route path="/student-panel" element={<ProtectedRoute roles={["student"]}><StudentPanel /></ProtectedRoute>} />

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
