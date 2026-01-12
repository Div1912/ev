"use client"

import { Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}

export default AuthGate
