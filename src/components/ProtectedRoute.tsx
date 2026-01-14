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
    // Exact path check to prevent unnecessary redirects during transitions
    if (path !== "/onboarding/select-role") {
      return <Navigate to="/onboarding/select-role" replace />
    }
    return <>{children}</>
  }

  /**
   * 4. ONBOARDING COMPLETION ENFORCEMENT
   * User has picked a role but hasn't finished details (isOnboarded is false).
   * ✅ FIX: Explicitly allow staying on the select-role page OR the role-specific form.
   * This allows the "Navigate-First" pattern to complete before the context refresh.
   */
  if (user && hasSelectedRole && !isOnboarded) {
    // If the roles array is still empty due to race condition, allow them to stay on the page
    if (roles.length === 0) {
      return <>{children}</>
    }

    const expectedOnboardingPath = `/onboarding/${roles[0]}`
    
    // Allow the specific onboarding page OR the transition from the selection page
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
   * Role checks only enforced AFTER onboarding is complete to avoid race conditions.
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
