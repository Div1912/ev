"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { supabase } from "@/integrations/supabase/client"
import { loginWithWallet, signUpWithWallet } from "@/lib/walletAuth"
import type { User, Session } from "@supabase/supabase-js"

export type UserRole = "student" | "issuer" | "verifier" | "admin"

interface Profile {
  id: string
  user_id: string
  wallet_address: string
  display_name: string | null
  institution: string | null
  role: string | null
  onboarded?: boolean
  [key: string]: unknown
}

type ProfileStatus = "idle" | "loading" | "loaded" | "missing" | "error"

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  roles: UserRole[]
  profileStatus: ProfileStatus
  isLoading: boolean
  isAuthenticating: boolean
  error: string | null

  // auth actions
  signUpWallet: (walletAddress: string) => Promise<{ isNewUser: boolean }>
  loginWallet: (walletAddress: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>

  // helpers
  hasRole: (role: UserRole) => boolean
  hasSelectedRole: boolean // 🔥 NEW: True if the user has a record in user_roles
  isOnboarded: boolean     // 🔥 CHANGED: True ONLY if profile.onboarded is true
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [roles, setRoles] = useState<UserRole[]>([])

  const [profileStatus, setProfileStatus] = useState<ProfileStatus>("idle")

  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* ---------------- PROFILE FETCH ---------------- */

  const refreshProfile = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    const activeUser = currentSession?.user || user

    if (!activeUser) {
      setProfile(null)
      setRoles([])
      setProfileStatus("idle")
      return
    }

    setProfileStatus("loading")

    try {
      const userId = activeUser.id

      const [rolesRes, profileRes] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      ])

      if (rolesRes.error) throw rolesRes.error
      if (profileRes.error) throw profileRes.error

      setRoles((rolesRes.data ?? []).map((r) => r.role as UserRole))

      if (!profileRes.data) {
        setProfile(null);
        setProfileStatus("missing");
      } else {
        setProfile(profileRes.data as Profile);
        setProfileStatus("loaded");
      }
    } catch (e) {
      console.error("refreshProfile error:", e);
      setProfileStatus("error");
    }
  }

  /* ---------------- SIGNUP ---------------- */

  const signUpWallet = async (walletAddress: string) => {
    if (!walletAddress) throw new Error("Wallet address missing")

    setError(null)
    setIsAuthenticating(true)

    try {
      const result = await signUpWithWallet(walletAddress)
      
      const { data: { session: syncSession } } = await supabase.auth.getSession()
      
      if (syncSession?.user) {
        setSession(syncSession)
        setUser(syncSession.user)
      }

      return { isNewUser: result.isNewUser }
    } catch (e: any) {
      setError(e?.message || "Sign up failed")
      throw e
    } finally {
      setIsAuthenticating(false)
    }
  }

  /* ---------------- LOGIN ---------------- */

  const loginWallet = async (walletAddress: string) => {
    if (!walletAddress) throw new Error("Wallet address missing")

    setError(null)
    setIsAuthenticating(true)

    try {
      await loginWithWallet(walletAddress)
      
      const { data: { session: syncSession } } = await supabase.auth.getSession()
      
      if (syncSession?.user) {
        setSession(syncSession)
        setUser(syncSession.user)
      }
    } catch (e: any) {
      setError(e?.message || "Login failed")
      throw e
    } finally {
      setIsAuthenticating(false)
    }
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

      if (session?.user) {
        refreshProfile()
      } else {
        setProfileStatus("idle")
      }
    }

    init()

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return

      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)

      if (!session?.user) {
        setProfile(null)
        setRoles([])
        setProfileStatus("idle")
      } else {
        refreshProfile()
      }
    })

    return () => {
      mounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  /* ---------------- HELPERS ---------------- */

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
    setRoles([])
    setProfileStatus("idle")
  }

  const hasRole = (role: UserRole) => roles.includes(role)

  // 🔥 NEW HELPER: For routing logic to check if a user has picked a role yet
  const hasSelectedRole = roles.length > 0

  // 🔥 UPDATED HELPER: For routing logic to check if the user has finished the detail form
  const isOnboarded =
    profileStatus === "loaded" &&
    profile?.onboarded === true

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        profileStatus,
        isLoading,
        isAuthenticating,
        error,
        signUpWallet,
        loginWallet,
        signOut,
        refreshProfile,
        hasRole,
        hasSelectedRole,
        isOnboarded,
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
