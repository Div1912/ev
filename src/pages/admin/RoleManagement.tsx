import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Shield,
  Building2,
  GraduationCap,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  UserPlus,
  Search
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import BackButton from '@/components/BackButton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface RoleRequest {
  id: string;
  user_id: string;
  wallet_address: string;
  requested_role: string;
  status: string;
  institution: string | null;
  reason: string | null;
  created_at: string;
  reviewed_at: string | null;
}

interface UserWithRoles {
  id: string;
  wallet_address: string;
  display_name: string | null;
  roles: string[];
  created_at: string;
}

const RoleManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'requests' | 'users'>('requests');
  const [roleRequests, setRoleRequests] = useState<RoleRequest[]>([]);
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'requests') {
        const { data, error } = await supabase
          .from('role_requests')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setRoleRequests(data || []);
      } else {
        // Fetch profiles with their roles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, user_id, wallet_address, display_name, created_at')
          .order('created_at', { ascending: false });
        
        if (profilesError) throw profilesError;

        // Fetch all user roles
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role');
        
        if (rolesError) throw rolesError;

        // Combine profiles with roles
        const usersWithRoles: UserWithRoles[] = (profiles || []).map(profile => ({
          id: profile.user_id || profile.id,
          wallet_address: profile.wallet_address,
          display_name: profile.display_name,
          roles: (roles || [])
            .filter(r => r.user_id === profile.user_id)
            .map(r => r.role),
          created_at: profile.created_at,
        }));

        setUsers(usersWithRoles);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveRequest = async (request: RoleRequest) => {
    setProcessingId(request.id);
    try {
      // Add the role to user_roles
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: request.user_id,
          role: request.requested_role as any,
        });

      if (roleError && !roleError.message.includes('duplicate')) throw roleError;

      // Update request status
      const { error: updateError } = await supabase
        .from('role_requests')
        .update({
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      toast.success(`Role request approved for ${request.requested_role}`);
      fetchData();
    } catch (error) {
      console.error('Failed to approve request:', error);
      toast.error('Failed to approve request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (request: RoleRequest) => {
    setProcessingId(request.id);
    try {
      const { error } = await supabase
        .from('role_requests')
        .update({
          status: 'rejected',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (error) throw error;

      toast.success('Role request rejected');
      fetchData();
    } catch (error) {
      console.error('Failed to reject request:', error);
      toast.error('Failed to reject request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) return;
    
    setProcessingId(selectedUser.id);
    try {
      // Cast to the expected enum type
      const roleToAssign = selectedRole as 'student' | 'issuer' | 'verifier' | 'admin';
      
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUser.id,
          role: roleToAssign,
        });

      if (error) {
        if (error.message.includes('duplicate')) {
          toast.error('User already has this role');
        } else {
          throw error;
        }
      } else {
        toast.success(`${selectedRole} role assigned successfully`);
        setShowAssignModal(false);
        setSelectedUser(null);
        setSelectedRole('');
        fetchData();
      }
    } catch (error) {
      console.error('Failed to assign role:', error);
      toast.error('Failed to assign role');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemoveRole = async (userId: string, role: string) => {
    setProcessingId(userId);
    try {
      const roleToRemove = role as 'student' | 'issuer' | 'verifier' | 'admin';
      
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', roleToRemove);

      if (error) throw error;

      toast.success(`${role} role removed`);
      fetchData();
    } catch (error) {
      console.error('Failed to remove role:', error);
      toast.error('Failed to remove role');
    } finally {
      setProcessingId(null);
    }
  };

  const roleIcons = {
    student: GraduationCap,
    issuer: Building2,
    verifier: Eye,
    admin: Shield,
  };

  const roleColors = {
    student: 'text-blue-400 bg-blue-500/10',
    issuer: 'text-purple-400 bg-purple-500/10',
    verifier: 'text-green-400 bg-green-500/10',
    admin: 'text-orange-400 bg-orange-500/10',
  };

  const statusColors = {
    pending: 'text-yellow-400 bg-yellow-500/10',
    approved: 'text-green-400 bg-green-500/10',
    rejected: 'text-red-400 bg-red-500/10',
  };

  const filteredRequests = roleRequests.filter(r => 
    r.wallet_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.requested_role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    u.wallet_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <BackButton to="/admin/dashboard" label="Back to Dashboard" />

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Role <span className="gradient-text">Management</span>
            </h1>
            <p className="text-muted-foreground">
              Manage user roles and approve role requests
            </p>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-2 mb-6"
          >
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'requests'
                  ? 'bg-primary text-white'
                  : 'bg-white/[0.02] border border-white/10 hover:border-white/20'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              Pending Requests
              {roleRequests.filter(r => r.status === 'pending').length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">
                  {roleRequests.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'users'
                  ? 'bg-primary text-white'
                  : 'bg-white/[0.02] border border-white/10 hover:border-white/20'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              All Users
            </button>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6"
          >
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by wallet or name..."
                className="input-glass pl-12 w-full"
              />
            </div>
          </motion.div>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : activeTab === 'requests' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card overflow-hidden"
            >
              {filteredRequests.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No role requests found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Wallet</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Requested Role</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Institution</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Reason</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.map((request) => {
                        const RoleIcon = roleIcons[request.requested_role as keyof typeof roleIcons] || Shield;
                        const roleColor = roleColors[request.requested_role as keyof typeof roleColors] || roleColors.student;
                        const statusColor = statusColors[request.status as keyof typeof statusColors];
                        
                        return (
                          <tr 
                            key={request.id}
                            className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="p-4 font-mono text-sm">
                              {request.wallet_address.slice(0, 6)}...{request.wallet_address.slice(-4)}
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium capitalize ${roleColor}`}>
                                <RoleIcon className="w-3 h-3" />
                                {request.requested_role}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-muted-foreground">
                              {request.institution || '-'}
                            </td>
                            <td className="p-4 text-sm text-muted-foreground max-w-[200px] truncate">
                              {request.reason || '-'}
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColor}`}>
                                {request.status === 'pending' && <Clock className="w-3 h-3" />}
                                {request.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                                {request.status === 'rejected' && <XCircle className="w-3 h-3" />}
                                {request.status}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-muted-foreground">
                              {new Date(request.created_at).toLocaleDateString()}
                            </td>
                            <td className="p-4">
                              {request.status === 'pending' && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleApproveRequest(request)}
                                    disabled={processingId === request.id}
                                    className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                                  >
                                    {processingId === request.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <CheckCircle className="w-4 h-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleRejectRequest(request)}
                                    disabled={processingId === request.id}
                                    className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card overflow-hidden"
            >
              {filteredUsers.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No users found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Wallet</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Roles</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Joined</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((userItem) => (
                        <tr 
                          key={userItem.id}
                          className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="p-4">
                            <span className="font-medium">{userItem.display_name || 'Unknown'}</span>
                          </td>
                          <td className="p-4 font-mono text-sm">
                            {userItem.wallet_address.slice(0, 6)}...{userItem.wallet_address.slice(-4)}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {userItem.roles.length === 0 ? (
                                <span className="text-sm text-muted-foreground">No roles</span>
                              ) : (
                                userItem.roles.map(role => {
                                  const RoleIcon = roleIcons[role as keyof typeof roleIcons] || Shield;
                                  const roleColor = roleColors[role as keyof typeof roleColors] || roleColors.student;
                                  return (
                                    <span 
                                      key={role}
                                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium capitalize ${roleColor} cursor-pointer hover:opacity-80`}
                                      onClick={() => handleRemoveRole(userItem.id, role)}
                                      title="Click to remove"
                                    >
                                      <RoleIcon className="w-3 h-3" />
                                      {role}
                                      <XCircle className="w-3 h-3 ml-1" />
                                    </span>
                                  );
                                })
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {new Date(userItem.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => {
                                setSelectedUser(userItem);
                                setShowAssignModal(true);
                              }}
                              className="btn-secondary p-2 text-sm"
                            >
                              <UserPlus className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {/* Assign Role Modal */}
          {showAssignModal && selectedUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={(e) => e.target === e.currentTarget && setShowAssignModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass-card w-full max-w-md p-8"
              >
                <h2 className="text-xl font-bold mb-4">Assign Role</h2>
                <p className="text-muted-foreground mb-6">
                  Assign a role to {selectedUser.display_name || selectedUser.wallet_address.slice(0, 10)}...
                </p>
                
                <div className="space-y-3 mb-6">
                  {(['student', 'issuer', 'verifier', 'admin'] as const).map(role => {
                    const RoleIcon = roleIcons[role];
                    const roleColor = roleColors[role];
                    const hasRole = selectedUser.roles.includes(role);
                    
                    return (
                      <button
                        key={role}
                        onClick={() => setSelectedRole(role)}
                        disabled={hasRole}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                          selectedRole === role
                            ? 'border-primary bg-primary/10'
                            : hasRole
                            ? 'border-white/5 bg-white/[0.02] opacity-50 cursor-not-allowed'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${roleColor}`}>
                          <RoleIcon className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium capitalize">{role}</div>
                          <div className="text-xs text-muted-foreground">
                            {hasRole ? 'Already assigned' : `Grant ${role} access`}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignRole}
                    disabled={!selectedRole || processingId === selectedUser.id}
                    className="flex-1 btn-primary"
                  >
                    {processingId === selectedUser.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Assign Role'
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default RoleManagement;