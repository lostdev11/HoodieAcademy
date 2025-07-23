'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bell, Send, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface BulletinForm {
  title: string;
  body: string;
  priority: 'high' | 'medium' | 'low';
  target: 'global' | 'squad';
  squadId?: string;
}

export default function BulletinAdminPage() {
  const [formData, setFormData] = useState<BulletinForm>({
    title: '',
    body: '',
    priority: 'medium',
    target: 'global'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      // For now, we'll just simulate the API call
      // In a real implementation, this would post to your backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Submitting bulletin:', formData);
      
      // Simulate success
      setSubmitStatus('success');
      setFormData({
        title: '',
        body: '',
        priority: 'medium',
        target: 'global'
      });
      
      // Reset success status after 3 seconds
      setTimeout(() => setSubmitStatus('idle'), 3000);
      
    } catch (error) {
      console.error('Error submitting bulletin:', error);
      setSubmitStatus('error');
      setErrorMessage('Failed to submit bulletin. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof BulletinForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="relative z-10 p-6 max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="mb-8">
          <Button
            asChild
            variant="outline"
            className="bg-slate-800/50 hover:bg-slate-700/50 text-cyan-400 hover:text-cyan-300 border-cyan-500/30"
          >
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-cyan-400 mb-2">Bulletin Board Admin</h1>
          <p className="text-gray-300">Post announcements and updates for the Hoodie Academy community</p>
        </div>

        {/* Success/Error Messages */}
        {submitStatus === 'success' && (
          <Card className="mb-6 bg-green-500/20 border-green-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <div>
                  <h3 className="text-lg font-semibold text-green-400">Bulletin Posted Successfully!</h3>
                  <p className="text-gray-300">Your announcement has been published to the community.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {submitStatus === 'error' && (
          <Card className="mb-6 bg-red-500/20 border-red-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-400" />
                <div>
                  <h3 className="text-lg font-semibold text-red-400">Error Posting Bulletin</h3>
                  <p className="text-gray-300">{errorMessage}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form */}
        <Card className="bg-slate-800/50 border-slate-600/40">
          <CardHeader>
            <CardTitle className="text-cyan-400 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Post New Bulletin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-300">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter bulletin title..."
                  className="bg-slate-700/50 border-slate-600/30 text-white placeholder-gray-400"
                  required
                />
              </div>

              {/* Body */}
              <div className="space-y-2">
                <Label htmlFor="body" className="text-gray-300">Content (Markdown Supported)</Label>
                <Textarea
                  id="body"
                  value={formData.body}
                  onChange={(e) => handleInputChange('body', e.target.value)}
                  placeholder="Enter bulletin content... (Supports markdown formatting)"
                  className="bg-slate-700/50 border-slate-600/30 text-white placeholder-gray-400 min-h-[200px]"
                  required
                />
                <p className="text-xs text-gray-400">
                  Supports markdown: **bold**, *italic*, # headers, - lists, etc.
                </p>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-gray-300">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleInputChange('priority', value)}
                >
                  <SelectTrigger className="bg-slate-700/50 border-slate-600/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">High</Badge>
                        <span>High Priority</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Medium</Badge>
                        <span>Medium Priority</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Low</Badge>
                        <span>Low Priority</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Target */}
              <div className="space-y-2">
                <Label htmlFor="target" className="text-gray-300">Target Audience</Label>
                <Select
                  value={formData.target}
                  onValueChange={(value) => handleInputChange('target', value)}
                >
                  <SelectTrigger className="bg-slate-700/50 border-slate-600/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="global">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Global</Badge>
                        <span>All Squads</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="squad">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">Squad</Badge>
                        <span>Specific Squad</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Squad Selection (if target is squad) */}
              {formData.target === 'squad' && (
                <div className="space-y-2">
                  <Label htmlFor="squadId" className="text-gray-300">Select Squad</Label>
                  <Select
                    value={formData.squadId || ''}
                    onValueChange={(value) => handleInputChange('squadId', value)}
                  >
                    <SelectTrigger className="bg-slate-700/50 border-slate-600/30 text-white">
                      <SelectValue placeholder="Choose a squad..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="creators">🎨 Creators Squad</SelectItem>
                      <SelectItem value="decoders">🧠 Decoders Squad</SelectItem>
                      <SelectItem value="speakers">📢 Speakers Squad</SelectItem>
                      <SelectItem value="raiders">⚔️ Raiders Squad</SelectItem>
                      <SelectItem value="rangers">🦅 Rangers Squad</SelectItem>
                      <SelectItem value="treasury">🏦 Treasury Squad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.title || !formData.body}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Post Bulletin
                    </>
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormData({
                    title: '',
                    body: '',
                    priority: 'medium',
                    target: 'global'
                  })}
                  className="border-slate-600 text-gray-300 hover:bg-slate-700"
                >
                  Clear Form
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Preview Section */}
        {formData.title && formData.body && (
          <Card className="mt-8 bg-slate-800/50 border-slate-600/40">
            <CardHeader>
              <CardTitle className="text-cyan-400">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">{formData.title}</h3>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      formData.priority === 'high' ? 'border-red-500 text-red-400 bg-red-500/10' :
                      formData.priority === 'medium' ? 'border-yellow-500 text-yellow-400 bg-yellow-500/10' :
                      'border-green-500 text-green-400 bg-green-500/10'
                    }`}
                  >
                    {formData.priority.toUpperCase()}
                  </Badge>
                </div>
                <div className="prose prose-invert prose-sm max-w-none">
                  <div className="text-gray-300 whitespace-pre-wrap">{formData.body}</div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                    {formData.target === 'global' ? 'Global' : `${formData.squadId} Squad`}
                  </Badge>
                  <span>• Preview only</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 