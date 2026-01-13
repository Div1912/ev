import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Loader2, ArrowRight } from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import { useWallet } from '@/contexts/WalletContext'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

import PublicNavbar from '@/components/PublicNavbar'
import BackButton from '@/components/BackButton'

/**
 * STUDENT ONBOARDING
 *
 * Rules:
 * - User must be authenticated
 * - User must not have a role yet (role = 'pending' or no user_roles entry)
 * - Sets role to 'student' in both profiles and user_roles
 */
const StudentOnboarding = () => {
  const navigate = useNavigate()
  const { user, refreshProfile, roles } = useAuth()
  const { wallet } = useWallet()

  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    displayName: '',
    educationLevel: '',
  })

  const educationLevels = [
    'High School',
    'Undergraduate',
    'Graduate',
    'Doctorate',
    'Professional Certificate',
    'Other',
  ]

  // Redirect if already has a valid role (not pending)
  useEffect(() => {
    if (roles.includes('student')) {
      navigate('/dashboard/student', { replace: true })
    }
  }, [roles, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) return

    if (!user) {
      toast.error('Please sign in first')
      navigate('/auth/sign-up')
      return
    }

    const walletAddress = wallet.address || user.user_metadata?.wallet_address

    if (!walletAddress) {
      toast.error('Wallet address not found. Please reconnect your wallet.')
      return
    }

    setIsSubmitting(true)

    try {
      // Step 1: Update profile with role (using existing schema columns only)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: 'student',
          display_name: formData.displayName,
        })
        .eq('user_id', user.id)

      if (profileError) {
        console.error('Profile update error:', profileError)
        throw new Error(`Failed to save profile: ${profileError.message}`)
      }

      // Step 2: Assign role in user_roles table (the authoritative source for roles)
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert(
          { user_id: user.id, role: 'student' },
          { onConflict: 'user_id,role' }
        )

      if (roleError) {
        console.error('Role assignment error:', roleError)
        throw new Error(`Failed to assign role: ${roleError.message}`)
      }

      await refreshProfile()
      toast.success('Welcome to EduVerify!')
      navigate('/dashboard/student', { replace: true })
    } catch (err: any) {
      console.error('Onboarding error:', err)
      toast.error(err.message || 'Failed to complete onboarding. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />

      <main className="flex-1 flex items-center justify-center pt-20 pb-16 px-4">
        <div className="hero-glow" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <BackButton to="/onboarding/select-role" label="Back" />

          <div className="glass-card p-8 md:p-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-6">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Complete Your <span className="gradient-text">Profile</span>
              </h1>
              <p className="text-muted-foreground">
                Tell us a bit about yourself to get started
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  className="input-glass"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Education Level <span className="text-destructive">*</span>
                </label>
                <select
                  value={formData.educationLevel}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      educationLevel: e.target.value,
                    })
                  }
                  className="input-glass"
                  required
                >
                  <option value="">Select your education level</option>
                  {educationLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  !formData.displayName ||
                  !formData.educationLevel
                }
                className="w-full btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving Profile...
                  </>
                ) : (
                  <>
                    Complete Setup
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

export default StudentOnboarding
