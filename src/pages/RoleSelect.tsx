import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Building2, Search, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import BackButton from '@/components/BackButton';

const RoleSelectPage = () => {
  const navigate = useNavigate();
  const { user, roles, profile, isLoading, profileStatus, refreshProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if user already has a profile and role - they shouldn't see this page again
  useEffect(() => {
    if (!isLoading && profileStatus === 'loaded' && user && roles.length > 0) {
      const primaryRole = roles[0];
      const dashboardPaths: Record<UserRole, string> = {
        student: '/student/dashboard',
        issuer: '/issuer/dashboard',
        verifier: '/verify',
        admin: '/admin/dashboard',
      };
      navigate(dashboardPaths[primaryRole], { replace: true });
    }
  }, [user, roles, profileStatus, isLoading, navigate]);

  // If not authenticated, redirect to login
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleRoleClick = async (roleId: UserRole, path: string) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      // 1. Save the role to the user_roles table in DB
      const { error: roleErr } = await supabase
        .from('user_roles')
        .insert([{ user_id: user.id, role: roleId }]);
      
      if (roleErr) throw roleErr;

      // 2. Initialize/Update the profile record in DB
      const { error: profileErr } = await supabase
        .from('profiles')
        .upsert({ 
          user_id: user.id, 
          role: roleId,
          onboarded: false 
        });

      if (profileErr) throw profileErr;

      // 3. Refresh the AuthContext so the app knows the user now has a role
      await refreshProfile();

      // 4. Navigate to the specific onboarding form for that role
      navigate(path);
    } catch (err) {
      console.error("Error saving role:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  // ✅ FIX: Spinner Guard
  // Only show spinner if we are globally loading OR currently fetching profile status
  // OR if we are currently submitting the role to the database
  if (isLoading || (user && profileStatus === 'loading') || isSubmitting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="hero-glow" />
        
        <div className="w-full max-w-3xl mx-auto">
          <BackButton to="/login" label="Back" />
          
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
                onClick={() => handleRoleClick(role.id, role.path)}
                disabled={isSubmitting}
                className={`glass-card p-6 text-left group transition-all duration-300 hover:-translate-y-1 ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${role.gradient} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <role.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-xl font-semibold">{role.title}</h3>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
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

export default RoleSelectPage;
