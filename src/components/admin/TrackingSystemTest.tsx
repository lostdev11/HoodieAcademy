'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Database,
  Zap,
  BarChart3
} from 'lucide-react';
import { 
  testTrackingSystem, 
  generateSampleData, 
  runAllTests 
} from '@/lib/test-tracking-system';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  error?: string;
}

export default function TrackingSystemTest() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);

  const runTest = async (testName: string, testFn: () => Promise<boolean>) => {
    setTests(prev => prev.map(t => 
      t.name === testName 
        ? { ...t, status: 'running' as const }
        : t
    ));

    try {
      const result = await testFn();
      setTests(prev => prev.map(t => 
        t.name === testName 
          ? { ...t, status: result ? 'passed' as const : 'failed' as const }
          : t
      ));
    } catch (error) {
      setTests(prev => prev.map(t => 
        t.name === testName 
          ? { 
              ...t, 
              status: 'failed' as const, 
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          : t
      ));
    }
  };

  const runSystemTest = async () => {
    setRunning(true);
    setTests([
      { name: 'System Test', status: 'pending' },
      { name: 'Sample Data', status: 'pending' }
    ]);

    await runTest('System Test', testTrackingSystem);
    await runTest('Sample Data', generateSampleData);
    
    setRunning(false);
  };

  const runQuickTest = async () => {
    setRunning(true);
    setTests([{ name: 'Quick Test', status: 'pending' }]);
    
    await runTest('Quick Test', testTrackingSystem);
    setRunning(false);
  };

  const generateData = async () => {
    setRunning(true);
    setTests([{ name: 'Generate Data', status: 'pending' }]);
    
    await runTest('Generate Data', generateSampleData);
    setRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-4 h-4 rounded-full bg-gray-300" />;
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'running':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Running</Badge>;
      case 'passed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Passed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Tracking System Test Suite
          </CardTitle>
          <p className="text-gray-600">
            Test the wallet-based user tracking system to ensure everything is working correctly.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={runQuickTest} 
              disabled={running}
              variant="outline"
            >
              <Database className="w-4 h-4 mr-2" />
              Quick Test
            </Button>
            
            <Button 
              onClick={generateData} 
              disabled={running}
              variant="outline"
            >
              <Zap className="w-4 h-4 mr-2" />
              Generate Sample Data
            </Button>
            
            <Button 
              onClick={runSystemTest} 
              disabled={running}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Full Test Suite
            </Button>
          </div>

          {tests.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Test Results:</h4>
              {tests.map((test, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <span className="font-medium">{test.name}</span>
                    {test.error && (
                      <span className="text-red-600 text-sm">({test.error})</span>
                    )}
                  </div>
                  {getStatusBadge(test.status)}
                </div>
              ))}
            </div>
          )}

          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Quick Test:</strong> Verifies basic system functionality</p>
            <p><strong>Generate Sample Data:</strong> Creates test data for development</p>
            <p><strong>Full Test Suite:</strong> Runs comprehensive tests including sample data generation</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-medium">1. Database Setup</h4>
            <p>Ensure you've run the SQL schema from <code>src/lib/user-tracking-schema.sql</code> in your Supabase SQL editor.</p>
          </div>
          
          <div>
            <h4 className="font-medium">2. Environment Variables</h4>
            <p>Make sure your <code>.env.local</code> has the correct Supabase credentials.</p>
          </div>
          
          <div>
            <h4 className="font-medium">3. Authentication</h4>
            <p>You need to be authenticated with Supabase for the tests to work. Connect your wallet first.</p>
          </div>
          
          <div>
            <h4 className="font-medium">4. Admin Access</h4>
            <p>Some tests require admin access. Make sure your wallet is in the admin list.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
