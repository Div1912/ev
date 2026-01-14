import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Building2,
  Search,
  ArrowRight,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, type UserRole } from '@/contexts/AuthContext';
import PublicNavbar from '@/components/PublicNavbar';

const SelectRolePage = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roleConfigs = [
    {
      id: 'student' as UserRole,
      icon: GraduationCap,
      title: 'Student',
      description: 'I want to manage and share my academic credentials with employers and institutions.',
      path: '/onboarding/student',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'issuer' as UserRole,
      icon: Building2,
      title: 'Institution',
      description: 'I represent an educational institution and want to issue verifiable credentials.',
      path: '/onboarding/institution',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      id: 'verifier' as UserRole,
      icon: Search,
      title: 'Verifier',
      description: 'I need to verify academic credentials for hiring or background checks.',
      path: '/onboarding/verifier',
      gradient: 'from-green-500 to-emerald-500',
    },
  ];

  const handleRoleClick = async (role: (typeof roleConfigs)[0]) => {
    if (!user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // 1. UPDATE DATABASE: Set the role and initial onboarding status
      const { error: roleErr } = await supabase
        .from('user_roles')
        .upsert([{ user_id: user.id, role: role.id }], { onConflict: 'user_id,role' });

      if (roleErr) throw roleErr;

      const { error: profileErr } = await supabase
        .from('profiles')
        .upsert({ 
          user_id: user.id, 
          role: role.id, 
          onboarded: false 
        });

      if (profileErr) throw profileErr;

      // 2. NAVIGATE FIRST: Move to the next page immediately to "win" the race
      navigate(role.path, { replace: true });

      // 3. REFRESH CONTEXT: Update the global state in the background
      setTimeout(() => {
        refreshProfile();
      }, 0);

    } catch (err) {
      console.error("Error saving role:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />

      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="hero-glow" />

        <div className="w-full max-w-3xl mx-auto">
          <button
            onClick={() => navigate('/auth/sign-in')}
            disabled={isSubmitting}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">
              How will you use <span className="gradient-text">EduVerify</span>?
            </h1>
            <p className="text-lg text-muted-foreground">
              Select your role to get started. This is a one-time setup.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-4">
            {roleConfigs.map((role, index) => (
              <motion.button
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleRoleClick(role)}
                disabled={isSubmitting}
                className={`glass-card p-6 text-left group transition-all duration-300 hover:-translate-y-1 ${
                  isSubmitting ? 'opacity-70 cursor-wait' : 'cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${role.gradient} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    {isSubmitting ? (
                      <Loader2 className="w-7 h-7 text-white animate-spin" />
                    ) : (
                      <role.icon className="w-7 h-7 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-xl font-semibold">{role.title}</h3>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {role.description}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-sm text-muted-foreground mt-8"
          >
            You can request additional roles later from your dashboard.
          </motion.p>
        </div>
      </main>
    </div>
  );
};

export default SelectRolePage;
