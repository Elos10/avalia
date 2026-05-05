import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import AdminModule from "./pages/AdminModule";
import CreateAssessment from "./pages/CreateAssessment";
import ManageAssessments from "./pages/ManageAssessments";
import QuestionBank from "./pages/QuestionBank";
import AccessControl from "./pages/AccessControl";
import AssessmentRelease from "./pages/AssessmentRelease";
import BnccSkills from "./pages/BnccSkills";
import StudentModule from "./pages/StudentModule";
import ReportsModule from "./pages/ReportsModule";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AvailableAssessments from "./pages/AvailableAssessments";
import TakeAssessment from "./pages/TakeAssessment";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<AuthRoute><Auth /></AuthRoute>} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminModule /></ProtectedRoute>} />
            <Route path="/admin/criar" element={<ProtectedRoute><CreateAssessment /></ProtectedRoute>} />
            <Route path="/admin/gerenciar" element={<ProtectedRoute><ManageAssessments /></ProtectedRoute>} />
            <Route path="/admin/acesso" element={<ProtectedRoute><AccessControl /></ProtectedRoute>} />
            <Route path="/admin/habilidades" element={<ProtectedRoute><BnccSkills /></ProtectedRoute>} />
            <Route path="/admin/liberar" element={<ProtectedRoute><AssessmentRelease /></ProtectedRoute>} />
            <Route path="/admin/banco-questoes" element={<ProtectedRoute><QuestionBank /></ProtectedRoute>} />
            <Route path="/aluno" element={<ProtectedRoute><StudentModule /></ProtectedRoute>} />
            <Route path="/avaliacoes" element={<ProtectedRoute><AvailableAssessments /></ProtectedRoute>} />
            <Route path="/avaliar/:assessmentId" element={<ProtectedRoute><TakeAssessment /></ProtectedRoute>} />
            <Route path="/relatorios" element={<ProtectedRoute><ReportsModule /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
