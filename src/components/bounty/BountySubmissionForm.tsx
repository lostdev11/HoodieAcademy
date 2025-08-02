'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface BountySubmissionFormProps {
  onSubmit: (data: BountySubmissionData) => void;
  className?: string;
}

export interface BountySubmissionData {
  title: string;
  squad: string;
  description: string;
  courseRef: string;
  bountyId?: string;
  file: File | null;
  author?: string;
}

export const BountySubmissionForm = ({ onSubmit, className = '' }: BountySubmissionFormProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    squad: '',
    description: '',
    courseRef: ''
  });

  // Calculate Squad XP bonus
  const getSquadXPBonus = (squad: string) => {
    switch (squad) {
      case 'Creators': return 50;
      case 'Speakers': return 40;
      case 'Raiders': return 45;
      case 'Decoders': return 35;
      default: return 25;
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({ ...formData, file: selectedFile });
    // Reset form
    setFormData({ title: '', squad: '', description: '', courseRef: '' });
    setSelectedFile(null);
  };

  return (
    <div className={`bg-gray-900 p-8 rounded-xl ${className}`}>
      <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
        <Upload className="w-5 h-5 text-purple-400" />
        Submit Your Entry
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="title" className="text-white">Artwork Title</Label>
          <Input
            id="title"
            name="title"
            placeholder="Enter your artwork title"
            className="mt-1 bg-gray-800 border-gray-600 text-white"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="squad" className="text-white">Squad (Optional)</Label>
          <Select value={formData.squad} onValueChange={(value) => setFormData({ ...formData, squad: value })}>
            <SelectTrigger className="mt-1 bg-gray-800 border-gray-600 text-white">
              <SelectValue placeholder="Select Squad (optional)" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="Creators">🎨 Creators</SelectItem>
              <SelectItem value="Speakers">🎤 Speakers</SelectItem>
              <SelectItem value="Raiders">⚔️ Raiders</SelectItem>
              <SelectItem value="Decoders">🧠 Decoders</SelectItem>
            </SelectContent>
          </Select>
          {formData.squad && (
            <div className="mt-2 p-2 bg-purple-500/10 rounded-lg border border-purple-500/30">
              <p className="text-sm text-purple-400">
                ⭐ Squad XP Bonus: +{getSquadXPBonus(formData.squad)} XP for {formData.squad} submission
              </p>
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="courseRef" className="text-white">Related Course (Optional)</Label>
          <Input
            id="courseRef"
            name="courseRef"
            placeholder="e.g., v120-meme-creation, t100-chart-literacy"
            className="mt-1 bg-gray-800 border-gray-600 text-white"
            value={formData.courseRef}
            onChange={(e) => setFormData({ ...formData, courseRef: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="description" className="text-white">Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Describe your submission and creative process..."
            className="mt-1 bg-gray-800 border-gray-600 text-white min-h-[100px]"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="file" className="text-white">Upload Artwork</Label>
          <div className="mt-1">
            <Input
              id="file"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="bg-gray-800 border-gray-600 text-white file:bg-purple-600 file:border-0 file:text-white file:px-4 file:py-2 file:rounded file:cursor-pointer"
              required
            />
          </div>
          {selectedFile && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-300">
              <ImageIcon className="w-4 h-4" />
              <span>{selectedFile.name}</span>
              <span className="text-gray-500">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3"
        >
          🚀 Submit Bounty Entry
        </Button>
      </form>
    </div>
  );
}; 