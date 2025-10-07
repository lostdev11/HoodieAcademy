import { BountySubmissionExample } from '@/components/bounty/BountySubmissionExample';

export default function TestUploadPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-cyan-400 mb-4">
            🎯 Bounty Upload Test Page
          </h1>
          <p className="text-gray-400">
            Test the enhanced file upload functionality for bounty submissions.
          </p>
        </div>
        
        <BountySubmissionExample 
          bountyId="test-bounty-123"
          className="space-y-6"
        />
      </div>
    </div>
  );
}
