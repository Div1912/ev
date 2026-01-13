import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import { WalletProvider } from "@/contexts/WalletContext"
import { AuthProvider } from "@/contexts/AuthContext"
import ProtectedRoute from "@/components/ProtectedRoute"
import AuthGate from "@/components/AuthGate" // ✅ ADD THIS

// Public pages
import Index from "./pages/Index"
import Verify from "./pages/Verify"
import SignIn from "./pages/auth/SignIn"
import SignUp from "./pages/auth/SignUp"

// Onboarding
import SelectRole from "./pages/onboarding/SelectRole"
import StudentOnboarding from "./pages/onboarding/StudentOnboarding"
import InstitutionOnboarding from "./pages/onboarding/InstitutionOnboarding"
import VerifierOnboarding from "./pages/onboarding/VerifierOnboarding"

// Dashboards
import StudentDashboard from "./pages/dashboard/StudentDashboard"
import InstitutionDashboard from "./pages/dashboard/InstitutionDashboard"
import VerifierDashboard from "./pages/dashboard/VerifierDashboard"
import ShareCredential from "./pages/dashboard/ShareCredential"
import Settings from "./pages/Settings"

// Student legacy pages
import StudentCredentials from "./pages/student/Credentials"
import ResumeBuilder from "./pages/student/ResumeBuilder"

// Institution
import IssueCredential from "./pages/dashboard/IssueCredential"

// Admin
import AdminDashboard from "./pages/admin/Dashboard"
import AdminUsers from "./pages/admin/Users"
import AdminInstitutions from "./pages/admin/Institutions"
import AdminSettings from "./pages/admin/Settings"
import RoleManagement from "./pages/admin/RoleManagement"

import NotFound from "./pages/NotFound"
import Unauthorized from "./pages/Unauthorized"

const queryClient = new QueryClient()

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WalletProvider>
      <AuthProvider>
        {/* ✅ GLOBAL AUTH LOADING GATE */}
        <AuthGate>
          <TooltipProvider>
            <Toaster />
            <Sonner />

            <BrowserRouter>
              <Routes>

                {/* --------------------------------------------------
                 * SMART ENTRY POINT
                 * -------------------------------------------------- */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <Index />
                    </ProtectedRoute>
                  }
                />

                {/* --------------------------------------------------
                 * PUBLIC ROUTES
                 * -------------------------------------------------- */}
                <Route path="/verify" element={<Verify />} />

                {/* --------------------------------------------------
                 * AUTH ROUTES
                 * -------------------------------------------------- */}
                <Route path="/auth/sign-in" element={<SignIn />} />
                <Route path="/auth/sign-up" element={<SignUp />} />
                <Route path="/login" element={<Navigate to="/auth/sign-in" replace />} />

                {/* --------------------------------------------------
                 * ONBOARDING ROUTES
                 * -------------------------------------------------- */}
                <Route
                  path="/onboarding/select-role"
                  element={
                    <ProtectedRoute>
                      <SelectRole />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/onboarding/student"
                  element={
                    <ProtectedRoute>
                      <StudentOnboarding />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/onboarding/institution"
                  element={
                    <ProtectedRoute>
                      <InstitutionOnboarding />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/onboarding/verifier"
                  element={
                    <ProtectedRoute>
                      <VerifierOnboarding />
                    </ProtectedRoute>
                  }
                />

                {/* --------------------------------------------------
                 * STUDENT DASHBOARD
                 * -------------------------------------------------- */}
                <Route
                  path="/dashboard/student"
                  element={
                    <ProtectedRoute requiredRole="student">
                      <StudentDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/dashboard/student/credentials"
                  element={
                    <ProtectedRoute requiredRole="student">
                      <StudentCredentials />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/dashboard/student/share/:credentialId"
                  element={
                    <ProtectedRoute requiredRole="student">
                      <ShareCredential />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/dashboard/student/resume-builder"
                  element={
                    <ProtectedRoute requiredRole="student">
                      <ResumeBuilder />
                    </ProtectedRoute>
                  }
                />

                {/* --------------------------------------------------
                 * INSTITUTION DASHBOARD
                 * -------------------------------------------------- */}
                <Route
                  path="/dashboard/institution"
                  element={
                    <ProtectedRoute requiredRole="issuer">
                      <InstitutionDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/dashboard/institution/issue"
                  element={
                    <ProtectedRoute requiredRole="issuer">
                      <IssueCredential />
                    </ProtectedRoute>
                  }
                />

                {/* --------------------------------------------------
                 * VERIFIER DASHBOARD
                 * -------------------------------------------------- */}
                <Route
                  path="/dashboard/verifier"
                  element={
                    <ProtectedRoute requiredRole="verifier">
                      <VerifierDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* --------------------------------------------------
                 * SETTINGS
                 * -------------------------------------------------- */}
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />

                {/* --------------------------------------------------
                 * LEGACY REDIRECTS
                 * -------------------------------------------------- */}
                <Route path="/student/dashboard" element={<Navigate to="/dashboard/student" replace />} />
                <Route path="/student/credentials" element={<Navigate to="/dashboard/student/credentials" replace />} />
                <Route path="/student/resume-builder" element={<Navigate to="/dashboard/student/resume-builder" replace />} />
                <Route path="/issuer/dashboard" element={<Navigate to="/dashboard/institution" replace />} />
                <Route path="/issuer/issue" element={<Navigate to="/dashboard/institution/issue" replace />} />
                <Route path="/verifier/dashboard" element={<Navigate to="/dashboard/verifier" replace />} />

                {/* --------------------------------------------------
                 * ADMIN ROUTES
                 * -------------------------------------------------- */}
                <Route
                  path="/dashboard/admin"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route path="/admin/dashboard" element={<Navigate to="/dashboard/admin" replace />} />

                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminUsers />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/institutions"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminInstitutions />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/settings"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminSettings />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/roles"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <RoleManagement />
                    </ProtectedRoute>
                  }
                />

                {/* --------------------------------------------------
                 * UNAUTHORIZED
                 * -------------------------------------------------- */}
                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* --------------------------------------------------
                 * 404
                 * -------------------------------------------------- */}
                <Route path="*" element={<NotFound />} />

              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthGate>
      </AuthProvider>
    </WalletProvider>
  </QueryClientProvider>
)

export default App
