'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Trophy, Calendar } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import Image from 'next/image';

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
}

interface FeatureStatus {
  enabled: boolean;
}

interface StudentOfTheWeekWidgetProps {
  className?: string;
}

export default function StudentOfTheWeekWidget({ className = "" }: StudentOfTheWeekWidgetProps) {
  const [student, setStudent] = useState<StudentOfTheWeek | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [featureEnabled, setFeatureEnabled] = useState(true);


  const fetchCurrentStudent = async () => {
    try {
      setLoading(true);
      setError(null);

      // First check if feature is enabled
      const { data: settingsData, error: settingsError } = await supabase
        .from('student_of_the_week_settings')
        .select('setting_value')
        .eq('setting_key', 'feature_enabled')
        .single();

      if (settingsError) {
        console.error('Error fetching feature setting:', settingsError);
        // Default to enabled if we can't fetch the setting
        setFeatureEnabled(true);
      } else {
        const enabled = settingsData?.setting_value === 'true';
        setFeatureEnabled(enabled);
        
        // If feature is disabled, don't fetch student data
        if (!enabled) {
          setStudent(null);
          setLoading(false);
          return;
        }
      }

      // Call the database function to get current student of the week
      const { data, error } = await supabase
        .rpc('get_current_student_of_the_week');

      if (error) {
        console.error('Error fetching current student:', error);
        setError('Failed to load student of the week');
        return;
      }

      if (data && data.length > 0) {
        setStudent(data[0]);
      } else {
        // No current student found, set to null
        setStudent(null);
      }
    } catch (err) {
      console.error('Error fetching student of the week:', err);
      setError('Failed to load student of the week');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentStudent();
  }, []);

  const handleRefresh = () => {
    fetchCurrentStudent();
  };

  if (loading) {
    return (
      <Card className={`bg-slate-800/50 border-yellow-500/30 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
            <span className="ml-3 text-gray-400">Loading Student of the Week...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`bg-slate-800/50 border-red-500/30 ${className}`}>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <Button 
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!student) {
    return (
      <Card className={`bg-slate-800/50 border-yellow-500/30 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-yellow-400 flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Student of the Week
            </h3>
            <Button 
              onClick={handleRefresh}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-yellow-400" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">
              Not Currently Selected
            </h4>
            <p className="text-gray-400 mb-4">
              {!featureEnabled 
                ? "The Student of the Week feature is currently disabled."
                : "No student has been selected for this week yet."
              }
            </p>
            <Button 
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Check Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-slate-800/50 border-yellow-500/30 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-yellow-400 flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Student of the Week
          </h3>
          <Button 
            onClick={handleRefresh}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Image
              src={student.avatar_url || "/images/hoodie-academy-pixel-art-logo.png"}
              alt="Student PFP"
              width={64}
              height={64}
              className="rounded-full border-2 border-yellow-500/50"
            />
            <div className="absolute -top-1 -right-1 text-2xl">
              {student.badge}
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-bold text-white mb-1">
              {student.display_name}
            </h4>
            <p className="text-sm text-gray-300 mb-2">
              {student.achievement}
            </p>
            <div className="flex items-center gap-2">
              {student.squad && (
                <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">
                  {student.squad} Squad
                </Badge>
              )}
              <Badge variant="outline" className="text-gray-400 border-gray-500/30">
                <Calendar className="w-3 h-3 mr-1" />
                {new Date(student.week_start_date).toLocaleDateString()} - {new Date(student.week_end_date).toLocaleDateString()}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
