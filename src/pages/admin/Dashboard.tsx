import { motion } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { formatAddress } from '@/lib/web3';
import { 
  Shield, 
  Users, 
  Building2, 
  FileCheck, 
  AlertTriangle,
  Settings,
  Activity,
  TrendingUp,
  Lock,
  Unlock
} from 'lucide-react';
import Navbar from '@/components/Navbar';

const AdminDashboard = () => {
  const { wallet } = useWallet();

  const stats = [
    { label: 'Total Users', value: '2,456', icon: Users, change: '+12%' },
    { label: 'Institutions', value: '48', icon: Building2, change: '+3' },
    { label: 'Credentials Issued', value: '12,847', icon: FileCheck, change: '+234' },
    { label: 'Active Verifiers', value: '189', icon: Shield, change: '+15' },
  ];

  const recentActivity = [
    { type: 'institution', action: 'New institution registered', name: 'Stanford University', time: '2 hours ago' },
    { type: 'credential', action: 'Credential issued', name: 'Jane Smith - MIT', time: '3 hours ago' },
    { type: 'alert', action: 'Verification failed multiple times', name: 'Token #999', time: '5 hours ago' },
    { type: 'institution', action: 'Institution verified', name: 'Harvard University', time: '1 day ago' },
  ];

  const systemStatus = [
    { name: 'Smart Contract', status: 'active', uptime: '99.99%' },
    { name: 'IPFS Gateway', status: 'active', uptime: '99.95%' },
    { name: 'API Server', status: 'active', uptime: '99.99%' },
    { name: 'Database', status: 'active', uptime: '100%' },
  ];

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
                  Admin <span className="gradient-text">Dashboard</span>
                </h1>
                <p className="text-muted-foreground">
                  {wallet.address ? formatAddress(wallet.address) : 'Demo Mode'} • Platform Administration
                </p>
              </div>
              <div className="flex gap-3">
                <button className="btn-secondary">
                  <Settings className="w-5 h-5" />
                  Settings
                </button>
                <button className="btn-primary">
                  <Shield className="w-5 h-5" />
                  Security
                </button>
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
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                    {stat.change}
                  </span>
                </div>
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 glass-card p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">Recent Activity</h2>
              </div>

              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activity.type === 'alert' ? 'bg-yellow-500/20' : 
                      activity.type === 'institution' ? 'bg-purple-500/20' : 'bg-blue-500/20'
                    }`}>
                      {activity.type === 'alert' ? (
                        <AlertTriangle className="w-5 h-5 text-yellow-400" />
                      ) : activity.type === 'institution' ? (
                        <Building2 className="w-5 h-5 text-purple-400" />
                      ) : (
                        <FileCheck className="w-5 h-5 text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.name}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* System Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <h2 className="text-xl font-semibold">System Status</h2>
              </div>

              <div className="space-y-4">
                {systemStatus.map((system) => (
                  <div
                    key={system.name}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="font-medium">{system.name}</span>
                    </div>
                    <span className="text-sm text-green-400">{system.uptime}</span>
                  </div>
                ))}
              </div>

              {/* Contract Controls */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Contract Controls</h3>
                <div className="space-y-3">
                  <button className="w-full btn-secondary justify-between">
                    <span className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Emergency Stop
                    </span>
                    <span className="text-xs text-muted-foreground">Pauses all operations</span>
                  </button>
                  <button className="w-full btn-secondary justify-between" disabled>
                    <span className="flex items-center gap-2">
                      <Unlock className="w-4 h-4" />
                      Resume Contract
                    </span>
                    <span className="text-xs text-muted-foreground">Currently active</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
