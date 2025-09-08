'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserXP } from '@/hooks/useUserXP';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';

export default function SubmitAssignment({ params }: { params: { slug: string } }) {
  const [submission, setSubmission] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { completeCourse } = useUserXP();

  const handleSubmit = async () => {
    if (!submission) return;
    setLoading(true);
    try {
      // Get wallet address from localStorage or use a placeholder
      const walletAddress = localStorage.getItem('walletAddress') || 'unknown';
      
      await fetch('/api/submit-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          slug: params.slug, 
          content: submission,
          walletAddress 
        })
      });
      setSuccess(true);
      completeCourse(params.slug);
      confetti({ spread: 90, particleCount: 70, origin: { y: 0.7 } });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Navigation Header */}
      <header className="bg-slate-800/50 border-b border-cyan-500/30 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Left side - Navigation buttons */}
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => router.push('/')}
                variant="default"
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium px-4 py-2 shadow-lg"
              >
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
              <Button
                onClick={() => router.push('/courses')}
                variant="outline"
                className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 px-4 py-2"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Courses
              </Button>
            </div>
            
            {/* Center - Page title */}
            <div className="flex-1 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-cyan-400">
                📝 Submit Assignment
              </h1>
              <p className="text-sm sm:text-base text-gray-300 mt-1">
                Course: {params.slug}
              </p>
            </div>
            
            {/* Right side - Spacer for balance */}
            <div className="w-32"></div>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4">Submit Your Assignment</h2>
          <p className="mb-4 text-gray-300">This is where you drop your meme, thread, graphic, or Google Doc link for this course.</p>

          <textarea
            placeholder="Paste your submission link or description here..."
            value={submission}
            onChange={(e) => setSubmission(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 min-h-[120px] mb-4 text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none"
          />

          <Button
            onClick={handleSubmit}
            disabled={loading || !submission}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-40"
          >
            {loading ? 'Submitting...' : 'Submit Assignment'}
          </Button>

          {success && (
            <div className="mt-4 text-green-400 font-semibold text-center">
              ✅ Submission received! +100 XP awarded.
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Course
            </Button>
            <Button
              onClick={() => router.push('/courses')}
              variant="outline"
              className="flex-1 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
            >
              View All Courses
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 