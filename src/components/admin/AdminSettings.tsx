'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, Database, Shield, Bell, Users, 
  Save, RefreshCw, AlertCircle, CheckCircle,
  Globe, Lock, Eye, EyeOff, Trash2
} from 'lucide-react';

interface AdminSettingsProps {
  walletAddress: string | null;
}

interface SystemSettings {
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  bountySubmissionsEnabled: boolean;
  courseEnrollmentEnabled: boolean;
  announcementEnabled: boolean;
  maxSubmissionsPerBounty: number;
  xpPerSubmission: number;
  adminEmail: string;
  systemMessage: string;
}

export default function AdminSettings({ walletAddress }: AdminSettingsProps) {
  const [settings, setSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    registrationEnabled: true,
    bountySubmissionsEnabled: true,
    courseEnrollmentEnabled: true,
    announcementEnabled: true,
    maxSubmissionsPerBounty: 3,
    xpPerSubmission: 10,
    adminEmail: '',
    systemMessage: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // In a real app, this would fetch from an API
      // For now, we'll use default values
      setSettings({
        maintenanceMode: false,
        registrationEnabled: true,
        bountySubmissionsEnabled: true,
        courseEnrollmentEnabled: true,
        announcementEnabled: true,
        maxSubmissionsPerBounty: 3,
        xpPerSubmission: 10,
        adminEmail: 'admin@hoodieacademy.com',
        systemMessage: 'Welcome to Hoodie Academy!'
      });
    } catch (err) {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // In a real app, this would save to an API
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      loadSettings();
    }
  };

  const handleClearCache = async () => {
    try {
      setLoading(true);
      // In a real app, this would clear server cache
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Cache cleared successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to clear cache');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !settings) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-slate-400" />
          <p className="text-slate-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-400" />
            Admin Settings
          </h2>
          <p className="text-slate-400">Manage system configuration and preferences</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleReset}
            variant="outline"
            className="border-slate-600 text-slate-300"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <Card className="bg-red-900/20 border-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="bg-green-900/20 border-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span>{success}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="xp">XP System</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card className="bg-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Globe className="w-5 h-5" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="maintenanceMode" className="text-white">Maintenance Mode</Label>
                  <p className="text-sm text-slate-400">Enable to temporarily disable public access</p>
                </div>
                <Switch
                  id="maintenanceMode"
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                />
              </div>

              <div>
                <Label htmlFor="adminEmail" className="text-white">Admin Email</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={settings.adminEmail}
                  onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                  className="mt-1 bg-slate-700 border-slate-600 text-white"
                  placeholder="admin@example.com"
                />
              </div>

              <div>
                <Label htmlFor="systemMessage" className="text-white">System Message</Label>
                <Textarea
                  id="systemMessage"
                  value={settings.systemMessage}
                  onChange={(e) => setSettings({ ...settings, systemMessage: e.target.value })}
                  className="mt-1 bg-slate-700 border-slate-600 text-white"
                  placeholder="Enter a system-wide message for users"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feature Settings */}
        <TabsContent value="features" className="space-y-4">
          <Card className="bg-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Feature Toggles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="registrationEnabled" className="text-white">User Registration</Label>
                  <p className="text-sm text-slate-400">Allow new users to register</p>
                </div>
                <Switch
                  id="registrationEnabled"
                  checked={settings.registrationEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, registrationEnabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="bountySubmissionsEnabled" className="text-white">Bounty Submissions</Label>
                  <p className="text-sm text-slate-400">Allow users to submit bounty entries</p>
                </div>
                <Switch
                  id="bountySubmissionsEnabled"
                  checked={settings.bountySubmissionsEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, bountySubmissionsEnabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="courseEnrollmentEnabled" className="text-white">Course Enrollment</Label>
                  <p className="text-sm text-slate-400">Allow users to enroll in courses</p>
                </div>
                <Switch
                  id="courseEnrollmentEnabled"
                  checked={settings.courseEnrollmentEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, courseEnrollmentEnabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="announcementEnabled" className="text-white">Announcements</Label>
                  <p className="text-sm text-slate-400">Show announcements to users</p>
                </div>
                <Switch
                  id="announcementEnabled"
                  checked={settings.announcementEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, announcementEnabled: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* XP System Settings */}
        <TabsContent value="xp" className="space-y-4">
          <Card className="bg-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5" />
                XP System Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="maxSubmissionsPerBounty" className="text-white">Max Submissions Per Bounty</Label>
                <Input
                  id="maxSubmissionsPerBounty"
                  type="number"
                  value={settings.maxSubmissionsPerBounty}
                  onChange={(e) => setSettings({ ...settings, maxSubmissionsPerBounty: parseInt(e.target.value) || 0 })}
                  className="mt-1 bg-slate-700 border-slate-600 text-white"
                  min="1"
                  max="10"
                />
                <p className="text-sm text-slate-400 mt-1">Maximum number of submissions a user can make per bounty</p>
              </div>

              <div>
                <Label htmlFor="xpPerSubmission" className="text-white">XP Per Submission</Label>
                <Input
                  id="xpPerSubmission"
                  type="number"
                  value={settings.xpPerSubmission}
                  onChange={(e) => setSettings({ ...settings, xpPerSubmission: parseInt(e.target.value) || 0 })}
                  className="mt-1 bg-slate-700 border-slate-600 text-white"
                  min="1"
                  max="100"
                />
                <p className="text-sm text-slate-400 mt-1">Base XP awarded for each submission</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-4">
          <Card className="bg-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Database className="w-5 h-5" />
                System Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={handleClearCache}
                  variant="outline"
                  className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Clear Cache
                </Button>

                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Restart System
                </Button>
              </div>

              <div className="pt-4 border-t border-slate-700">
                <h4 className="text-white font-medium mb-2">Danger Zone</h4>
                <p className="text-sm text-slate-400 mb-4">
                  These actions are irreversible. Please proceed with caution.
                </p>
                <Button
                  variant="outline"
                  className="border-red-500 text-red-400 hover:bg-red-500/10"
                  onClick={() => {
                    if (confirm('Are you sure you want to reset all user data? This action cannot be undone.')) {
                      // In a real app, this would reset user data
                      setError('This feature is not implemented yet');
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Reset All User Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
