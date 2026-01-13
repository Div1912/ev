import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Eye, 
  Share2, 
  Star,
  Award,
  Shield,
  Target
} from 'lucide-react';

interface CredentialStats {
  totalCredentials: number;
  verifiedCredentials: number;
  pendingCredentials: number;
  totalViews: number;
  totalShares: number;
}

interface StudentAnalyticsProps {
  stats: CredentialStats;
}

const StudentAnalytics = ({ stats }: StudentAnalyticsProps) => {
  // Calculate reputation score (0-100)
  const calculateReputationScore = () => {
    let score = 0;
    
    // Base score from verified credentials (max 40 points)
    score += Math.min(stats.verifiedCredentials * 10, 40);
    
    // Bonus for having credentials (max 20 points)
    score += Math.min(stats.totalCredentials * 5, 20);
    
    // Views contribute to reputation (max 20 points)
    score += Math.min(stats.totalViews * 2, 20);
    
    // Shares indicate trust (max 20 points)
    score += Math.min(stats.totalShares * 4, 20);
    
    return Math.min(score, 100);
  };

  const reputationScore = calculateReputationScore();
  
  const getReputationLevel = () => {
    if (reputationScore >= 80) return { label: 'Excellent', color: 'text-green-400', bg: 'bg-green-500/20' };
    if (reputationScore >= 60) return { label: 'Good', color: 'text-blue-400', bg: 'bg-blue-500/20' };
    if (reputationScore >= 40) return { label: 'Building', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    return { label: 'Starter', color: 'text-muted-foreground', bg: 'bg-white/10' };
  };

  const reputation = getReputationLevel();

  const analyticsItems = [
    {
      label: 'Verified Credentials',
      value: stats.verifiedCredentials,
      icon: Shield,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Profile Views',
      value: stats.totalViews,
      icon: Eye,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Credentials Shared',
      value: stats.totalShares,
      icon: Share2,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Your Analytics
        </h3>
      </div>

      {/* Reputation Score */}
      <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            <span className="font-medium">Reputation Score</span>
          </div>
          <span className={`text-sm px-2 py-1 rounded-full ${reputation.bg} ${reputation.color}`}>
            {reputation.label}
          </span>
        </div>
        
        <div className="flex items-end gap-4">
          <div className="text-4xl font-bold gradient-text">{reputationScore}</div>
          <div className="flex-1">
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${reputationScore}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on verified credentials, views, and shares
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        {analyticsItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="text-center p-4 rounded-xl bg-white/[0.02] border border-white/5"
          >
            <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center mx-auto mb-2`}>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <div className="text-2xl font-bold">{item.value}</div>
            <div className="text-xs text-muted-foreground">{item.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Improvement Tips */}
      {reputationScore < 80 && (
        <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Tips to Improve</span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1">
            {stats.verifiedCredentials < 4 && (
              <li>• Get more credentials verified to boost your score</li>
            )}
            {stats.totalShares < 3 && (
              <li>• Share your credentials with employers to increase visibility</li>
            )}
            {stats.totalViews < 5 && (
              <li>• Add your profile link to your resume for more views</li>
            )}
          </ul>
        </div>
      )}
    </motion.div>
  );
};

export default StudentAnalytics;
