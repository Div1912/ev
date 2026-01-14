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
   * We only show the spinner if the app is initializing OR 
   * a user exists but we are actively fetching their profile.
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
   * Redirect unauthenticated users back to the sign-in page.
   */
  if (requireAuth && !user) {
    return <Navigate to="/auth/sign-in" state={{ from: location }} replace />
  }

  /**
   * 3. ROLE SELECTION ENFORCEMENT
   * If the user is logged in but has NOT picked a role yet (new account),
   * they MUST be on the role selection page.
   */
  if (user && !hasSelectedRole) {
    if (!path.startsWith("/onboarding/select-role")) {
      return <Navigate to="/onboarding/select-role" replace />
    }
    return <>{children}</>
  }

  /**
   * 4. ONBOARDING COMPLETION ENFORCEMENT
   * If the user has picked a role but hasn't finished the detail form (isOnboarded is false),
   * they are allowed to be on onboarding sub-pages (e.g., /onboarding/student).
   */
  if (user && !isOnboarded) {
    if (!path.startsWith("/onboarding")) {
      // Safety: Send them back to their chosen role's onboarding sub-page
      const primaryRole = roles[0];
      return <Navigate to={`/onboarding/${primaryRole}`} replace />
    }
    return <>{children}</>
  }

  /**
   * 5. BLOCK ONBOARDING AFTER COMPLETION
   * Stop fully onboarded users from accessing setup pages.
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
   * ✅ FIX: Only enforce role checks AFTER onboarding is complete.
   * This prevents race conditions where the 'roles' array might be 
   * empty during the final transition to the dashboard.
   */
  if (requiredRole && isOnboarded && !hasRole(requiredRole)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
