'use client';
import { useEffect, useState } from 'react';

interface Submission {
  slug: string;
  content: string;
  timestamp: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export default function DojoLogsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    fetch('/api/submissions')
      .then((res) => res.json())
      .then((data) => setSubmissions(data));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-indigo-900">📜 Dojo Logs</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Assignment submissions from all squads. Staff can review and highlight the best work.
          </p>
        </div>

        <div className="space-y-6">
          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-500 text-lg">No submissions yet.</p>
              <p className="text-gray-400 text-sm mt-2">Complete a course and submit an assignment to see it here!</p>
            </div>
          ) : (
            submissions.map((submission, idx) => (
              <div key={idx} className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      Course: <span className="font-semibold text-indigo-600">{submission.slug}</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      Submitted: {new Date(submission.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {submission.status && (
                    <span className={`text-xs font-semibold uppercase px-2 py-1 rounded-full ${
                      submission.status === 'approved' ? 'bg-green-100 text-green-700' :
                      submission.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {submission.status}
                    </span>
                  )}
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-800 whitespace-pre-wrap">{submission.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 