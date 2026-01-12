import { Navigate, useLocation } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { useAuth, type UserRole } from "@/contexts/AuthContext"

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
  const { user, isLoading, isOnboarded, roles, hasRole } = useAuth()
  const location = useLocation()
  const path = location.pathname

  // 1️⃣ Loading gate
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  // 2️⃣ Auth gate
  if (requireAuth && !user) {
    return <Navigate to="/auth/sign-in" replace />
  }

  // 3️⃣ Force onboarding
  if (user && !isOnboarded) {
    if (!path.startsWith("/onboarding")) {
      return <Navigate to="/onboarding/select-role" replace />
    }
    return <>{children}</>
  }

  // 4️⃣ Block onboarding after completion
  if (user && isOnboarded && path.startsWith("/onboarding")) {
    return <Navigate to={`/dashboard/${roles[0]}`} replace />
  }

  // 5️⃣ Role guard
  if (requiredRole && user && !hasRole(requiredRole)) {
    return <Navigate to={`/dashboard/${roles[0]}`} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
