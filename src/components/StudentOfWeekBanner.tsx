'use client';

import { useState, useEffect } from 'react';

interface Student {
  wallet_address: string;
  display_name: string;
  pfp?: string;
  total_xp: number;
  level: number;
  squad?: string;
  reason?: string;
  achievements?: string[];
  week_start?: string;
  week_end?: string;
}

export default function StudentOfWeekBanner() {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudent();
  }, []);

  const fetchStudent = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/student-of-week?action=current');
      const data = await response.json();

      if (data.success) {
        setStudent(data.student);
      }
    } catch (err) {
      console.error('Error fetching student of week:', err);
      setError('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null; // Silent loading
  }

  if (error || !student) {
    return null; // Don't show if no student selected
  }

  return (
    <div className="bg-gradient-to-br from-yellow-900/40 via-orange-900/40 to-amber-900/40 border-2 border-yellow-500 rounded-lg p-6 shadow-xl">
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-3xl">🌟</span>
        <h2 className="text-2xl font-bold text-yellow-400">Student of the Month</h2>
      </div>

      <div className="flex items-center space-x-6">
        {/* Profile Picture */}
        <div className="relative">
          {student.pfp ? (
            <img 
              src={student.pfp} 
              alt={student.display_name}
              className="w-24 h-24 rounded-full border-4 border-yellow-500 shadow-lg"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-yellow-500 shadow-lg">
              {student.display_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-white rounded-full px-3 py-1 text-sm font-bold shadow-lg">
            Level {student.level}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-white mb-1">{student.display_name}</h3>
          
          <div className="flex items-center space-x-4 mb-2">
            <span className="text-yellow-300 font-semibold">
              {student.total_xp.toLocaleString()} XP
            </span>
            {student.squad && student.squad !== 'Unassigned' && (
              <>
                <span className="text-gray-500">•</span>
                <span className="text-gray-300">{student.squad}</span>
              </>
            )}
          </div>

          {student.reason && (
            <p className="text-gray-200 italic mb-2">
              &quot;{student.reason}&quot;
            </p>
          )}

          {student.achievements && student.achievements.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {student.achievements.slice(0, 3).map((achievement, index) => (
                <span
                  key={index}
                  className="bg-yellow-600/30 border border-yellow-500/50 text-yellow-200 px-3 py-1 rounded-full text-sm"
                >
                  ✨ {achievement}
                </span>
              ))}
              {student.achievements.length > 3 && (
                <span className="text-gray-400 text-sm self-center">
                  +{student.achievements.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {student.week_start && student.week_end && (
        <div className="mt-4 text-gray-400 text-sm text-center border-t border-yellow-700 pt-3">
          Week of {new Date(student.week_start).toLocaleDateString()} - {new Date(student.week_end).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}


