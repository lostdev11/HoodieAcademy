"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import FeedbackTrackerWidget from '@/components/feedback/FeedbackTrackerWidget';
import UserFeedbackForm from '@/components/feedback/UserFeedbackForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Users, MessageCircle, ArrowLeft, Home } from 'lucide-react';
import { useWalletSupabase } from '@/hooks/use-wallet-supabase';

export default function FeedbackPage() {
  const { wallet: walletAddress } = useWalletSupabase();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation Header */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={() => router.push('/')}
            variant="outline"
            className="border-green-500/30 text-green-400 hover:bg-green-500/10 hover:text-green-300"
          >
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
        </div>

        {/* Hero Section */}
        <Card className="bg-slate-800/50 border-blue-500/30">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="inline-block p-4 bg-green-500/20 rounded-full mb-4">
                <Sparkles className="w-12 h-12 text-green-400" />
              </div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
                You Asked, We Fixed
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                We're constantly improving Hoodie Academy based on your feedback. 
                Here's what we've been working on.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-800/50 border-green-500/30">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-400">50+</p>
                  <p className="text-sm text-gray-400">Improvements Made</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-blue-500/30">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-400">100%</p>
                  <p className="text-sm text-gray-400">User Feedback Driven</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-400">24hr</p>
                  <p className="text-sm text-gray-400">Average Response Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Feedback Widget */}
        <FeedbackTrackerWidget limit={10} showTitle={true} />

        {/* User Feedback Submission Form */}
        <UserFeedbackForm walletAddress={walletAddress} />

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-green-900/50 to-blue-900/50 border-green-500/30">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-green-400">
                Join Our Community
              </h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Connect with other learners, share your progress, and get real-time updates! 
                Join our Discord community to be part of the conversation.
              </p>
              <div className="flex items-center justify-center space-x-4 pt-4">
                <button className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105">
                  <MessageCircle className="w-5 h-5 inline-block mr-2 -mt-1" />
                  Join Discord
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

