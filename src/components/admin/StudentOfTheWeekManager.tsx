'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Trophy, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  User, 
  Award,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  Settings
} from 'lucide-react';
import { supabase } from '@/utils/supabase/client';

interface StudentOfTheWeek {
  id: string;
  wallet_address: string;
  display_name: string;
  username?: string;
  squad?: string;
  achievement: string;
  avatar_url?: string;
  badge: string;
  week_start_date: string;
  week_end_date: string;
  is_active: boolean;
  created_at: string;
}

interface StudentOfTheWeekManagerProps {
  walletAddress: string;
}

export default function StudentOfTheWeekManager({ walletAddress }: StudentOfTheWeekManagerProps) {
  const [students, setStudents] = useState<StudentOfTheWeek[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentOfTheWeek | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [featureEnabled, setFeatureEnabled] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    wallet_address: '',
    display_name: '',
    username: '',
    squad: '',
    achievement: '',
    avatar_url: '/images/hoodie-academy-pixel-art-logo.png',
    badge: '🏅',
    week_start_date: '',
    week_end_date: ''
  });


  const squads = ['Speakers', 'Raiders', 'Decoders', 'Creators', 'Rangers'];
  const badges = ['🏅', '⚔️', '🎯', '🎨', '🔍', '🌟', '💎', '🔥'];

  useEffect(() => {
    fetchStudents();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('student_of_the_week_settings')
        .select('*')
        .eq('setting_key', 'feature_enabled');

      if (error) throw error;
      
      if (data && data.length > 0) {
        setFeatureEnabled(data[0].setting_value === 'true');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const toggleFeature = async () => {
    try {
      setSettingsLoading(true);
      setError(null);
      
      const newValue = !featureEnabled;
      
      console.log('🔄 Toggling feature:', { 
        walletAddress, 
        newValue, 
        currentValue: featureEnabled 
      });
      
      // First, let's check if the table exists and we can read from it
      const { data: testData, error: testError } = await supabase
        .from('student_of_the_week_settings')
        .select('*')
        .limit(1);
        
      if (testError) {
        console.error('❌ Table access test failed:', testError);
        throw new Error(`Table access failed: ${testError.message}`);
      }
      
      console.log('✅ Table access test passed:', testData);
      
      // Try to update the setting
      let data, error;
      
      // First try upsert
      const upsertResult = await supabase
        .from('student_of_the_week_settings')
        .upsert({
          setting_key: 'feature_enabled',
          setting_value: newValue.toString(),
          description: 'Enable/disable Student of the Week feature',
          updated_by_wallet: walletAddress
        }, {
          onConflict: 'setting_key'
        });
        
      if (upsertResult.error) {
        console.log('⚠️ Upsert failed, trying update:', upsertResult.error);
        
        // If upsert fails, try update first, then insert
        const updateResult = await supabase
          .from('student_of_the_week_settings')
          .update({
            setting_value: newValue.toString(),
            description: 'Enable/disable Student of the Week feature',
            updated_by_wallet: walletAddress
          })
          .eq('setting_key', 'feature_enabled');
          
        if (updateResult.error || !updateResult.data || updateResult.data.length === 0) {
          console.log('⚠️ Update failed, trying insert:', updateResult.error);
          
          // If update fails, try insert
          const insertResult = await supabase
            .from('student_of_the_week_settings')
            .insert({
              setting_key: 'feature_enabled',
              setting_value: newValue.toString(),
              description: 'Enable/disable Student of the Week feature',
              updated_by_wallet: walletAddress
            });
            
          if (insertResult.error) {
            console.error('❌ All methods failed:', insertResult.error);
            throw insertResult.error;
          }
          
          data = insertResult.data;
        } else {
          data = updateResult.data;
        }
      } else {
        data = upsertResult.data;
      }
      
      console.log('✅ Setting update successful:', data);
      
      setFeatureEnabled(newValue);
      setSuccess(`Student of the Week feature ${newValue ? 'enabled' : 'disabled'} successfully!`);
    } catch (err: any) {
      console.error('❌ Toggle feature error:', err);
      setError(`Failed to update feature setting: ${err.message || 'Unknown error'}`);
    } finally {
      setSettingsLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('student_of_the_week')
        .select('*')
        .order('week_start_date', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      setError('Failed to fetch students of the week');
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setIsEditing(false);
    setEditingStudent(null);
    setFormData({
      wallet_address: '',
      display_name: '',
      username: '',
      squad: '',
      achievement: '',
      avatar_url: '/images/hoodie-academy-pixel-art-logo.png',
      badge: '🏅',
      week_start_date: '',
      week_end_date: ''
    });
  };

  const handleEdit = (student: StudentOfTheWeek) => {
    setIsEditing(true);
    setIsCreating(false);
    setEditingStudent(student);
    setFormData({
      wallet_address: student.wallet_address,
      display_name: student.display_name,
      username: student.username || '',
      squad: student.squad || '',
      achievement: student.achievement,
      avatar_url: student.avatar_url || '/images/hoodie-academy-pixel-art-logo.png',
      badge: student.badge,
      week_start_date: student.week_start_date,
      week_end_date: student.week_end_date
    });
  };

  const handleSave = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (!formData.wallet_address || !formData.display_name || !formData.achievement) {
        setError('Please fill in all required fields');
        return;
      }

      if (!formData.week_start_date || !formData.week_end_date) {
        setError('Please select both start and end dates');
        return;
      }

      const studentData = {
        wallet_address: formData.wallet_address,
        display_name: formData.display_name,
        username: formData.username || null,
        squad: formData.squad || null,
        achievement: formData.achievement,
        avatar_url: formData.avatar_url,
        badge: formData.badge,
        week_start_date: formData.week_start_date,
        week_end_date: formData.week_end_date,
        created_by_wallet: walletAddress
      };

      if (isCreating) {
        const { error } = await supabase
          .from('student_of_the_week')
          .insert([studentData]);

        if (error) throw error;
        setSuccess('Student of the Week created successfully!');
      } else if (editingStudent) {
        const { error } = await supabase
          .from('student_of_the_week')
          .update(studentData)
          .eq('id', editingStudent.id);

        if (error) throw error;
        setSuccess('Student of the Week updated successfully!');
      }

      await fetchStudents();
      setIsCreating(false);
      setIsEditing(false);
      setEditingStudent(null);
    } catch (err) {
      setError('Failed to save student of the week');
      console.error('Error saving student:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Student of the Week entry?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('student_of_the_week')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSuccess('Student of the Week deleted successfully!');
      await fetchStudents();
    } catch (err) {
      setError('Failed to delete student of the week');
      console.error('Error deleting student:', err);
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setIsEditing(false);
    setEditingStudent(null);
    setFormData({
      wallet_address: '',
      display_name: '',
      username: '',
      squad: '',
      achievement: '',
      avatar_url: '/images/hoodie-academy-pixel-art-logo.png',
      badge: '🏅',
      week_start_date: '',
      week_end_date: ''
    });
  };

  const getCurrentStudent = () => {
    const today = new Date().toISOString().split('T')[0];
    return students.find(student => 
      student.is_active && 
      student.week_start_date <= today && 
      student.week_end_date >= today
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading students of the week...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Student of the Week Management
          </h2>
          <p className="text-gray-400 mt-1">Manage weekly student recognition</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Feature Toggle */}
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">Feature:</span>
            <Button
              onClick={toggleFeature}
              disabled={settingsLoading}
              variant="ghost"
              size="sm"
              className="p-1 h-auto"
            >
              {featureEnabled ? (
                <ToggleRight className="w-6 h-6 text-green-400" />
              ) : (
                <ToggleLeft className="w-6 h-6 text-gray-400" />
              )}
            </Button>
            <span className={`text-sm ${featureEnabled ? 'text-green-400' : 'text-gray-400'}`}>
              {featureEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          
          <Button 
            onClick={handleCreate}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
            disabled={!featureEnabled}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="border-red-500/50 bg-red-500/10">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-400">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle className="h-4 w-4 text-green-400" />
          <AlertDescription className="text-green-400">{success}</AlertDescription>
        </Alert>
      )}

      {/* Feature Status Alert */}
      {!featureEnabled && (
        <Alert className="border-orange-500/50 bg-orange-500/10">
          <AlertCircle className="h-4 w-4 text-orange-400" />
          <AlertDescription className="text-orange-400">
            Student of the Week feature is currently disabled. The home page will show "Not currently selected" until you enable it.
          </AlertDescription>
        </Alert>
      )}

      {/* Current Student of the Week */}
      {getCurrentStudent() && (
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardHeader>
            <CardTitle className="text-yellow-400 flex items-center gap-2">
              <Award className="w-5 h-5" />
              Current Student of the Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="text-4xl">{getCurrentStudent()?.badge}</div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">
                  {getCurrentStudent()?.display_name}
                </h3>
                <p className="text-gray-300 mb-2">
                  {getCurrentStudent()?.achievement}
                </p>
                <div className="flex items-center gap-2">
                  {getCurrentStudent()?.squad && (
                    <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">
                      {getCurrentStudent()?.squad} Squad
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-gray-400">
                    <Calendar className="w-3 h-3 mr-1" />
                    {getCurrentStudent()?.week_start_date} - {getCurrentStudent()?.week_end_date}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Form */}
      {(isCreating || isEditing) && (
        <Card className="bg-slate-800/50 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-cyan-400">
              {isCreating ? 'Create New Student of the Week' : 'Edit Student of the Week'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="wallet_address" className="text-white">Wallet Address *</Label>
                <Input
                  id="wallet_address"
                  value={formData.wallet_address}
                  onChange={(e) => setFormData({ ...formData, wallet_address: e.target.value })}
                  placeholder="Enter wallet address"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="display_name" className="text-white">Display Name *</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="e.g., @ChainWitch"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="username" className="text-white">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g., ChainWitch"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="squad" className="text-white">Squad</Label>
                <Select value={formData.squad} onValueChange={(value) => setFormData({ ...formData, squad: value })}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select squad" />
                  </SelectTrigger>
                  <SelectContent>
                    {squads.map((squad) => (
                      <SelectItem key={squad} value={squad}>{squad}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="badge" className="text-white">Badge</Label>
                <Select value={formData.badge} onValueChange={(value) => setFormData({ ...formData, badge: value })}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Select badge" />
                  </SelectTrigger>
                  <SelectContent>
                    {badges.map((badge) => (
                      <SelectItem key={badge} value={badge}>{badge}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="avatar_url" className="text-white">Avatar URL</Label>
                <Input
                  id="avatar_url"
                  value={formData.avatar_url}
                  onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                  placeholder="Avatar image URL"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="achievement" className="text-white">Achievement *</Label>
              <Textarea
                id="achievement"
                value={formData.achievement}
                onChange={(e) => setFormData({ ...formData, achievement: e.target.value })}
                placeholder="Describe the student's achievement..."
                className="bg-slate-700 border-slate-600 text-white"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="week_start_date" className="text-white">Week Start Date *</Label>
                <Input
                  id="week_start_date"
                  type="date"
                  value={formData.week_start_date}
                  onChange={(e) => setFormData({ ...formData, week_start_date: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="week_end_date" className="text-white">Week End Date *</Label>
                <Input
                  id="week_end_date"
                  type="date"
                  value={formData.week_end_date}
                  onChange={(e) => setFormData({ ...formData, week_end_date: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white">
                <Save className="w-4 h-4 mr-2" />
                {isCreating ? 'Create' : 'Update'}
              </Button>
              <Button onClick={handleCancel} variant="outline" className="border-slate-600 text-white">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students List */}
      <Card className="bg-slate-800/50 border-slate-600">
        <CardHeader>
          <CardTitle className="text-white">All Students of the Week</CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No students of the week found.</p>
          ) : (
            <div className="space-y-4">
              {students.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">{student.badge}</div>
                    <div>
                      <h4 className="font-semibold text-white">{student.display_name}</h4>
                      <p className="text-sm text-gray-300">{student.achievement}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {student.squad && (
                          <Badge variant="outline" className="text-xs">
                            {student.squad}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {student.week_start_date} - {student.week_end_date}
                        </Badge>
                        {student.is_active && (
                          <Badge className="bg-green-600 text-white text-xs">
                            Active
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(student)}
                      className="border-slate-600 text-white"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(student.id)}
                      className="border-red-600 text-red-400 hover:bg-red-600/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
