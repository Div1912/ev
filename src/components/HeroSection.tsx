import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { ArrowRight, Shield, CheckCircle, Zap } from 'lucide-react';

const HeroSection = () => {
  const navigate = useNavigate();
  const { wallet } = useWallet();
  const { user, profile, roles } = useAuth();

  const handleLaunchApp = () => {
    if (user && profile && roles.length > 0) {
      // Authenticated user with profile - go to their dashboard
      const primaryRole = roles[0];
      const paths: Record<UserRole, string> = {
        student: '/student/dashboard',
        issuer: '/issuer/dashboard',
        verifier: '/verify',
        admin: '/admin/dashboard',
      };
      navigate(paths[primaryRole]);
    } else if (user) {
      // Authenticated but no profile - go to role selection
      navigate('/role-select');
    } else {
      // Not authenticated - go to login
      navigate('/login');
    }
  };

  const stats = [
    { value: '50K+', label: 'Credentials Issued' },
    { value: '200+', label: 'Universities' },
    { value: '99.9%', label: 'Uptime' },
    { value: '< 2s', label: 'Verification Time' },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-12">
      {/* Background effects */}
      <div className="hero-glow" />
      <div className="glow-orb w-96 h-96 -top-48 -right-48 animate-glow-pulse" />
      <div className="glow-orb w-64 h-64 bottom-1/4 -left-32 animate-glow-pulse" style={{ animationDelay: '1s' }} />

      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), 
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 mb-8"
          >
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              Blockchain-Powered Credential Verification
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
          >
            Secure Academic
            <br />
            <span className="gradient-text">Credentials on Chain</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Issue, manage, and verify academic credentials with blockchain technology.
            Tamper-proof, instant verification for universities, students, and employers.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <button onClick={handleLaunchApp} className="btn-primary group w-full sm:w-auto">
              {user && profile ? 'Go to Dashboard' : 'Get Started'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/verify')}
              className="btn-secondary w-full sm:w-auto"
            >
              Verify a Credential
            </button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground mb-16"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>ERC-721 Standard</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>IPFS Storage</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Immutable Records</span>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="glass-card p-8 md:p-10"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                  className="stat-item p-3 sm:p-4 md:p-6"
                >
                  <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold gradient-text break-words">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Floating elements */}
      <motion.div
        className="absolute top-1/3 right-[10%] hidden lg:block"
        animate={{ y: [-10, 10, -10] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold">Instant Verification</div>
            <div className="text-xs text-muted-foreground">Under 2 seconds</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-1/3 left-[8%] hidden lg:block"
        animate={{ y: [10, -10, 10] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold">Verified</div>
            <div className="text-xs text-muted-foreground">MIT - Computer Science</div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
