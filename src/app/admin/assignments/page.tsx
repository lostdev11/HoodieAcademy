'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

interface Assignment {
  slug: string;
  content: string;
  timestamp: string;
  status?: 'pending' | 'approved' | 'rejected';
  feedback?: string;
}

export default function AssignmentsAdmin() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      const response = await fetch('/api/submissions');
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (assignmentIndex: number, status: 'approved' | 'rejected') => {
    setReviewing(assignmentIndex.toString());
    try {
      const response = await fetch('/api/review-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          index: assignmentIndex,
          status,
          feedback: feedback || undefined
        })
      });
      
      if (response.ok) {
        await loadAssignments(); // Reload to get updated data
        setFeedback('');
      }
    } catch (error) {
      console.error('Error reviewing assignment:', error);
    } finally {
      setReviewing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-600">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-600">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-600">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Assignment Submissions</h1>
        <p>Loading assignments...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Assignment Submissions</h1>
      <p className="text-gray-600 mb-6">Review and approve student assignments</p>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-500">No assignments submitted yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment, index) => (
            <Card key={index} className="border-l-4 border-l-cyan-500">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {assignment.slug} - Anonymous User
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                      Submitted: {new Date(assignment.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  {getStatusBadge(assignment.status || 'pending')}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Submission:</h4>
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <p className="whitespace-pre-wrap">{assignment.content}</p>
                    </div>
                  </div>

                  {(!assignment.status || assignment.status === 'pending') && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Feedback (optional):
                        </label>
                        <Textarea
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder="Add feedback for the student..."
                          className="min-h-[100px]"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleReview(index, 'approved')}
                          disabled={reviewing === index.toString()}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {reviewing === index.toString() ? 'Approving...' : 'Approve'}
                        </Button>
                        <Button
                          onClick={() => handleReview(index, 'rejected')}
                          disabled={reviewing === index.toString()}
                          variant="destructive"
                        >
                          {reviewing === index.toString() ? 'Rejecting...' : 'Reject'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {assignment.feedback && (
                    <div>
                      <h4 className="font-semibold mb-2">Feedback:</h4>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p>{assignment.feedback}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 