"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Trophy, 
  Crown, 
  Star, 
  Target, 
  Calendar,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  User,
  Award,
  TrendingUp
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  wallet_address: string;
  display_name?: string;
  squad_id?: string;
  total_xp?: number;
  created_at: string;
}

interface StudentOfWeek {
  id: string;
  user_id: string;
  reason: string;
  set_by: string;
  created_at: string;
  user: User;
}

interface CommunityManagementProps {
  walletAddress: string;
}

export default function CommunityManagement({ walletAddress }: CommunityManagementProps) {
  const [currentStudent, setCurrentStudent] = useState<StudentOfWeek | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [reason, setReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Fetch current student of the week
  const fetchCurrentStudent = async () => {
    try {
      const response = await fetch('/api/admin/student-of-week');
      if (response.ok) {
        const data = await response.json();
        setCurrentStudent(data.studentOfWeek);
      }
    } catch (error) {
      console.error('Error fetching student of the week:', error);
    }
  };

  // Fetch users for selection
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchCurrentStudent(), fetchUsers()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleSetStudent = async () => {
    if (!selectedUserId || !reason.trim()) {
      toast({
        title: "Error",
        description: "Please select a user and provide a reason",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/admin/student-of-week', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: selectedUserId,
          reason: reason.trim(),
          admin_wallet: walletAddress
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentStudent(data.studentOfWeek);
        setShowForm(false);
        setSelectedUserId('');
        setReason('');
        toast({
          title: "Success",
          description: "Student of the week updated successfully!"
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update student of the week",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error setting student of the week:', error);
      toast({
        title: "Error",
        description: "Failed to update student of the week",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveStudent = async () => {
    if (!confirm('Are you sure you want to remove the current student of the week?')) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/student-of-week?admin_wallet=${walletAddress}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setCurrentStudent(null);
        toast({
          title: "Success",
          description: "Student of the week removed successfully!"
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to remove student of the week",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error removing student of the week:', error);
      toast({
        title: "Error",
        description: "Failed to remove student of the week",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.wallet_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.squad_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSquadColor = (squad?: string) => {
    switch (squad?.toLowerCase()) {
      case 'creators': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'decoders': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'speakers': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'raiders': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'rangers': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
              <span className="ml-2">Loading community data...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Student of the Week */}
      <Card className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border-yellow-500/30">
        <CardHeader>
          <CardTitle className="text-yellow-400 flex items-center">
            <Trophy className="w-5 h-5 mr-2" />
            Student of the Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentStudent ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-yellow-500/20 rounded-full">
                    <Crown className="w-8 h-8 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-yellow-400">
                      {currentStudent.user.display_name || `@${currentStudent.user.wallet_address.slice(0, 8)}`}
                    </h3>
                    <p className="text-gray-300">{currentStudent.reason}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      {currentStudent.user.squad_id && (
                        <Badge className={getSquadColor(currentStudent.user.squad_id)}>
                          {currentStudent.user.squad_id} Squad
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">
                        {currentStudent.user.total_xp?.toLocaleString() || 0} XP
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setShowForm(true)}
                    size="sm"
                    variant="outline"
                    className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Update
                  </Button>
                  <Button
                    onClick={handleRemoveStudent}
                    size="sm"
                    variant="outline"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    disabled={submitting}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No student of the week selected</p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Select Student
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Set Student Form */}
      {showForm && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <User className="w-5 h-5 mr-2" />
              {currentStudent ? 'Update Student of the Week' : 'Select Student of the Week'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="search">Search Users</Label>
              <Input
                id="search"
                placeholder="Search by name, wallet, or squad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-700 border-slate-600"
              />
            </div>

            <div>
              <Label htmlFor="user-select">Select User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="bg-slate-700 border-slate-600">
                  <SelectValue placeholder="Choose a user..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {filteredUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{user.display_name || user.wallet_address.slice(0, 8)}</span>
                        <div className="flex items-center space-x-2 ml-4">
                          {user.squad_id && (
                            <Badge size="sm" className={getSquadColor(user.squad_id)}>
                              {user.squad_id}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-400">
                            {user.total_xp?.toLocaleString() || 0} XP
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Why is this student being recognized? (e.g., Top 3 leaderboard + completed advanced course)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="bg-slate-700 border-slate-600"
                rows={3}
              />
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={handleSetStudent}
                disabled={submitting || !selectedUserId || !reason.trim()}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    {currentStudent ? 'Updating...' : 'Setting...'}
                  </>
                ) : (
                  <>
                    <Trophy className="w-4 h-4 mr-2" />
                    {currentStudent ? 'Update Student' : 'Set Student'}
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  setShowForm(false);
                  setSelectedUserId('');
                  setReason('');
                  setSearchTerm('');
                }}
                variant="outline"
                className="border-slate-600"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Community Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-blue-400">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Active Squads</p>
                <p className="text-2xl font-bold text-green-400">
                  {new Set(users.map(u => u.squad_id).filter(Boolean)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Award className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total XP</p>
                <p className="text-2xl font-bold text-purple-400">
                  {users.reduce((sum, user) => sum + (user.total_xp || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
