import { useState } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { formatAddress } from '@/lib/web3';
import { 
  Search, 
  FileCheck, 
  Clock, 
  CheckCircle,
  XCircle,
  Shield,
  History,
  ExternalLink,
  Loader2,
  GraduationCap
} from 'lucide-react';
import Navbar from '@/components/Navbar';

const VerifierDashboard = () => {
  const { wallet } = useWallet();
  const [tokenId, setTokenId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<{
    verified: boolean;
    studentName?: string;
    degree?: string;
    university?: string;
    ipfsHash?: string;
  } | null>(null);

  // Demo verification history
  const verificationHistory = [
    {
      id: 1,
      tokenId: 0,
      studentName: 'Jane Smith',
      degree: 'Bachelor of Science in Computer Science',
      university: 'MIT',
      verifiedAt: '2024-06-15 14:32',
      status: 'verified',
    },
    {
      id: 2,
      tokenId: 5,
      studentName: 'Unknown',
      degree: '-',
      university: '-',
      verifiedAt: '2024-06-14 09:15',
      status: 'failed',
    },
    {
      id: 3,
      tokenId: 1,
      studentName: 'John Doe',
      degree: 'Master of Business Administration',
      university: 'Harvard',
      verifiedAt: '2024-06-13 16:45',
      status: 'verified',
    },
  ];

  const stats = [
    { label: 'Total Verifications', value: 124, icon: FileCheck },
    { label: 'Verified', value: 118, icon: CheckCircle },
    { label: 'Failed', value: 6, icon: XCircle },
    { label: 'Today', value: 8, icon: Clock },
  ];

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenId.trim()) return;

    setIsVerifying(true);
    setResult(null);

    // Demo verification
    setTimeout(() => {
      if (tokenId === '0' || tokenId === '1') {
        setResult({
          verified: true,
          studentName: tokenId === '0' ? 'Jane Smith' : 'John Doe',
          degree: tokenId === '0' ? 'Bachelor of Science in Computer Science' : 'Master of Business Administration',
          university: tokenId === '0' ? 'Massachusetts Institute of Technology' : 'Harvard Business School',
          ipfsHash: 'QmXxxxxx...example',
        });
      } else {
        setResult({ verified: false });
      }
      setIsVerifying(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                  Verifier <span className="gradient-text">Dashboard</span>
                </h1>
                <p className="text-muted-foreground">
                  {wallet.address ? formatAddress(wallet.address) : 'Demo Mode'} • Verify academic credentials
                </p>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="glass-card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Verification Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Verify Credential</h2>
                  <p className="text-sm text-muted-foreground">Enter Token ID to verify</p>
                </div>
              </div>

              <form onSubmit={handleVerify} className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={tokenId}
                    onChange={(e) => setTokenId(e.target.value)}
                    placeholder="Enter Token ID (e.g., 0, 1)"
                    className="input-glass pl-12"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                </div>
                <button
                  type="submit"
                  disabled={isVerifying || !tokenId.trim()}
                  className="w-full btn-primary"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      Verify
                    </>
                  )}
                </button>
              </form>

              {/* Result */}
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 pt-6 border-t border-white/10"
                >
                  {result.verified ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-green-400">Verified Authentic</p>
                          <p className="text-sm text-muted-foreground">Credential is valid</p>
                        </div>
                      </div>
                      <div className="space-y-3 pl-13">
                        <div className="flex items-start gap-3">
                          <GraduationCap className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="font-medium">{result.studentName}</p>
                            <p className="text-sm text-muted-foreground">{result.degree}</p>
                            <p className="text-sm text-muted-foreground">{result.university}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                        <XCircle className="w-5 h-5 text-destructive" />
                      </div>
                      <div>
                        <p className="font-semibold text-destructive">Verification Failed</p>
                        <p className="text-sm text-muted-foreground">Certificate not found</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>

            {/* Verification History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <History className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Recent History</h2>
                  <p className="text-sm text-muted-foreground">Your verification attempts</p>
                </div>
              </div>

              <div className="space-y-4">
                {verificationHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      item.status === 'verified' ? 'bg-green-500/20' : 'bg-destructive/20'
                    }`}>
                      {item.status === 'verified' ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-destructive" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">#{item.tokenId}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="font-medium truncate">{item.studentName}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.verifiedAt}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VerifierDashboard;
