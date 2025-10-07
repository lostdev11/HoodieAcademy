import BountiesGrid from '@/components/BountiesGrid';

// Mock bounty data for testing
const testBounties = [
  {
    id: 'test-bounty-123',
    title: 'Create a Hoodie Academy Meme',
    description: 'Create a funny meme about Web3 learning and the Hoodie Academy community. Show your creativity!',
    reward_xp: 100,
    status: 'open',
    image_required: true,
    submission_type: 'both',
    created_at: new Date().toISOString(),
    link_to: null
  },
  {
    id: 'test-bounty-456',
    title: 'Write a Web3 Tutorial',
    description: 'Create a comprehensive tutorial about any Web3 topic. Text-only submission.',
    reward_xp: 150,
    status: 'open',
    image_required: false,
    submission_type: 'text',
    created_at: new Date().toISOString(),
    link_to: null
  }
];

export default function TestBountyUploadPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-cyan-400 mb-4">
            🎯 Test Bounty Upload Functionality
          </h1>
          <p className="text-gray-400">
            Test the enhanced file upload functionality for bounty submissions
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-slate-800/50 border-blue-500/30 rounded-lg p-6">
          <h2 className="text-blue-400 font-semibold mb-4">How to Test</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <h3 className="text-white font-medium mb-2">For Image Required Bounties:</h3>
              <ul className="space-y-1">
                <li>• Enter a description in the text area</li>
                <li>• Upload an image (required)</li>
                <li>• Watch the upload process with loading states</li>
                <li>• Submit when both text and image are ready</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-medium mb-2">For Text-Only Bounties:</h3>
              <ul className="space-y-1">
                <li>• Enter a description in the text area</li>
                <li>• No image upload required</li>
                <li>• Submit directly with text content</li>
                <li>• Check console for submission logs</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bounties Grid */}
        <BountiesGrid initialBounties={testBounties} showHidden={false} />
      </div>
    </div>
  );
}
