import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/fee-assignment" element={<FeeAssignment />} />
            <Route path="/student-fees/:studentId" element={<StudentFees />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/parents" element={<Parents />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/examinations" element={<Examinations />} />
            <Route path="/classes" element={<Classes />} />
            <Route path="/library" element={<Library />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/communication" element={<Communication />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/promotion" element={<Promotion />} />
            <Route path="/parent-portal" element={<ParentPortal />} />
            <Route path="/student-panel" element={<StudentPanel />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
