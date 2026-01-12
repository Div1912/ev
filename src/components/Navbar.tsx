import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { formatAddress, formatBalance } from '@/lib/web3';
import { Menu, X, Wallet, ChevronDown, LogOut, User, GraduationCap } from 'lucide-react';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
  const { wallet, isConnecting, connect, disconnect, isMetaMaskAvailable } = useWallet();
  const { user, profile, roles, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { label: 'Features', href: '/#features' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Verify', href: '/verify' },
  ];

  const handleNavClick = (href: string) => {
    if (href.startsWith('/#')) {
      const sectionId = href.replace('/#', '');
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setIsWalletDropdownOpen(false);
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const getDashboardPath = (): string => {
    if (!roles.length) return '/role-select';
    const primaryRole = roles[0];
    const paths: Record<UserRole, string> = {
      student: '/student/dashboard',
      issuer: '/issuer/dashboard',
      verifier: '/verify',
      admin: '/admin/dashboard',
    };
    return paths[primaryRole];
  };

  const handleLaunchApp = () => {
    if (user && profile) {
      navigate(getDashboardPath());
    } else {
      navigate('/login');
    }
  };

  return (
    <nav className="navbar-glass">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-primary">
              <GraduationCap className="w-5 h-5 text-white" />
              <div className="absolute inset-0 rounded-xl bg-gradient-primary opacity-50 blur-lg group-hover:opacity-80 transition-opacity" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Edu<span className="gradient-text">Verify</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              link.href.startsWith('/#') ? (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link.href)}
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  {link.label}
                </button>
              ) : (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`text-muted-foreground hover:text-foreground transition-colors font-medium ${
                    location.pathname === link.href ? 'text-foreground' : ''
                  }`}
                >
                  {link.label}
                </Link>
              )
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            {user && wallet.isConnected ? (
              <div className="relative">
                <button
                  onClick={() => setIsWalletDropdownOpen(!isWalletDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
                >
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-sm font-medium">
                    {profile?.display_name || formatAddress(wallet.address!)}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                <AnimatePresence>
                  {isWalletDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-64 glass-card p-4 z-50"
                    >
                      <div className="space-y-3">
                        <div className="text-sm text-muted-foreground">Signed in as</div>
                        <div className="font-medium">{profile?.display_name || 'User'}</div>
                        <div className="font-mono text-xs text-muted-foreground break-all">{wallet.address}</div>
                        {wallet.balance && (
                          <div className="text-sm text-muted-foreground">
                            Balance: {formatBalance(wallet.balance)} ETH
                          </div>
                        )}
                        <div className="pt-2 border-t border-white/10 space-y-2">
                          <button
                            onClick={() => {
                              navigate(getDashboardPath());
                              setIsWalletDropdownOpen(false);
                            }}
                            className="w-full btn-secondary text-sm py-2"
                          >
                            <User className="w-4 h-4" />
                            Dashboard
                          </button>
                          <button
                            onClick={handleSignOut}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-destructive/50 text-destructive hover:bg-destructive/10 transition-colors text-sm"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <button onClick={handleLaunchApp} className="btn-secondary">
                  {user ? 'Dashboard' : 'Sign In'}
                </button>
                {!wallet.isConnected && (
                  <button
                    onClick={connect}
                    disabled={isConnecting || !isMetaMaskAvailable}
                    className="btn-primary"
                  >
                    {isConnecting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Connecting...
                      </span>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4" />
                        Connect Wallet
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/10"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              {navLinks.map((link) => (
                link.href.startsWith('/#') ? (
                  <button
                    key={link.label}
                    onClick={() => handleNavClick(link.href)}
                    className="block w-full text-left py-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </button>
                ) : (
                  <Link
                    key={link.label}
                    to={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block py-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                )
              ))}
              <div className="pt-4 border-t border-white/10 space-y-3">
                {user && wallet.isConnected ? (
                  <>
                    <div className="flex items-center gap-2 py-2">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-sm font-medium">
                        {profile?.display_name || formatAddress(wallet.address!)}
                      </span>
                    </div>
                    <button 
                      onClick={() => {
                        navigate(getDashboardPath());
                        setIsMobileMenuOpen(false);
                      }} 
                      className="w-full btn-secondary"
                    >
                      Dashboard
                    </button>
                    <button onClick={handleSignOut} className="w-full btn-secondary text-destructive border-destructive/50">
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={handleLaunchApp} className="w-full btn-secondary">
                      Sign In
                    </button>
                    {!wallet.isConnected && (
                      <button
                        onClick={connect}
                        disabled={isConnecting || !isMetaMaskAvailable}
                        className="w-full btn-primary"
                      >
                        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
