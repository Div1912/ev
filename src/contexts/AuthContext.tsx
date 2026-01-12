"use client"

import type React from "react"
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react"
import { supabase } from "@/integrations/supabase/client"
import { useWallet } from "./WalletContext"
import { authenticateWithWallet } from "@/lib/walletAuth"
import type { User, Session } from "@supabase/supabase-js"

export type UserRole = "student" | "issuer" | "verifier" | "admin"

interface Profile {
  id: string
  user_id: string
  wallet_address: string
  role: UserRole
  display_name: string | null
  institution: string | null
  onboarded: boolean
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  roles: UserRole[]
  isLoading: boolean
  isAuthenticating: boolean
  error: string | null
  isOnboarded: boolean
  authenticateWallet: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: (userId?: string) => Promise<void>
  hasRole: (role: UserRole) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { wallet } = useWallet()

  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [roles, setRoles] = useState<UserRole[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* ------------------------------------------------------------------
   * READ-ONLY DB FETCHERS
   * ------------------------------------------------------------------ */

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()

    if (error) {
      console.error("Profile fetch failed:", error)
      return null
    }

    return data as Profile | null
  }

  const fetchRoles = async (userId: string): Promise<UserRole[]> => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)

    if (error) {
      console.error("Roles fetch failed:", error)
      return []
    }

    return (data ?? []).map((r) => r.role as UserRole)
  }

  /* ------------------------------------------------------------------
   * PUBLIC API
   * ------------------------------------------------------------------ */

  const refreshProfile = async (userId?: string) => {
    const uid = userId ?? user?.id
    if (!uid) return

    try {
      const [profileData, rolesData] = await Promise.all([
        fetchProfile(uid),
        fetchRoles(uid),
      ])

      setProfile(profileData)
      setRoles(rolesData)
    } catch (err) {
      console.error("refreshProfile failed:", err)
      setError("Failed to load profile")
    }
  }

  const authenticateWallet = async () => {
    if (!wallet.address) {
      throw new Error("Wallet not connected")
    }

    setIsAuthenticating(true)
    setError(null)

    try {
      await authenticateWithWallet(wallet.address)
      // Supabase auth listener will handle session
    } catch (err) {
      setError("Authentication failed")
      throw err
    } finally {
      setIsAuthenticating(false)
    }
  }

  const signOut = async () => {
    setIsLoading(true)
    await supabase.auth.signOut()

    setUser(null)
    setSession(null)
    setProfile(null)
    setRoles([])

    setIsLoading(false)
  }

  const hasRole = (role: UserRole) => roles.includes(role)

  const isOnboarded = profile?.onboarded === true

  /* ------------------------------------------------------------------
   * AUTH LIFECYCLE (SINGLE SOURCE OF TRUTH)
   * ------------------------------------------------------------------ */

  useEffect(() => {
    let mounted = true

    const initialize = async () => {
      setIsLoading(true)

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!mounted) return

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await refreshProfile(session.user.id)
      } else {
        setProfile(null)
        setRoles([])
      }

      setIsLoading(false)
    }

    initialize()

    const { data } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return

        setIsLoading(true)

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await refreshProfile(session.user.id)
        } else {
          setProfile(null)
          setRoles([])
        }

        setIsLoading(false)
      }
    )

    return () => {
      mounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        isLoading,
        isAuthenticating,
        error,
        isOnboarded,
        authenticateWallet,
        signOut,
        refreshProfile,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return ctx
}
