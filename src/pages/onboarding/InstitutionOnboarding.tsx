"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Building2, Loader2, ArrowRight } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { useWallet } from "@/contexts/WalletContext"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

import PublicNavbar from "@/components/PublicNavbar"
import BackButton from "@/components/BackButton"
import { registerIssuerOnBlockchain } from "@/lib/registerIssuer"

/**
 * INSTITUTION ONBOARDING
 *
 * Responsibilities:
 * - Assign issuer role
 * - Update profile
 * - CREATE institution record
 * - Register issuer on blockchain
 */
const InstitutionOnboarding = () => {
  const navigate = useNavigate()
  const { user, refreshProfile, roles } = useAuth()
  const { wallet } = useWallet()

  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    institutionName: "",
    institutionType: "",
    displayName: "",
  })

  const institutionTypes = ["University", "College", "School", "Training Institute", "Certification Body", "Other"]

  // Redirect if already onboarded as issuer
  useEffect(() => {
    if (roles.includes("issuer")) {
      navigate("/dashboard/institution", { replace: true })
    }
  }, [roles, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    if (!user) {
      toast.error("Please sign in first")
      navigate("/auth/sign-up")
      return
    }

    const walletAddress = wallet.address || user.user_metadata?.wallet_address

    if (!walletAddress) {
      toast.error("Wallet address not found. Please reconnect your wallet.")
      return
    }

    setIsSubmitting(true)

    try {
      /* =========================
         0️⃣ REGISTER ON BLOCKCHAIN (NON-NEGOTIABLE)
         Must succeed so issuer can mint.
      ========================= */
      const institutionId = formData.institutionName.trim()
      const result = await registerIssuerOnBlockchain(walletAddress.toLowerCase(), institutionId)

      if (result.already_registered) {
        toast.success("Institution already authorized on blockchain")
      } else {
        toast.success("Institution authorized on blockchain")
      }

      /* =========================
         1️⃣ Update profile
      ========================= */
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          role: "issuer",
          display_name: formData.displayName,
          institution: formData.institutionName,
          onboarded: true,
        })
        .eq("user_id", user.id)

      if (profileError) {
        throw new Error(profileError.message)
      }

      /* =========================
         2️⃣ Assign issuer role
      ========================= */
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert({ user_id: user.id, role: "issuer" }, { onConflict: "user_id,role" })

      if (roleError) {
        throw new Error(roleError.message)
      }

      /* =========================
         3️⃣ CREATE INSTITUTION
      ========================= */
      const { error: institutionError } = await supabase.from("institutions").upsert(
        {
          user_id: user.id,
          wallet_address: walletAddress.toLowerCase(),
          name: formData.institutionName,
          type: formData.institutionType,
          display_name: formData.displayName,
          configured: true,
          verified: false,
        },
        { onConflict: "user_id" },
      )

      if (institutionError) {
        throw new Error(institutionError.message)
      }

      await refreshProfile()

      navigate("/dashboard/institution", { replace: true })
    } catch (err: any) {
      console.error("Institution onboarding error:", err)
      toast.error(err.message || "Failed to complete registration")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />

      <main className="flex-1 flex items-center justify-center pt-20 pb-16 px-4">
        <div className="hero-glow" />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <BackButton to="/onboarding/select-role" label="Back" />

          <div className="glass-card p-8 md:p-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-6">
                <Building2 className="w-8 h-8 text-white" />
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Register Your <span className="gradient-text">Institution</span>
              </h1>
              <p className="text-muted-foreground">Set up your institution to start issuing credentials</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Institution Name <span className="text-destructive">*</span>
                </label>
                <input
                  className="input-glass"
                  value={formData.institutionName}
                  onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Institution Type <span className="text-destructive">*</span>
                </label>
                <select
                  className="input-glass"
                  value={formData.institutionType}
                  onChange={(e) => setFormData({ ...formData, institutionType: e.target.value })}
                  required
                >
                  <option value="">Select institution type</option>
                  {institutionTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Your Name <span className="text-destructive">*</span>
                </label>
                <input
                  className="input-glass"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  required
                />
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full btn-primary">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Registering Institution...
                  </>
                ) : (
                  <>
                    Complete Registration
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

export default InstitutionOnboarding
