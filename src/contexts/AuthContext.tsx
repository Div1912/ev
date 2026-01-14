"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { supabase } from "@/integrations/supabase/client"
import { loginWithWallet, signUpWithWallet } from "@/lib/walletAuth"
import type { User, Session } from "@supabase/supabase-js"

export type UserRole = "student" | "issuer" | "verifier" | "admin"

/**
 * App-facing profile shape.
 */
interface Profile {
  id: string
  user_id: string
  wallet_address: string
  display_name: string | null
  institution: string | null
  role: string | null
  [key: string]: unknown
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  roles: UserRole[]
  isLoading: boolean
  profileLoaded: boolean
  isOnboarded: boolean
  isAuthenticating: boolean
  error: string | null
  // Separate signup and login functions
  signUpWallet: (walletAddress: string) => Promise<{ isNewUser: boolean }>
  loginWallet: (walletAddress: string) => Promise<void>
  // Legacy function for backwards compatibility
  authenticateWallet: (walletAddress: string) => Promise<void>
  refreshProfile: () => Promise<void>
  hasRole: (role: UserRole) => boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [roles, setRoles] = useState<UserRole[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [profileLoaded, setProfileLoaded] = useState(false)

  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* ---------------- PROFILE ---------------- */

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null)
      setRoles([])
      setProfileLoaded(true)
      return
    }

    setProfileLoaded(false)

    try {
      const { data: profileData, error: profileError } = await supabase.auth.getSession()
      if (!profileData.session?.user) {
        throw new Error("No active session")
      }

      const userId = profileData.session.user.id

      const [{ data: userRolesData, error: rolesError }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ])

      if (rolesError) throw rolesError

      const { data: fetchedProfile, error: fetchProfileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle()

      if (fetchProfileError) throw fetchProfileError

      const validProfile = fetchedProfile && fetchedProfile.user_id ? (fetchedProfile as unknown as Profile) : null
      setProfile(validProfile)
      setRoles((userRolesData ?? []).map((r) => r.role as UserRole))
    } catch (e) {
      console.error("refreshProfile failed:", e)
      setProfile(null)
      setRoles([])
    } finally {
      setProfileLoaded(true)
    }
  }

  /* ---------------- SIGNUP (NEW USERS ONLY) ---------------- */

  const signUpWallet = async (walletAddress: string): Promise<{ isNewUser: boolean }> => {
    if (!walletAddress) throw new Error("Wallet address missing")

    setError(null)
    setIsAuthenticating(true)
    try {
      const result = await signUpWithWallet(walletAddress)
      return { isNewUser: result.isNewUser }
    } catch (e: any) {
      const message = e?.message || "Sign up failed"
      setError(message)
      throw e
    } finally {
      setIsAuthenticating(false)
    }
  }

  /* ---------------- LOGIN (EXISTING USERS ONLY) ---------------- */

  const loginWallet = async (walletAddress: string): Promise<void> => {
    if (!walletAddress) throw new Error("Wallet address missing")

    setError(null)
    setIsAuthenticating(true)
    try {
      await loginWithWallet(walletAddress)
    } catch (e: any) {
      const message = e?.message || "Login failed"
      setError(message)
      throw e
    } finally {
      setIsAuthenticating(false)
    }
  }

  /* ---------------- LEGACY AUTH (for backwards compat) ---------------- */

  const authenticateWallet = async (walletAddress: string) => {
    return loginWallet(walletAddress)
  }

  /* ---------------- AUTH BOOTSTRAP ---------------- */

  useEffect(() => {
    let mounted = true

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!mounted) return

      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)

      if (!session?.user) {
        setProfileLoaded(true)
      }
    }

    init()

    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!mounted) return

      setSession(session)
      setUser(session?.user ?? null)

      if (!session?.user) {
        setProfile(null)
        setRoles([])
        setProfileLoaded(true)
      } else {
        setProfileLoaded(false)
      }
    })

    return () => {
      mounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!isLoading && user && !profileLoaded) {
      refreshProfile()
    }
  }, [user, isLoading, profileLoaded])

  /* ---------------- HELPERS ---------------- */

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
    setRoles([])
    setProfileLoaded(true)
  }

  const hasRole = (role: UserRole) => roles.includes(role)

  // User is onboarded if they have at least one valid role (not 'pending')
  const isOnboarded = profileLoaded && roles.length > 0

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        isLoading,
        profileLoaded,
        isOnboarded,
        isAuthenticating,
        error,
        signUpWallet,
        loginWallet,
        authenticateWallet,
        refreshProfile,
        hasRole,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
