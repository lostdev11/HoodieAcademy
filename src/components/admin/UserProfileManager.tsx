'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Wallet, 
  Edit, 
  Save, 
  X, 
  Shield, 
  Award, 
  Activity,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { userDataSync, UserProfile } from '@/lib/user-data-sync';
import { supabase } from '@/lib/supabase';

interface UserProfileManagerProps {
  className?: string;
}

interface UserWithDetails extends UserProfile {
  total_xp?: number;
  level?: number;
  connection_count?: number;
  last_connection?: string;
  profile_completion?: number;
}

export default function UserProfileManager({ className = '' }: UserProfileManagerProps) {
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithDetails[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);
  const [editingUser, setEditingUser] = useState<UserWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [squadFilter, setSquadFilter] = useState<string>('all');
  const [adminFilter, setAdminFilter] = useState<string>('all');

  // Form state for editing
  const [editForm, setEditForm] = useState({
    display_name: '',
    squad: '',
    bio: '',
    username: '',
    is_admin: false
  });

  // Fetch users with enhanced data
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get all users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('last_active', { ascending: false });

      if (usersError) throw usersError;

      // Get user XP data
      const { data: xpData, error: xpError } = await supabase
        .from('user_xp')
        .select('*');

      if (xpError) throw xpError;

      // Get wallet connection counts
      const { data: connections, error: connError } = await supabase
        .from('wallet_connections')
        .select('wallet_address, connection_timestamp')
        .order('connection_timestamp', { ascending: false });

      if (connError) throw connError;

      // Process data
      const usersWithDetails: UserWithDetails[] = users.map((user: any) => {
        const userXP = xpData?.find(xp => xp.wallet_address === user.wallet_address);
        const userConnections = connections?.filter(conn => conn.wallet_address === user.wallet_address) || [];
        
        return {
          ...user,
          total_xp: userXP?.total_xp || 0,
          level: userXP?.level || 1,
          connection_count: userConnections.length,
          last_connection: userConnections[0]?.connection_timestamp || null,
          profile_completion: calculateProfileCompletion(user)
        };
      });

      setUsers(usersWithDetails);
      setFilteredUsers(usersWithDetails);

    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate profile completion percentage
  const calculateProfileCompletion = (user: UserProfile): number => {
    let completed = 0;
    const total = 4;

    if (user.display_name && user.display_name !== `User ${user.wallet_address.slice(0, 6)}...`) completed++;
    if (user.squad) completed++;
    if (user.bio) completed++;
    if (user.profile_picture) completed++;

    return Math.round((completed / total) * 100);
  };

  // Filter and search users
  useEffect(() => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.wallet_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.squad && user.squad.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Squad filter
    if (squadFilter !== 'all') {
      filtered = filtered.filter(user => user.squad === squadFilter);
    }

    // Admin filter
    if (adminFilter !== 'all') {
      const isAdmin = adminFilter === 'admin';
      filtered = filtered.filter(user => user.is_admin === isAdmin);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, squadFilter, adminFilter]);

  // Start editing user
  const startEditing = (user: UserWithDetails) => {
    setEditingUser(user);
    setEditForm({
      display_name: user.display_name || '',
      squad: user.squad || '',
      bio: user.bio || '',
      username: user.username || '',
      is_admin: user.is_admin || false
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingUser(null);
    setEditForm({
      display_name: '',
      squad: '',
      bio: '',
      username: '',
      is_admin: false
    });
  };

  // Save user changes
  const saveUser = async () => {
    if (!editingUser) return;

    try {
      setSaving(true);
      
      await userDataSync.updateUserProfile(editingUser.wallet_address, editForm);
      
      // Refresh users list
      await fetchUsers();
      
      setEditingUser(null);
      setEditForm({
        display_name: '',
        squad: '',
        bio: '',
        username: '',
        is_admin: false
      });

    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setSaving(false);
    }
  };

  // Get unique squads for filter
  const uniqueSquads = Array.from(new Set(users.map(u => u.squad).filter(Boolean)));

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card className="bg-slate-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Loading user profiles...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className="bg-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <User className="w-5 h-5" />
              User Profile Management
            </span>
            <Button
              onClick={fetchUsers}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-400">
            Manage user profiles, update information, and modify admin status. All changes are tied to wallet addresses.
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="bg-slate-800/50">
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users by name, wallet, squad, or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <select
              value={squadFilter}
              onChange={(e) => setSquadFilter(e.target.value)}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Squads</option>
              {uniqueSquads.map(squad => (
                <option key={squad} value={squad}>{squad}</option>
              ))}
            </select>

            <select
              value={adminFilter}
              onChange={(e) => setAdminFilter(e.target.value)}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Users</option>
              <option value="admin">Admins Only</option>
              <option value="user">Regular Users</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredUsers.map((user) => (
          <Card key={user.wallet_address} className="bg-slate-800/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {user.display_name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {user.display_name || `User ${user.wallet_address.slice(0, 6)}...`}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {user.username && `@${user.username}`}
                      {user.squad && ` • ${user.squad}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {user.is_admin && (
                    <Badge variant="outline" className="text-blue-400 border-blue-400">
                      <Shield className="w-3 h-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                  <Button
                    onClick={() => startEditing(user)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Wallet Address */}
                <div>
                  <Label className="text-sm text-slate-400">Wallet Address</Label>
                  <code className="block text-xs bg-slate-700 px-2 py-1 rounded text-slate-300 mt-1">
                    {user.wallet_address}
                  </code>
                </div>

                {/* Bio */}
                {user.bio && (
                  <div>
                    <Label className="text-sm text-slate-400">Bio</Label>
                    <p className="text-sm text-slate-300 mt-1">{user.bio}</p>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-slate-700 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-500">{user.total_xp || 0}</p>
                    <p className="text-xs text-slate-400">Total XP</p>
                  </div>
                  <div className="text-center p-3 bg-slate-700 rounded-lg">
                    <p className="text-2xl font-bold text-blue-500">Lv.{user.level || 1}</p>
                    <p className="text-xs text-slate-400">Level</p>
                  </div>
                </div>

                {/* Profile Completion */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm text-slate-400">Profile Completion</Label>
                    <span className="text-sm text-slate-400">{user.profile_completion || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${user.profile_completion || 0}%` }}
                    />
                  </div>
                </div>

                {/* Last Active */}
                <div className="text-xs text-slate-400">
                  Last active: {user.last_active ? new Date(user.last_active).toLocaleDateString() : 'Never'}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <Card className="bg-slate-800/50">
          <CardContent className="p-8 text-center">
            <User className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400">No users found matching your criteria.</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Edit User Profile</span>
                <Button
                  onClick={cancelEditing}
                  variant="outline"
                  size="sm"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Wallet Address (Read-only) */}
                <div>
                  <Label className="text-sm text-slate-400">Wallet Address</Label>
                  <code className="block text-xs bg-slate-700 px-2 py-1 rounded text-slate-300 mt-1">
                    {editingUser.wallet_address}
                  </code>
                </div>

                {/* Display Name */}
                <div>
                  <Label htmlFor="display_name" className="text-sm text-slate-400">Display Name</Label>
                  <Input
                    id="display_name"
                    value={editForm.display_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, display_name: e.target.value }))}
                    className="mt-1"
                    placeholder="Enter display name"
                  />
                </div>

                {/* Username */}
                <div>
                  <Label htmlFor="username" className="text-sm text-slate-400">Username</Label>
                  <Input
                    id="username"
                    value={editForm.username}
                    onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                    className="mt-1"
                    placeholder="Enter username (without @)"
                  />
                </div>

                {/* Squad */}
                <div>
                  <Label htmlFor="squad" className="text-sm text-slate-400">Squad</Label>
                  <select
                    id="squad"
                    value={editForm.squad}
                    onChange={(e) => setEditForm(prev => ({ ...prev, squad: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No Squad</option>
                    {uniqueSquads.map(squad => (
                      <option key={squad} value={squad}>{squad}</option>
                    ))}
                  </select>
                </div>

                {/* Bio */}
                <div>
                  <Label htmlFor="bio" className="text-sm text-slate-400">Bio</Label>
                  <Textarea
                    id="bio"
                    value={editForm.bio}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    className="mt-1"
                    placeholder="Enter bio"
                    rows={3}
                  />
                </div>

                {/* Admin Status */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_admin"
                    checked={editForm.is_admin}
                    onChange={(e) => setEditForm(prev => ({ ...prev, is_admin: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                  />
                  <Label htmlFor="is_admin" className="text-sm text-slate-400">
                    Admin Status
                  </Label>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    onClick={cancelEditing}
                    variant="outline"
                    disabled={saving}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={saveUser}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {saving ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
