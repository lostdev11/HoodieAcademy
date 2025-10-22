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
  selected_at?: string;
}

interface Candidate extends Student {
  xp_this_week: number;
  claims_this_week: number;
  bounties_this_week: number;
  current_streak: number;
}

export default function StudentOfWeekManager() {
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [history, setHistory] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'current' | 'select' | 'history'>('current');
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [achievements, setAchievements] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch current student
      const currentRes = await fetch('/api/admin/student-of-week?action=current');
      const currentData = await currentRes.json();
      setCurrentStudent(currentData.student);

      // Fetch candidates
      const candidatesRes = await fetch('/api/admin/student-of-week?action=top-candidates&limit=20');
      const candidatesData = await candidatesRes.json();
      setCandidates(candidatesData.candidates || []);

      // Fetch history
      const historyRes = await fetch('/api/admin/student-of-week?action=history&limit=12');
      const historyData = await historyRes.json();
      setHistory(historyData.history || []);

    } catch (error) {
      console.error('Error fetching student of week data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetStudent = async () => {
    if (!selectedCandidate) return;

    try {
      setSubmitting(true);

      const achievementsArray = achievements
        .split('\n')
        .map(a => a.trim())
        .filter(a => a.length > 0);

      const response = await fetch('/api/admin/student-of-week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: selectedCandidate,
          reason: reason.trim() || null,
          achievements: achievementsArray.length > 0 ? achievementsArray : null
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Student of the Week set successfully!');
        setReason('');
        setAchievements('');
        setSelectedCandidate(null);
        setActiveTab('current');
        await fetchData();
      } else {
        alert('❌ Failed: ' + data.error);
      }

    } catch (error) {
      console.error('Error setting student:', error);
      alert('❌ Failed to set student of the week');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveStudent = async () => {
    if (!confirm('Are you sure you want to remove the current Student of the Week?')) return;

    try {
      const response = await fetch('/api/admin/student-of-week', {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Student of the Week removed');
        await fetchData();
      } else {
        alert('❌ Failed: ' + data.error);
      }

    } catch (error) {
      console.error('Error removing student:', error);
      alert('❌ Failed to remove student');
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">🌟 Student of the Week</h2>
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-6">🌟 Student of the Week Manager</h2>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('current')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'current'
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Current
        </button>
        <button
          onClick={() => setActiveTab('select')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'select'
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Select New
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'history'
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          History
        </button>
      </div>

      {/* Current Student Tab */}
      {activeTab === 'current' && (
        <div>
          {currentStudent ? (
            <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border border-yellow-600 rounded-lg p-6">
              <div className="flex items-center space-x-4 mb-4">
                {currentStudent.pfp ? (
                  <img 
                    src={currentStudent.pfp} 
                    alt={currentStudent.display_name}
                    className="w-20 h-20 rounded-full border-4 border-yellow-500"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-yellow-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-yellow-500">
                    {currentStudent.display_name.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-yellow-400">{currentStudent.display_name}</h3>
                  <p className="text-gray-300">
                    Level {currentStudent.level} • {currentStudent.total_xp.toLocaleString()} XP
                  </p>
                  {currentStudent.squad && (
                    <p className="text-gray-400 text-sm">Squad: {currentStudent.squad}</p>
                  )}
                </div>
              </div>

              {currentStudent.reason && (
                <div className="mb-4">
                  <p className="text-gray-300 italic">&quot;{currentStudent.reason}&quot;</p>
                </div>
              )}

              {currentStudent.achievements && currentStudent.achievements.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-white font-semibold mb-2">🏆 Achievements:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {currentStudent.achievements.map((achievement, index) => (
                      <li key={index} className="text-gray-300">{achievement}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="text-gray-400 text-sm">
                Week: {currentStudent.week_start} to {currentStudent.week_end}
              </div>

              <button
                onClick={handleRemoveStudent}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
              >
                Remove Student of the Week
              </button>
            </div>
          ) : (
            <div className="bg-gray-700 rounded-lg p-8 text-center">
              <p className="text-gray-400 mb-4">No Student of the Week selected yet</p>
              <button
                onClick={() => setActiveTab('select')}
                className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-bold"
              >
                Select Student of the Week
              </button>
            </div>
          )}
        </div>
      )}

      {/* Select New Student Tab */}
      {activeTab === 'select' && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Top Students This Week</h3>
          
          <div className="grid gap-4 mb-6">
            {candidates.map((candidate, index) => (
              <div
                key={candidate.wallet_address}
                className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                  selectedCandidate === candidate.wallet_address
                    ? 'bg-yellow-900/30 border-yellow-500'
                    : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                }`}
                onClick={() => setSelectedCandidate(candidate.wallet_address)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl font-bold text-gray-500">#{index + 1}</span>
                    {candidate.pfp ? (
                      <img 
                        src={candidate.pfp} 
                        alt={candidate.display_name}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold">
                        {candidate.display_name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-white font-bold">{candidate.display_name}</p>
                      <p className="text-gray-400 text-sm">
                        Level {candidate.level} • {candidate.total_xp.toLocaleString()} XP
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-bold">+{candidate.xp_this_week} XP this week</p>
                    <p className="text-gray-400 text-sm">
                      {candidate.claims_this_week} claims • {candidate.bounties_this_week} bounties
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedCandidate && (
            <div className="bg-gray-700 rounded-lg p-4 space-y-4">
              <h4 className="text-white font-bold">Set as Student of the Week</h4>
              
              <div>
                <label className="block text-gray-300 mb-2">Reason (Optional)</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why is this student being recognized?"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Achievements (One per line, optional)</label>
                <textarea
                  value={achievements}
                  onChange={(e) => setAchievements(e.target.value)}
                  placeholder="Completed 10 courses&#10;Achieved 100 day streak&#10;Helped 50+ community members"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white"
                  rows={5}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleSetStudent}
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white rounded-lg font-bold"
                >
                  {submitting ? 'Setting...' : '🌟 Set as Student of the Week'}
                </button>
                <button
                  onClick={() => {
                    setSelectedCandidate(null);
                    setReason('');
                    setAchievements('');
                  }}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Past Students of the Week</h3>
          
          <div className="space-y-4">
            {history.map((student) => (
              <div
                key={`${student.wallet_address}-${student.week_start}`}
                className="bg-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {student.pfp ? (
                      <img 
                        src={student.pfp} 
                        alt={student.display_name}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold">
                        {student.display_name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-white font-bold">{student.display_name}</p>
                      <p className="text-gray-400 text-sm">
                        {student.week_start} to {student.week_end}
                      </p>
                      {student.reason && (
                        <p className="text-gray-300 text-sm italic mt-1">&quot;{student.reason}&quot;</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-300">Level {student.level}</p>
                    <p className="text-gray-400 text-sm">{student.total_xp.toLocaleString()} XP</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


