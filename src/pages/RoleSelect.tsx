import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Building2, Search, Shield, ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import BackButton from '@/components/BackButton';

const RoleSelectPage = () => {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'student',
      icon: GraduationCap,
      title: 'Student',
      description: 'View and manage your academic credentials. Share them with employers and institutions.',
      path: '/student/dashboard',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'issuer',
      icon: Building2,
      title: 'Institution',
      description: 'Issue and manage academic credentials for your students. Track all issued certificates.',
      path: '/issuer/dashboard',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      id: 'verifier',
      icon: Search,
      title: 'Verifier',
      description: 'Verify academic credentials instantly. Perfect for employers and background checks.',
      path: '/verifier/dashboard',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      id: 'admin',
      icon: Shield,
      title: 'Admin',
      description: 'Platform administration. Manage institutions, users, and system settings.',
      path: '/admin/dashboard',
      gradient: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16 px-4">
        {/* Background effects */}
        <div className="hero-glow" />
        
        <div className="w-full max-w-4xl mx-auto">
          <BackButton to="/login" label="Back to Login" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">
              Select Your <span className="gradient-text">Role</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Choose how you want to use EduVerify
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {roles.map((role, index) => (
              <motion.button
                key={role.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(role.path)}
                className="glass-card p-6 text-left group hover:-translate-y-2 transition-all duration-500 cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${role.gradient} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <role.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
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
            transition={{ delay: 0.5 }}
            className="text-center text-sm text-muted-foreground mt-8"
          >
            In production, roles are assigned during registration and verified on-chain.
          </motion.p>
        </div>
      </main>
    </div>
  );
};

export default RoleSelectPage;
