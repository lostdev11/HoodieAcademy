'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserXP } from '@/hooks/useUserXP';
import confetti from 'canvas-confetti';

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
      await fetch('/api/submit-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: params.slug, content: submission })
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
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Submit Your Assignment</h1>
      <p className="mb-2 text-gray-600">This is where you drop your meme, thread, graphic, or Google Doc link for this course.</p>

      <textarea
        placeholder="Paste your submission link or description here..."
        value={submission}
        onChange={(e) => setSubmission(e.target.value)}
        className="w-full border rounded-lg p-3 min-h-[120px] mb-4"
      />

      <button
        onClick={handleSubmit}
        disabled={loading || !submission}
        className="px-5 py-2 rounded bg-black text-white hover:bg-gray-800 disabled:opacity-40"
      >
        {loading ? 'Submitting...' : 'Submit Assignment'}
      </button>

      {success && (
        <div className="mt-4 text-green-600 font-semibold">✅ Submission received! +100 XP awarded.</div>
      )}

      <button
        onClick={() => router.back()}
        className="mt-6 text-sm text-blue-600 underline"
      >
        ← Back to course
      </button>
    </div>
  );
} 