import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "@/contexts/WalletContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Verify from "./pages/Verify";
import Login from "./pages/Login";
import RoleSelect from "./pages/RoleSelect";
import StudentOnboarding from "./pages/onboarding/StudentOnboarding";
import InstitutionOnboarding from "./pages/onboarding/InstitutionOnboarding";
import VerifierOnboarding from "./pages/onboarding/VerifierOnboarding";
import StudentDashboard from "./pages/student/Dashboard";
import StudentCredentials from "./pages/student/Credentials";
import ResumeBuilder from "./pages/student/ResumeBuilder";
import IssuerDashboard from "./pages/issuer/Dashboard";
import IssueCredential from "./pages/issuer/IssueCredential";
import VerifierDashboard from "./pages/verifier/Dashboard";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminInstitutions from "./pages/admin/Institutions";
import AdminSettings from "./pages/admin/Settings";
import RoleManagement from "./pages/admin/RoleManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WalletProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/verify" element={<Verify />} />
              <Route path="/login" element={<Login />} />
              
              {/* Role selection - for first-time users */}
              <Route path="/role-select" element={
                <ProtectedRoute requireAuth>
                  <RoleSelect />
                </ProtectedRoute>
              } />
              
              {/* Onboarding routes - for first-time users after role selection */}
              <Route path="/onboarding/student" element={
                <ProtectedRoute requireAuth>
                  <StudentOnboarding />
                </ProtectedRoute>
              } />
              <Route path="/onboarding/institution" element={
                <ProtectedRoute requireAuth>
                  <InstitutionOnboarding />
                </ProtectedRoute>
              } />
              <Route path="/onboarding/verifier" element={
                <ProtectedRoute requireAuth>
                  <VerifierOnboarding />
                </ProtectedRoute>
              } />
              
              {/* Dashboard redirect */}
              <Route path="/dashboard" element={
                <ProtectedRoute requireAuth>
                  <RoleSelect />
                </ProtectedRoute>
              } />
              
              {/* Student routes - require student role */}
              <Route path="/student/dashboard" element={
                <ProtectedRoute requiredRole="student">
                  <StudentDashboard />
                </ProtectedRoute>
              } />
              <Route path="/student/credentials" element={
                <ProtectedRoute requiredRole="student">
                  <StudentCredentials />
                </ProtectedRoute>
              } />
              <Route path="/student/resume-builder" element={
                <ProtectedRoute requiredRole="student">
                  <ResumeBuilder />
                </ProtectedRoute>
              } />
              
              {/* Issuer routes - require issuer role */}
              <Route path="/issuer/dashboard" element={
                <ProtectedRoute requiredRole="issuer">
                  <IssuerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/issuer/issue" element={
                <ProtectedRoute requiredRole="issuer">
                  <IssueCredential />
                </ProtectedRoute>
              } />
              
              {/* Verifier routes - require verifier role */}
              <Route path="/verifier/dashboard" element={
                <ProtectedRoute requiredRole="verifier">
                  <VerifierDashboard />
                </ProtectedRoute>
              } />
              
              {/* Admin routes - require admin role */}
              <Route path="/admin/dashboard" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminUsers />
                </ProtectedRoute>
              } />
              <Route path="/admin/institutions" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminInstitutions />
                </ProtectedRoute>
              } />
              <Route path="/admin/settings" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminSettings />
                </ProtectedRoute>
              } />
              <Route path="/admin/roles" element={
                <ProtectedRoute requiredRole="admin">
                  <RoleManagement />
                </ProtectedRoute>
              } />
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </WalletProvider>
  </QueryClientProvider>
);

export default App;
