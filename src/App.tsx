import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import TeamManagement from "./pages/TeamManagement";
import Questionnaires from "./pages/Questionnaires";
import Diary from "./pages/Diary";
import ProgressTracker from "./pages/ProgressTracker";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import AIInsights from "./pages/AIInsights";

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
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/team" element={
              <ProtectedRoute>
                <TeamManagement />
              </ProtectedRoute>
            } />
            <Route path="/questionnaires" element={
              <ProtectedRoute>
                <Questionnaires />
              </ProtectedRoute>
            } />
            <Route path="/diary" element={
              <ProtectedRoute>
                <Diary />
              </ProtectedRoute>
            } />
            <Route path="/progress" element={
              <ProtectedRoute>
                <ProgressTracker />
              </ProtectedRoute>
            } />
            <Route path="/ai-insights" element={
              <ProtectedRoute>
                <AIInsights />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
