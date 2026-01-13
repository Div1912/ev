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
    profileLoaded,
    isOnboarded,
    roles,
    hasRole,
  } = useAuth()

  const location = useLocation()
  const path = location.pathname

  /* --------------------------------------------------
   * HARD STOP: WAIT FOR AUTH BOOTSTRAP
   * -------------------------------------------------- */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  /* --------------------------------------------------
   * AUTH REQUIRED
   * -------------------------------------------------- */
  if (requireAuth && !user) {
    return <Navigate to="/auth/sign-in" replace />
  }

  /* --------------------------------------------------
   * PROFILE NOT READY (ONLY AFTER USER EXISTS)
   * -------------------------------------------------- */
  if (user && !profileLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  /* --------------------------------------------------
   * FORCE ONBOARDING (NEW USERS)
   * -------------------------------------------------- */
  if (user && profileLoaded && !isOnboarded) {
    if (!path.startsWith("/onboarding")) {
      return <Navigate to="/onboarding/select-role" replace />
    }
    return <>{children}</>
  }

  /* --------------------------------------------------
   * BLOCK ONBOARDING AFTER COMPLETION
   * -------------------------------------------------- */
  if (user && isOnboarded && path.startsWith("/onboarding")) {
    // Redirect to the appropriate dashboard based on role
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

  /* --------------------------------------------------
   * ROLE AUTHORIZATION - Redirect to /unauthorized
   * -------------------------------------------------- */
  if (requiredRole && !hasRole(requiredRole)) {
    // If user has no roles, send to onboarding
    if (roles.length === 0) {
      return <Navigate to="/onboarding/select-role" replace />
    }
    // Otherwise, redirect to unauthorized page
    return <Navigate to="/unauthorized" replace />
  }

  /* --------------------------------------------------
   * ACCESS GRANTED
   * -------------------------------------------------- */
  return <>{children}</>
}

export default ProtectedRoute
