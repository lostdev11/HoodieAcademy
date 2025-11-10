'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Mail, Wallet, CheckCircle, Loader2, User, Info } from 'lucide-react';

export default function PreviewSubmissionForm() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim();
    const trimmedWallet = walletAddress.trim();

    if (!trimmedFirstName || !trimmedLastName) {
      setError('First and last name are required');
      return;
    }

    if (!trimmedEmail && !trimmedWallet) {
      setError('Please provide either an email or wallet address');
      return;
    }

    // Basic email validation if email is provided
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/preview/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: trimmedFirstName,
          last_name: trimmedLastName,
          email: trimmedEmail || null,
          wallet_address: trimmedWallet || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit');
      }

      if (typeof window !== 'undefined') {
        const submissionRecord = {
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
          email: trimmedEmail || null,
          walletAddress: trimmedWallet || null,
          submittedAt: new Date().toISOString(),
        };
        localStorage.setItem('hoodie_preview_submission', JSON.stringify(submissionRecord));
      }

      setSubmitted(true);
      setFirstName('');
      setLastName('');
      setEmail('');
      setWalletAddress('');
    } catch (err) {
      console.error('Error submitting preview form:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="bg-green-500/10 border-green-500/30">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-green-400">
            <CheckCircle className="w-5 h-5" />
            <p className="text-sm">Thanks for your interest! We'll keep you updated.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#1a1a1a]/80 backdrop-blur-sm border-gray-700">
      <CardContent className="pt-6">
        <h3 className="text-xl font-semibold mb-4">Stay Updated</h3>
        <p className="text-sm text-gray-300 mb-6">
          Interested in getting notified when full access becomes available? Add your name and leave your email or wallet address below.
        </p>

        <Alert className="bg-indigo-600/10 border-indigo-400/40 text-indigo-200">
          <Info className="h-4 w-4" />
          <AlertTitle className="text-indigo-200">Unlock the free T100 preview</AlertTitle>
          <AlertDescription className="text-sm text-indigo-100/90">
            To move forward, enter your first and last name and add either an email address or a wallet address. 
            Once submitted, we&apos;ll unlock the free course and keep you posted on what&apos;s next.
          </AlertDescription>
        </Alert>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first-name" className="text-gray-300 flex items-center gap-2">
                <User className="w-4 h-4" />
                First Name
              </Label>
              <Input
                id="first-name"
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="bg-slate-800 border-gray-600 text-white"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name" className="text-gray-300 flex items-center gap-2">
                <User className="w-4 h-4" />
                Last Name
              </Label>
              <Input
                id="last-name"
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="bg-slate-800 border-gray-600 text-white"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-800 border-gray-600 text-white"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wallet" className="text-gray-300 flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Wallet Address
            </Label>
            <Input
              id="wallet"
              type="text"
              placeholder="Your wallet address"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="bg-slate-800 border-gray-600 text-white"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={
              loading ||
              !firstName.trim() ||
              !lastName.trim() ||
              (!email.trim() && !walletAddress.trim())
            }
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </Button>

          <p className="text-xs text-gray-400 text-center">
            First and last name plus either an email or wallet address are required
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

