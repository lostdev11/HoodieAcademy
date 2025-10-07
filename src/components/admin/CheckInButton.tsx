'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, RefreshCw, Users, Activity } from 'lucide-react';
import { simpleUserSync } from '@/lib/simple-user-sync';

interface CheckInButtonProps {
  onUsersUpdated?: (users: any[]) => void;
  onStatsUpdated?: (stats: any) => void;
  className?: string;
}

export default function CheckInButton({ 
  onUsersUpdated, 
  onStatsUpdated, 
  className = '' 
}: CheckInButtonProps) {
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<Date | null>(null);
  const [checkInResult, setCheckInResult] = useState<{
    usersFound: number;
    newUsers: number;
    activeUsers: number;
  } | null>(null);

  const handleCheckIn = async () => {
    setIsCheckingIn(true);
    setCheckInResult(null);

    try {
      console.log('🔍 Checking in users from database...');
      
      // Fetch all users from the database
      const users = await simpleUserSync.getAllUsers();
      
      // Calculate stats
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const activeUsers = users.filter((user: any) => {
        if (!user.last_active) return false;
        const lastActive = new Date(user.last_active);
        return lastActive > sevenDaysAgo;
      }).length;

      const newUsers = users.filter((user: any) => {
        const createdAt = new Date(user.created_at);
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        return createdAt > oneDayAgo;
      }).length;

      const result = {
        usersFound: users.length,
        newUsers: newUsers,
        activeUsers: activeUsers
      };

      setCheckInResult(result);
      setLastCheckIn(now);

      // Notify parent components
      if (onUsersUpdated) {
        onUsersUpdated(users);
      }

      if (onStatsUpdated) {
        onStatsUpdated({
          totalUsers: users.length,
          activeUsers: activeUsers,
          totalXP: 0, // Will be calculated when XP system is implemented
          avgLevel: 1, // Will be calculated when XP system is implemented
          totalSubmissions: 0, // Will be calculated when submission system is implemented
          pendingSubmissions: 0, // Will be calculated when submission system is implemented
          totalConnections: users.length, // Use user count as proxy
          verifiedNFTs: users.filter((u: any) => u.profile_completed).length
        });
      }

      console.log('✅ Check-in completed:', result);

    } catch (error) {
      console.error('❌ Check-in failed:', error);
      setCheckInResult({
        usersFound: 0,
        newUsers: 0,
        activeUsers: 0
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-4">
        <Button
          onClick={handleCheckIn}
          disabled={isCheckingIn}
          className="flex items-center gap-2"
          variant="default"
        >
          {isCheckingIn ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          {isCheckingIn ? 'Checking In...' : 'Check In Users'}
        </Button>

        {lastCheckIn && (
          <div className="text-sm text-gray-600">
            Last checked: {lastCheckIn.toLocaleTimeString()}
          </div>
        )}
      </div>

      {checkInResult && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">Total Users</span>
            </div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {checkInResult.usersFound}
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-900">Active Users</span>
            </div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {checkInResult.activeUsers}
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-purple-600" />
              <span className="font-medium text-purple-900">New Today</span>
            </div>
            <div className="text-2xl font-bold text-purple-600 mt-1">
              {checkInResult.newUsers}
            </div>
          </div>
        </div>
      )}

      {checkInResult && checkInResult.usersFound === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-yellow-600" />
            <span className="font-medium text-yellow-900">No Users Found</span>
          </div>
          <p className="text-yellow-800 text-sm mt-1">
            No users were found in the database. This might be because:
          </p>
          <ul className="text-yellow-800 text-sm mt-2 ml-4 list-disc">
            <li>No wallets have connected yet</li>
            <li>User creation is not working properly</li>
            <li>Database connection issues</li>
          </ul>
        </div>
      )}
    </div>
  );
}
