import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Eye, 
  Shield,
  Loader2,
  X,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from 'sonner';

interface RoleRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const RoleRequestModal = ({ isOpen, onClose, onSuccess }: RoleRequestModalProps) => {
  const { user } = useAuth();
  const { wallet } = useWallet();
  const [selectedRole, setSelectedRole] = useState<'issuer' | 'verifier' | null>(null);
  const [institution, setInstitution] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const roles = [
    {
      id: 'issuer' as const,
      label: 'Issuer',
      description: 'Issue academic credentials as an institution',
      icon: Building2,
      color: 'text-purple-400 bg-purple-500/10',
    },
    {
      id: 'verifier' as const,
      label: 'Verifier',
      description: 'Verify credentials as an employer or organization',
      icon: Eye,
      color: 'text-green-400 bg-green-500/10',
    },
  ];

  const handleSubmit = async () => {
    if (!selectedRole || !user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('role_requests')
        .insert({
          user_id: user.id,
          wallet_address: wallet.address || user.user_metadata?.wallet_address || '',
          requested_role: selectedRole,
          institution: institution || null,
          reason: reason || null,
          status: 'pending',
        });

      if (error) {
        if (error.message.includes('duplicate')) {
          toast.error('You already have a pending request for this role');
        } else {
          throw error;
        }
      } else {
        setSubmitted(true);
        toast.success('Role request submitted successfully!');
        onSuccess?.();
      }
    } catch (error) {
      console.error('Failed to submit role request:', error);
      toast.error('Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card w-full max-w-md p-8 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">Request Submitted!</h2>
          <p className="text-muted-foreground mb-6">
            Your role request has been submitted for admin review. You'll be notified once it's approved.
          </p>
          <button onClick={onClose} className="btn-primary w-full">
            Got it
          </button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card w-full max-w-md p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Request a Role</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-muted-foreground mb-6">
          Select a role to request. An admin will review and approve your request.
        </p>

        {/* Role Selection */}
        <div className="space-y-3 mb-6">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                selectedRole === role.id
                  ? 'border-primary bg-primary/10'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${role.color}`}>
                <role.icon className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="font-medium">{role.label}</div>
                <div className="text-sm text-muted-foreground">{role.description}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Institution (for issuer) */}
        {selectedRole === 'issuer' && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Institution Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g., Massachusetts Institute of Technology"
              className="input-glass"
            />
          </div>
        )}

        {/* Reason */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Reason (optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Tell us why you need this role..."
            className="input-glass min-h-[100px] resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedRole || isSubmitting || (selectedRole === 'issuer' && !institution)}
            className="flex-1 btn-primary"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Request'
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RoleRequestModal;