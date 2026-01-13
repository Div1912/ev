import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import PublicNavbar from '@/components/PublicNavbar';

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      
      <main className="flex-1 flex items-center justify-center pt-20 pb-16 px-4">
        <div className="hero-glow" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="glass-card p-8 md:p-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-destructive/20 mb-6">
              <ShieldX className="w-10 h-10 text-destructive" />
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-bold mb-4">
              Access <span className="text-destructive">Denied</span>
            </h1>
            
            <p className="text-muted-foreground mb-8">
              You don't have permission to access this page. This area is restricted to users with the appropriate role.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link 
                to="/" 
                className="btn-secondary flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go Home
              </Link>
              <button 
                onClick={() => window.history.back()}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Unauthorized;
