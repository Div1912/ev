import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { Wallet, ArrowRight, Shield, AlertCircle, GraduationCap } from 'lucide-react';
import Navbar from '@/components/Navbar';

const LoginPage = () => {
  const navigate = useNavigate();
  const { wallet, connect, isConnecting, error, isMetaMaskAvailable } = useWallet();
  const [showMetaMaskWarning, setShowMetaMaskWarning] = useState(false);

  const handleConnect = async () => {
    if (!isMetaMaskAvailable) {
      setShowMetaMaskWarning(true);
      return;
    }
    
    await connect();
    if (wallet.isConnected) {
      navigate('/role-select');
    }
  };

  // If already connected, redirect
  if (wallet.isConnected) {
    navigate('/role-select');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center pt-20 pb-16 px-4">
        {/* Background effects */}
        <div className="hero-glow" />
        <div className="glow-orb w-96 h-96 -top-48 -right-48 opacity-30" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="glass-card p-8 md:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary mb-6">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Welcome to <span className="gradient-text">EduVerify</span>
              </h1>
              <p className="text-muted-foreground">
                Connect your wallet to access the platform
              </p>
            </div>

            {/* MetaMask Warning */}
            {showMetaMaskWarning && !isMetaMaskAvailable && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 mb-6"
              >
                <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-500">MetaMask Required</p>
                  <p className="text-sm text-muted-foreground">
                    Please install{' '}
                    <a 
                      href="https://metamask.io" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      MetaMask
                    </a>
                    {' '}to continue.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30 mb-6"
              >
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </motion.div>
            )}

            {/* Connect Button */}
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full btn-primary mb-6"
            >
              {isConnecting ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="w-5 h-5" />
                  Connect with MetaMask
                </>
              )}
            </button>

            {/* Alternative options */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-4 text-sm text-muted-foreground">or continue with</span>
              </div>
            </div>

            {/* Demo Mode */}
            <button
              onClick={() => navigate('/role-select')}
              className="w-full btn-secondary mb-6"
            >
              <Shield className="w-5 h-5" />
              Demo Mode
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <span>Your credentials stay secure on the blockchain</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-primary" />
                </div>
                <span>No personal data stored on our servers</span>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default LoginPage;
