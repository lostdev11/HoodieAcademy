'use client';

import { useState } from 'react';
import { BountySubmissionForm, BountySubmissionData } from './BountySubmissionForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageIcon, FileText, Camera, Upload } from 'lucide-react';

interface BountySubmissionExampleProps {
  bountyId?: string;
  className?: string;
}

export const BountySubmissionExample = ({ bountyId, className = '' }: BountySubmissionExampleProps) => {
  const [submissionResult, setSubmissionResult] = useState<string>('');

  // Example bounty data - in a real app, this would come from the API
  const exampleBountyData = {
    image_required: true, // Set to true to require image upload
    submission_type: 'both' as const, // 'text', 'image', or 'both'
    title: 'Create a Hoodie Academy Meme',
    description: 'Create a funny meme about Web3 learning and the Hoodie Academy community'
  };

  const handleSubmission = async (data: BountySubmissionData) => {
    try {
      console.log('🚀 Submitting bounty:', data);
      
      // In a real app, you would call the API here
      const response = await fetch(`/api/bounties/${bountyId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submission: data.description,
          walletAddress: data.walletAddress,
          submissionType: data.imageUrl ? 'image' : 'text',
          title: data.title,
          description: data.description,
          imageUrl: data.imageUrl,
          squad: data.squad,
          courseRef: data.courseRef
        })
      });

      if (response.ok) {
        const result = await response.json();
        setSubmissionResult('✅ Bounty submitted successfully!');
        console.log('✅ Submission result:', result);
      } else {
        const error = await response.json();
        setSubmissionResult(`❌ Error: ${error.error}`);
      }
    } catch (error) {
      console.error('❌ Submission error:', error);
      setSubmissionResult('❌ Failed to submit bounty');
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Bounty Requirements Display */}
      <Card className="bg-slate-800/50 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Bounty Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Submission Type:</span>
              <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                {exampleBountyData.submission_type === 'both' && <><FileText className="w-3 h-3 mr-1" />Text + Image</>}
                {exampleBountyData.submission_type === 'image' && <><ImageIcon className="w-3 h-3 mr-1" />Image Only</>}
                {exampleBountyData.submission_type === 'text' && <><FileText className="w-3 h-3 mr-1" />Text Only</>}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Image Required:</span>
              <Badge variant={exampleBountyData.image_required ? "destructive" : "secondary"}>
                {exampleBountyData.image_required ? "Yes" : "No"}
              </Badge>
            </div>
            
            <div>
              <span className="text-gray-400">Description:</span>
              <p className="text-white mt-1">{exampleBountyData.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submission Form */}
      <Card className="bg-slate-800/50 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Submit Your Entry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BountySubmissionForm 
            onSubmit={handleSubmission}
            bountyData={exampleBountyData}
            className=""
          />
        </CardContent>
      </Card>

      {/* Submission Result */}
      {submissionResult && (
        <Card className="bg-slate-800/50 border-green-500/30">
          <CardContent className="pt-6">
            <p className="text-green-400">{submissionResult}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
