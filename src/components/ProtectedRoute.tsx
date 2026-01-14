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
   * 3. ONBOARDING ENFORCEMENT
   * If the profile is 'missing' (new user) or onboarding is incomplete,
   * they MUST be on an onboarding route.
   */
  if (user && (profileStatus === 'missing' || !isOnboarded)) {
    if (!path.startsWith("/onboarding")) {
      return <Navigate to="/onboarding/select-role" replace />
    }
    return <>{children}</>
  }

  /**
   * 4. BLOCK ONBOARDING AFTER COMPLETION
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
   * 5. ROLE AUTHORIZATION
   */
  if (requiredRole && !hasRole(requiredRole)) {
    if (roles.length === 0) {
      return <Navigate to="/onboarding/select-role" replace />
    }
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
