import { useState } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { formatAddress } from '@/lib/web3';
import { 
  Building2, 
  FileCheck, 
  Users, 
  Clock, 
  Plus,
  Send,
  Search,
  ArrowRight,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import Navbar from '@/components/Navbar';

const IssuerDashboard = () => {
  const { wallet } = useWallet();
  const [isIssuing, setIsIssuing] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    recipientAddress: '',
    studentName: '',
    degree: '',
    university: 'Massachusetts Institute of Technology',
  });

  // Demo issued credentials
  const issuedCredentials = [
    {
      id: 1,
      tokenId: 0,
      studentName: 'Jane Smith',
      degree: 'Bachelor of Science in Computer Science',
      recipient: '0x1234...5678',
      issuedDate: '2024-06-15',
      status: 'verified',
    },
    {
      id: 2,
      tokenId: 1,
      studentName: 'John Doe',
      degree: 'Master of Business Administration',
      recipient: '0x8765...4321',
      issuedDate: '2024-06-10',
      status: 'verified',
    },
    {
      id: 3,
      tokenId: 2,
      studentName: 'Alice Johnson',
      degree: 'Bachelor of Arts in Economics',
      recipient: '0x9999...1111',
      issuedDate: '2024-06-05',
      status: 'pending',
    },
  ];

  const stats = [
    { label: 'Total Issued', value: issuedCredentials.length, icon: FileCheck },
    { label: 'Active Students', value: 156, icon: Users },
    { label: 'Pending', value: 1, icon: Clock },
    { label: 'This Month', value: 12, icon: Building2 },
  ];

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsIssuing(true);
    
    // Simulate blockchain transaction
    setTimeout(() => {
      setIsIssuing(false);
      setShowIssueForm(false);
      setFormData({
        recipientAddress: '',
        studentName: '',
        degree: '',
        university: 'Massachusetts Institute of Technology',
      });
      // Show success toast here
    }, 2000);
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
                  Institution <span className="gradient-text">Dashboard</span>
                </h1>
                <p className="text-muted-foreground">
                  {wallet.address ? formatAddress(wallet.address) : 'Demo Mode'} • Issue and manage credentials
                </p>
              </div>
              <button
                onClick={() => setShowIssueForm(true)}
                className="btn-primary w-full sm:w-auto"
              >
                <Plus className="w-5 h-5" />
                Issue Credential
              </button>
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

          {/* Issue Form Modal */}
          {showIssueForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={(e) => e.target === e.currentTarget && setShowIssueForm(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass-card w-full max-w-lg p-8"
              >
                <h2 className="text-2xl font-bold mb-6">Issue New Credential</h2>
                
                <form onSubmit={handleIssue} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-2">Recipient Wallet Address</label>
                    <input
                      type="text"
                      value={formData.recipientAddress}
                      onChange={(e) => setFormData({ ...formData, recipientAddress: e.target.value })}
                      placeholder="0x..."
                      className="input-glass"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Student Name</label>
                    <input
                      type="text"
                      value={formData.studentName}
                      onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                      placeholder="Full name"
                      className="input-glass"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Degree / Credential</label>
                    <input
                      type="text"
                      value={formData.degree}
                      onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                      placeholder="e.g., Bachelor of Science in Computer Science"
                      className="input-glass"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Institution</label>
                    <input
                      type="text"
                      value={formData.university}
                      onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                      className="input-glass"
                      required
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowIssueForm(false)}
                      className="flex-1 btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isIssuing}
                      className="flex-1 btn-primary"
                    >
                      {isIssuing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Issuing...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Issue Credential
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}

          {/* Recent Issues */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Recently Issued</h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="input-glass pl-10 py-2 w-48"
                  />
                </div>
              </div>
            </div>

            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Token ID</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Student</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Degree</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Recipient</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issuedCredentials.map((credential) => (
                      <tr 
                        key={credential.id} 
                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="p-4 font-mono text-sm">#{credential.tokenId}</td>
                        <td className="p-4 font-medium">{credential.studentName}</td>
                        <td className="p-4 text-sm text-muted-foreground max-w-[200px] truncate">
                          {credential.degree}
                        </td>
                        <td className="p-4 font-mono text-sm">{credential.recipient}</td>
                        <td className="p-4 text-sm text-muted-foreground">{credential.issuedDate}</td>
                        <td className="p-4">
                          {credential.status === 'verified' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
                              <CheckCircle className="w-3 h-3" />
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-medium">
                              <Clock className="w-3 h-3" />
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default IssuerDashboard;
