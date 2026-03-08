import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Finance from "./pages/Finance";
import Payments from "./pages/Payments";
import Parents from "./pages/Parents";
import Attendance from "./pages/Attendance";
import Inventory from "./pages/Inventory";
import Settings from "./pages/Settings";
import Examinations from "./pages/Examinations";
import Classes from "./pages/Classes";
import Expenses from "./pages/Expenses";
import Communication from "./pages/Communication";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
          <Route path="/payments" element={<Payments />} />
          <Route path="/parents" element={<Parents />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/examinations" element={<Examinations />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/communication" element={<Communication />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
