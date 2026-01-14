"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { Building2, Loader2, ArrowRight, AlertCircle } from "lucide-react"

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
 * - Register issuer on blockchain (CRITICAL)
 * - Store registration info
 */
const InstitutionOnboarding = () => {
  const navigate = useNavigate()
  const { user, refreshProfile, roles } = useAuth()
  const { wallet } = useWallet()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [blockchainError, setBlockchainError] = useState<string | null>(null)

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
    setBlockchainError(null)

    try {
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
         0️⃣ CREATE INSTITUTION FIRST TO GET THE ID
         We need the institution ID before registering on blockchain.
      ========================= */
      const { data: institutionData, error: institutionCreateError } = await supabase
        .from("institutions")
        .insert({
          user_id: user.id,
          wallet_address: walletAddress.toLowerCase(),
          name: formData.institutionName,
          type: formData.institutionType,
          display_name: formData.displayName,
          configured: false,
          verified: false,
        })
        .select("id")
        .single()

      if (institutionCreateError || !institutionData) {
        throw new Error(`Failed to create institution: ${institutionCreateError?.message}`)
      }

      const institutionId = institutionData.id

      console.log("[v0] Institution created with ID:", institutionId)

      /* =========================
         1️⃣ REGISTER ON BLOCKCHAIN WITH INSTITUTION ID
         This MUST succeed before marking institution as configured.
      ========================= */
      console.log("[v0] Starting blockchain registration for:", {
        walletAddress: walletAddress.toLowerCase(),
        institutionId,
      })

      let registrationResult
      try {
        registrationResult = await registerIssuerOnBlockchain(walletAddress.toLowerCase(), institutionId)
        console.log("[v0] Blockchain registration successful:", registrationResult)
      } catch (blockchainErr: any) {
        console.error("[v0] Blockchain registration failed:", blockchainErr)
        setBlockchainError(blockchainErr.message)

        await supabase.from("institutions").delete().eq("id", institutionId)

        throw new Error(
          `Failed to register on blockchain: ${blockchainErr.message}. Your institution cannot mint credentials without blockchain registration.`,
        )
      }

      if (!registrationResult.success && !registrationResult.already_registered) {
        const errorMsg = registrationResult.error || "Unknown blockchain error"
        setBlockchainError(errorMsg)

        await supabase.from("institutions").delete().eq("id", institutionId)

        throw new Error(`Blockchain registration failed: ${errorMsg}`)
      }

      toast.success(
        registrationResult.already_registered
          ? "Institution already authorized on blockchain"
          : "Institution registered on blockchain successfully!",
      )

      /* =========================
         2️⃣ Update institution as configured
      ========================= */
      const { error: configError } = await supabase
        .from("institutions")
        .update({ configured: true })
        .eq("id", institutionId)

      if (configError) {
        throw new Error(configError.message)
      }

      /* =========================
         3️⃣ Assign issuer role
      ========================= */
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert({ user_id: user.id, role: "issuer" }, { onConflict: "user_id,role" })

      if (roleError) {
        throw new Error(roleError.message)
      }

      /* =========================
         4️⃣ STORE BLOCKCHAIN REGISTRATION INFO
      ========================= */
      const { error: regError } = await supabase.from("issuer_registrations").upsert(
        {
          user_id: user.id,
          wallet_address: walletAddress.toLowerCase(),
          institution_name: formData.institutionName,
          transaction_hash: registrationResult.transaction_hash || null,
          block_number: registrationResult.block_number || null,
          registered_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      )

      if (regError) {
        console.error("Warning: Failed to store registration info:", regError)
        // Don't fail the whole process if this fails
      }

      console.log("[v0] Institution onboarding completed successfully for ID:", institutionId)

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

            {blockchainError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30 mb-6"
              >
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Blockchain Registration Failed</p>
                  <p className="text-sm text-muted-foreground mt-1">{blockchainError}</p>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Institution Name <span className="text-destructive">*</span>
                </label>
                <input
                  className="input-glass"
                  value={formData.institutionName}
                  onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                  placeholder="e.g., Oxford University"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This will be registered on blockchain as your institution ID
                </p>
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
                    Registering Institution on Blockchain...
                  </>
                ) : (
                  <>
                    Complete Registration
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <p className="text-xs text-center text-muted-foreground">
                Your institution will be registered on the blockchain to enable certificate minting
              </p>
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

export default InstitutionOnboarding
