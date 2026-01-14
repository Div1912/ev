import { Navigate, useLocation } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useAuth, UserRole } from "@/contexts/AuthContext"

interface Props {
  children: React.ReactNode
  requiredRole?: UserRole
  requireAuth?: boolean
}

const ProtectedRoute = ({
  children,
  requiredRole,
  requireAuth = true,
}: Props) => {
  const {
    user,
    isLoading,
    profileStatus,
    isOnboarded,
    hasSelectedRole,
    roles,
    hasRole,
  } = useAuth()

  const location = useLocation()
  const path = location.pathname

  /**
   * 1. HARD STOP: AUTH BOOTSTRAP
   * Show spinner during initial auth check or active profile fetching.
   */
  if (isLoading || (user && profileStatus === 'loading')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  /**
   * 2. AUTH ENFORCEMENT
   * Send unauthenticated users to the sign-in page.
   */
  if (requireAuth && !user) {
    return <Navigate to="/auth/sign-in" state={{ from: location }} replace />
  }

  /**
   * 3. ROLE SELECTION ENFORCEMENT
   * Force new users who haven't picked a role to the selection page.
   */
  if (user && !hasSelectedRole) {
    // Exact path check to prevent redirect loops
    if (path !== "/onboarding/select-role") {
      return <Navigate to="/onboarding/select-role" replace />
    }
    return <>{children}</>
  }

  /**
   * 4. ONBOARDING COMPLETION ENFORCEMENT
   * Allow users to stay on their specific onboarding form if not fully onboarded.
   */
  if (user && hasSelectedRole && !isOnboarded) {
    const expectedOnboardingPath = `/onboarding/${roles[0]}`
    
    // Allow the specific onboarding page OR the select-role page during transition
    if (path === expectedOnboardingPath || path === "/onboarding/select-role") {
      return <>{children}</>
    }
    
    // Safety redirect to their specific form
    return <Navigate to={expectedOnboardingPath} replace />
  }

  /**
   * 5. BLOCK ONBOARDING AFTER COMPLETION
   * Fully onboarded users are redirected away from setup pages to their dashboard.
   */
  if (user && isOnboarded && path.startsWith("/onboarding")) {
    const roleDashboards: Record<string, string> = {
      student: '/dashboard/student',
      issuer: '/dashboard/institution',
      verifier: '/dashboard/verifier',
      admin: '/dashboard/admin',
    }
    const primaryRole = roles[0]
    const targetDashboard = roleDashboards[primaryRole] || '/dashboard/student'
    return <Navigate to={targetDashboard} replace />
  }

  /**
   * 6. ROLE AUTHORIZATION (SAFE)
   * Role checks are only enforced AFTER onboarding is complete to avoid race conditions.
   */
  if (requiredRole && isOnboarded && !hasRole(requiredRole)) {
    return <Navigate to="/unauthorized" replace />
  }

  /**
   * 7. ACCESS GRANTED
   */
  return <>{children}</>
}

export default ProtectedRoute
