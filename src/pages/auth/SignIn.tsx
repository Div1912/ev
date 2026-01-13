import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Wallet, Shield, AlertCircle, GraduationCap, Loader2, ArrowLeft, LogIn } from 'lucide-react';
import PublicNavbar from '@/components/PublicNavbar';

/**
 * SIGN IN PAGE - For EXISTING USERS ONLY
 * 
 * Flow:
 * 1. Connect wallet
 * 2. Sign message
 * 3. Login (fails if wallet doesn't exist)
 * 4. Redirect to appropriate dashboard based on role
 * 
 * NEVER shows role selection - that's only for signup
 */
const SignInPage = () => {
  const navigate = useNavigate();
  const { wallet, connect, disconnect, isConnecting, error: walletError, isMetaMaskAvailable } = useWallet();
  const { user, profile, roles, isAuthenticating, loginWallet, error: authError, isLoading, profileLoaded } = useAuth();
  const [showMetaMaskWarning, setShowMetaMaskWarning] = useState(false);
  const [authStep, setAuthStep] = useState<'initial' | 'connected' | 'signing' | 'complete'>('initial');

  // Handle redirect for authenticated users
  useEffect(() => {
    if (!isLoading && !profileLoaded) return;
    
    if (user) {
      // If user has roles, go to dashboard
      if (roles.length > 0) {
        const primaryRole = roles[0];
        const dashboardPaths: Record<UserRole, string> = {
          student: '/dashboard/student',
          issuer: '/dashboard/institution',
          verifier: '/dashboard/verifier',
          admin: '/dashboard/admin',
        };
        navigate(dashboardPaths[primaryRole], { replace: true });
      } else if (!profile?.onboarded) {
        // User exists but not onboarded - redirect to complete onboarding
        navigate('/onboarding/select-role', { replace: true });
      }
    }
  }, [user, profile, roles, isLoading, profileLoaded, navigate]);

  // Update auth step when wallet connects
  useEffect(() => {
    if (wallet.isConnected && authStep === 'initial') {
      setAuthStep('connected');
    }
  }, [wallet.isConnected, authStep]);

  const handleConnect = async () => {
    if (!isMetaMaskAvailable) {
      setShowMetaMaskWarning(true);
      return;
    }
    
    try {
      await connect();
    } catch (err) {
      console.error('Connection failed:', err);
    }
  };

  const handleLogin = async () => {
    if (!wallet.address) return;
    
    setAuthStep('signing');
    try {
      await loginWallet(wallet.address);
      setAuthStep('complete');
      // Redirect will be handled by useEffect
    } catch (err) {
      setAuthStep('connected');
      console.error('Login failed:', err);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setAuthStep('initial');
  };

  const error = walletError || authError;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      
      <main className="flex-1 flex flex-col pt-20 pb-16 px-4">
        <div className="container mx-auto max-w-md">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>
        <div className="hero-glow" />
        <div className="flex-1 flex items-center justify-center">
          <div className="glow-orb w-96 h-96 -top-48 -right-48 opacity-30" />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <div className="glass-card p-8 md:p-10">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary mb-6">
                  <LogIn className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                  Welcome <span className="gradient-text">Back</span>
                </h1>
                <p className="text-muted-foreground">
                  {authStep === 'connected' 
                    ? 'Sign the message to verify wallet ownership'
                    : 'Connect your wallet to sign in'
                  }
                </p>
              </div>

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

              {authStep === 'connected' || authStep === 'signing' ? (
                <>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/30 mb-6">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Wallet Connected</p>
                      <p className="text-xs text-muted-foreground truncate">{wallet.address}</p>
                    </div>
                    <button 
                      onClick={handleDisconnect}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Disconnect
                    </button>
                  </div>

                  <button
                    onClick={handleLogin}
                    disabled={isAuthenticating}
                    className="w-full btn-primary mb-6"
                  >
                    {isAuthenticating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {authStep === 'signing' ? 'Sign the message in MetaMask...' : 'Signing in...'}
                      </>
                    ) : (
                      <>
                        <Shield className="w-5 h-5" />
                        Sign In
                      </>
                    )}
                  </button>

                  <p className="text-xs text-center text-muted-foreground mb-6">
                    You'll be asked to sign a message to prove wallet ownership. This is free and doesn't cost any gas.
                  </p>
                </>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="w-full btn-primary mb-6"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-5 h-5" />
                      Connect Wallet
                    </>
                  )}
                </button>
              )}

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-primary" />
                  </div>
                  <span>Cryptographic signature verifies wallet ownership</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-primary" />
                  </div>
                  <span>No passwords needed - your wallet is your identity</span>
                </div>
              </div>

              <div className="text-center pt-4 border-t border-white/10">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <Link to="/auth/sign-up" className="text-primary hover:underline font-medium">
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default SignInPage;
