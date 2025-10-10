"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  Bug,
  Sparkles,
  TrendingUp,
  Palette,
  Zap
} from 'lucide-react';

interface UserFeedbackFormProps {
  walletAddress?: string;
  className?: string;
}

const CATEGORY_OPTIONS = [
  { value: 'bug_report', label: 'Bug Report', icon: Bug, description: 'Report a problem or issue' },
  { value: 'feature_request', label: 'Feature Request', icon: Sparkles, description: 'Suggest a new feature' },
  { value: 'improvement', label: 'Improvement', icon: TrendingUp, description: 'Suggest an enhancement' },
  { value: 'ui_ux', label: 'UI/UX Feedback', icon: Palette, description: 'Design or usability feedback' },
  { value: 'performance', label: 'Performance', icon: Zap, description: 'Speed or optimization issue' },
];

export default function UserFeedbackForm({ walletAddress, className = "" }: UserFeedbackFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim() || !category) {
      setError('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/user-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          wallet_address: walletAddress || 'anonymous'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit feedback');
      }

      setSuccess(true);
      setTitle('');
      setDescription('');
      setCategory('');
      
      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);

    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className={`bg-slate-800/50 border-blue-500/30 ${className}`}>
      <CardHeader>
        <CardTitle className="text-blue-400 flex items-center">
          <MessageSquare className="w-5 h-5 mr-2" />
          Request or Suggest a Fix
        </CardTitle>
        <p className="text-sm text-gray-400 mt-2">
          Help us improve Hoodie Academy! Share your ideas, report bugs, or suggest improvements.
        </p>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="p-6 bg-green-500/10 border border-green-500/30 rounded-lg text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 mx-auto text-green-400" />
            <h3 className="text-lg font-semibold text-green-400">Thank you for your feedback!</h3>
            <p className="text-sm text-gray-300">
              Your suggestion has been submitted. Our team will review it and you may see it in the "You Asked, We Fixed" section soon!
            </p>
            <Button
              onClick={() => setSuccess(false)}
              variant="outline"
              className="mt-4 border-green-500 text-green-400 hover:bg-green-500/10"
            >
              Submit Another
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300">
                What type of feedback is this? <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CATEGORY_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setCategory(option.value)}
                      className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                        category === option.value
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <Icon className={`w-5 h-5 mt-0.5 ${
                          category === option.value ? 'text-blue-400' : 'text-gray-400'
                        }`} />
                        <div className="flex-1">
                          <h4 className={`font-medium ${
                            category === option.value ? 'text-blue-400' : 'text-white'
                          }`}>
                            {option.label}
                          </h4>
                          <p className="text-xs text-gray-400 mt-1">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title Input */}
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium text-gray-300">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of your feedback..."
                maxLength={100}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                required
              />
              <p className="text-xs text-gray-500 text-right">
                {title.length}/100 characters
              </p>
            </div>

            {/* Description Textarea */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-gray-300">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details about your feedback... Be as specific as possible!"
                rows={6}
                maxLength={1000}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                required
              />
              <p className="text-xs text-gray-500 text-right">
                {description.length}/1000 characters
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-400 font-medium">Error</p>
                  <p className="text-xs text-red-300 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-gray-500">
                {walletAddress ? (
                  <>Submitting as: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</>
                ) : (
                  <>Submitting anonymously</>
                )}
              </p>
              <Button
                type="submit"
                disabled={submitting || !title.trim() || !description.trim() || !category}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

