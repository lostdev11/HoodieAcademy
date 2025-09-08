'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, Database, BookOpen, Settings, Users, Trophy, Calendar, Megaphone } from 'lucide-react';

export default function SetupPage() {
  const [setupStatus, setSetupStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runDatabaseSetup = async () => {
    setSetupStatus('running');
    setError(null);
    
    try {
      const response = await fetch('/api/setup-complete-database', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResults(data);
        setSetupStatus('completed');
      } else {
        setError(data.error || 'Setup failed');
        setSetupStatus('error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
      setSetupStatus('error');
    }
  };

  const importCourses = async () => {
    try {
      const response = await fetch('/api/import-courses-from-directory', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResults((prev: any) => ({ ...prev, courseImport: data }));
      } else {
        setError(data.error || 'Course import failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Course import failed');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Database className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-400 mb-4">🚀 Hoodie Academy Setup</h1>
          <p className="text-xl text-slate-300">
            Get your admin dashboard fully connected and ready to manage courses, announcements, events, and more!
          </p>
        </div>

        {/* Setup Steps */}
        <div className="grid gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {getStatusIcon(setupStatus)}
                <span>Step 1: Database Setup</span>
                {setupStatus === 'completed' && (
                  <Badge className="bg-green-600">Completed</Badge>
                )}
              </CardTitle>
              <p className="text-slate-400">
                Create all required database tables and insert sample data for courses, announcements, events, bounties, and submissions.
              </p>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={runDatabaseSetup}
                disabled={setupStatus === 'running'}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {setupStatus === 'running' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Setting up database...
                  </>
                ) : (
                  'Run Database Setup'
                )}
              </Button>
            </CardContent>
          </Card>

          {setupStatus === 'completed' && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-green-500" />
                  <span>Step 2: Import Courses</span>
                </CardTitle>
                <p className="text-slate-400">
                  Import courses from your public/courses directory to connect them to the admin dashboard.
                </p>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={importCourses}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Import Courses from Directory
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results */}
        {results && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Setup Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-slate-700/50 rounded">
                    <div className="text-2xl font-bold text-blue-400">{results.sampleDataInserted?.courses || 0}</div>
                    <div className="text-sm text-slate-400">Courses</div>
                  </div>
                  <div className="text-center p-3 bg-slate-700/50 rounded">
                    <div className="text-2xl font-bold text-green-400">{results.sampleDataInserted?.announcements || 0}</div>
                    <div className="text-sm text-slate-400">Announcements</div>
                  </div>
                  <div className="text-center p-3 bg-slate-700/50 rounded">
                    <div className="text-2xl font-bold text-purple-400">{results.sampleDataInserted?.bounties || 0}</div>
                    <div className="text-sm text-slate-400">Bounties</div>
                  </div>
                  <div className="text-center p-3 bg-slate-700/50 rounded">
                    <div className="text-2xl font-bold text-orange-400">{results.sampleDataInserted?.events || 0}</div>
                    <div className="text-sm text-slate-400">Events</div>
                  </div>
                </div>

                {results.courseImport && (
                  <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded">
                    <h4 className="font-semibold text-green-400 mb-2">Course Import Results</h4>
                    <div className="text-sm text-green-300">
                      <p>Total files: {results.courseImport.summary.totalFiles}</p>
                      <p>Imported: {results.courseImport.summary.importedCourses}</p>
                      <p>Errors: {results.courseImport.summary.errors}</p>
                    </div>
                  </div>
                )}

                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded">
                  <h4 className="font-semibold text-blue-400 mb-2">What's Now Available</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span>User Management</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-green-400" />
                      <span>Course Management</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-purple-400" />
                      <span>Announcements</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-orange-400" />
                      <span>Events</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-yellow-400" />
                      <span>Bounties</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-cyan-400" />
                      <span>Global Settings</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <a 
                    href="/admin-dashboard" 
                    className="inline-block bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold"
                  >
                    🎉 Go to Admin Dashboard
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card className="bg-red-900/20 border-red-500/30">
            <CardHeader>
              <CardTitle className="text-red-400">Setup Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-200">{error}</p>
              <div className="mt-4 p-3 bg-slate-800/50 rounded">
                <h4 className="font-semibold text-slate-300 mb-2">Troubleshooting Tips:</h4>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Check that your Supabase project is running and accessible</li>
                  <li>• Verify your environment variables are set correctly</li>
                  <li>• Ensure your service role key has the necessary permissions</li>
                  <li>• Check the browser console for detailed error messages</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-blue-400">🎯 What This Setup Does</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-300">
              <p>• Creates all required database tables</p>
              <p>• Inserts sample courses, announcements, events, and bounties</p>
              <p>• Sets up global settings and feature flags</p>
              <p>• Connects admin dashboard tabs to the database</p>
              <p>• Enables real-time updates across the platform</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-green-400">🚀 After Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-300">
              <p>• Admin dashboard will show real data from database</p>
              <p>• Course page will display published courses</p>
              <p>• All admin tabs will be fully functional</p>
              <p>• Changes made in admin will update in real-time</p>
              <p>• No more mock data or disconnected components</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
