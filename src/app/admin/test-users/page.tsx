'use client';

import { useState, useEffect } from 'react';

export default function TestUsersPage() {
  const [testData, setTestData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Test the test-users API
        const testResponse = await fetch('/api/test-users');
        const testData = await testResponse.json();
        
        // Test the admin users API
        const adminResponse = await fetch('/api/admin/users');
        const adminData = await adminResponse.json();
        
        setTestData({
          testApi: testData,
          adminApi: adminData
        });
        
      } catch (err) {
        console.error('Error fetching test data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch test data');
      } finally {
        setLoading(false);
      }
    };

    fetchTestData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading test data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Users Database Test</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test API Results */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test API Results</h2>
            <div className="space-y-4">
              <div>
                <span className="font-medium">Success:</span>
                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                  testData?.testApi?.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {testData?.testApi?.success ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="font-medium">Users Count:</span>
                <span className="ml-2 text-lg font-bold text-blue-600">
                  {testData?.testApi?.usersCount || 0}
                </span>
              </div>
              <div>
                <span className="font-medium">Table Exists:</span>
                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                  testData?.testApi?.tableExists ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {testData?.testApi?.tableExists ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="font-medium">Message:</span>
                <span className="ml-2 text-gray-600">{testData?.testApi?.message}</span>
              </div>
            </div>
            
            {testData?.testApi?.users && testData.testApi.users.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-2">Sample Users:</h3>
                <div className="space-y-2">
                  {testData.testApi.users.slice(0, 3).map((user: any, index: number) => (
                    <div key={index} className="p-3 bg-gray-50 rounded text-sm">
                      <div><strong>Wallet:</strong> {user.wallet_address}</div>
                      <div><strong>Name:</strong> {user.display_name || 'No name'}</div>
                      <div><strong>Squad:</strong> {user.squad || 'No squad'}</div>
                      <div><strong>Admin:</strong> {user.is_admin ? 'Yes' : 'No'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Admin API Results */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Admin API Results</h2>
            <div className="space-y-4">
              <div>
                <span className="font-medium">Success:</span>
                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                  !testData?.adminApi?.error ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {!testData?.adminApi?.error ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="font-medium">Users Count:</span>
                <span className="ml-2 text-lg font-bold text-blue-600">
                  {testData?.adminApi?.users?.length || 0}
                </span>
              </div>
              <div>
                <span className="font-medium">Total Users:</span>
                <span className="ml-2 text-lg font-bold text-blue-600">
                  {testData?.adminApi?.total || 0}
                </span>
              </div>
              {testData?.adminApi?.error && (
                <div>
                  <span className="font-medium text-red-600">Error:</span>
                  <div className="mt-1 p-3 bg-red-50 rounded text-sm text-red-800">
                    {testData.adminApi.error}
                    {testData.adminApi.details && (
                      <div className="mt-1 text-xs">Details: {testData.adminApi.details}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {testData?.adminApi?.users && testData.adminApi.users.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-2">Admin API Users:</h3>
                <div className="space-y-2">
                  {testData.adminApi.users.slice(0, 3).map((user: any, index: number) => (
                    <div key={index} className="p-3 bg-gray-50 rounded text-sm">
                      <div><strong>Wallet:</strong> {user.wallet_address}</div>
                      <div><strong>Name:</strong> {user.display_name || 'No name'}</div>
                      <div><strong>Squad:</strong> {user.squad || 'No squad'}</div>
                      <div><strong>Admin:</strong> {user.is_admin ? 'Yes' : 'No'}</div>
                      <div><strong>XP:</strong> {user.total_xp || 0}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Raw Data */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Raw API Responses</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Test API Response:</h3>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-64">
                {JSON.stringify(testData?.testApi, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Admin API Response:</h3>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-64">
                {JSON.stringify(testData?.adminApi, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex space-x-4">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Data
          </button>
          <a
            href="/admin"
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Back to Admin
          </a>
        </div>
      </div>
    </div>
  );
}
