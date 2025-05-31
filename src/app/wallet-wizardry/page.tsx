"use client"

import { Button } from "@/components/ui/button";
import Link from 'next/link';
// Removed Image import as it's no longer used for the badge icon here
import { useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useSwipeable } from 'react-swipeable';
import { motion } from 'framer-motion';
import { LockKeyhole, AlertTriangle, ArrowLeft, CheckCircle, XCircle, Award, Wallet, ChevronDown, ChevronUp } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import TokenGate from "@/components/TokenGate";

declare global {
  interface Window {
    ethereum?: any;
    solana?: any;
    solflare?: any; 
  }
}

type WalletProviderOption = 'metamask' | 'phantom' | 'solflare' | 'jup' | 'magic-eden';

const lessonContents = [
  {
    id: 'l1',
    title: '1. Wallet Types',
    content: (
      <>
        <p className="text-foreground mt-2">
          Wallets are essential for managing your Web3 assets. <strong>Hot wallets</strong> (e.g., MetaMask) are
          software-based, connected to the internet, and convenient for daily use. <strong>Cold wallets</strong>
          (e.g., Ledger) are hardware-based, offline, and offer maximum security for long-term storage.
        </p>
      </>
    ),
    quiz: {
      question: 'What is a hot wallet?',
      options: [
        { id: 'A', text: 'A hardware wallet like Ledger' },
        { id: 'B', text: 'A software wallet connected to the internet' },
        { id: 'C', text: 'A wallet for storing NFTs only' },
        { id: 'D', text: 'A wallet that requires no internet' },
      ],
      correctAnswer: 'B',
      explanation: 'Hot wallets are connected to the internet, making them convenient but potentially less secure than cold (offline) wallets.'
    },
  },
  {
    id: 'l2',
    title: '2. Setup Guide',
    content: (
      <>
        <p className="text-foreground mt-2">
          Setting up a wallet is your first step in Web3. For <strong>MetaMask</strong>, install the browser
          extension, create a new wallet, and securely save your seed phrase. For <strong>Phantom</strong> or
          <strong>Trust Wallet</strong>, download the app and follow similar steps.
        </p>
      </>
    ),
    quiz: {
      question: 'What is the first step in setting up MetaMask?',
      options: [
        { id: 'A', text: 'Share your seed phrase' },
        { id: 'B', text: 'Install the browser extension' },
        { id: 'C', text: 'Buy a hardware wallet' },
        { id: 'D', text: 'Connect to a DAO' },
      ],
      correctAnswer: 'B',
      explanation: 'You need to install the MetaMask browser extension or mobile app before you can create or import a wallet.'
    },
  },
  {
    id: 'l3',
    title: '3. Security Best Practices',
    content: (
      <>
        <p className="text-foreground mt-2">
        Protecting your Web3 assets requires vigilance. Your seed phrase is paramount – guard it. Never share it. Store it offline, ideally in multiple secure locations.
        When interacting with dApps, always double-check URLs and permissions. Understand transaction signatures.
        For enhanced security, consider multi-signature (multi-sig) wallets, requiring multiple approvals.
        </p>
      </>
    ),
    quiz: {
      question: 'What is the most secure way to store your seed phrase?',
      options: [
        { id: 'A', text: 'In a password manager' },
        { id: 'B', text: 'On a cloud storage service' },
        { id: 'C', text: 'Written down offline and stored securely' },
        { id: 'D', text: 'Shared with a trusted friend' },
      ],
      correctAnswer: 'C',
      explanation: 'Storing your seed phrase offline (e.g., on paper, in a safe) is the most secure method as it protects against online hacking attempts.'
    },
  },
  {
    id: 'l4',
    title: '4. Phishing & Scam Awareness',
    content: (
      <>
        <p className="text-foreground mt-2">
        The Web3 space is rife with phishing. Scammers create fake sites mimicking legitimate dApps or wallets to steal credentials or trick you into malicious transactions.
        Beware unsolicited DMs/emails promising free crypto or airdrops if you connect your wallet or send funds. Always verify via official channels.
        </p>
      </>
    ),
    pitfallWarning: (
        <div className="mt-6 p-4 border border-red-500/50 bg-red-900/30 rounded-lg">
            <h4 className="text-lg font-semibold text-red-400 flex items-center mb-2"><AlertTriangle size={20} className="mr-2"/>Phishing Trap Warning!</h4>
            <p className="text-sm text-red-300">
            Always be extremely cautious when connecting your wallet. Verify website URLs, never share your seed phrase, and be wary of unsolicited requests or offers. Scammers create fake sites that look identical to real ones. Double-check everything!
            </p>
        </div>
    ),
    quiz: {
      question: 'A common sign of a phishing website is:',
      options: [
        { id: 'A', text: 'A professional design and fast loading speed' },
        { id: 'B', text: 'A slightly misspelled URL of a legitimate service' },
        { id: 'C', text: 'Clear contact information and a support team' },
        { id: 'D', text: 'An SSL certificate (HTTPS)' },
      ],
      correctAnswer: 'B',
      explanation: 'Scammers often use URLs that are very similar to legitimate ones, hoping users won\'t notice the slight difference.'
    },
  },
];

const PASSING_PERCENTAGE = 0.75; 
const LOCAL_STORAGE_KEY = 'walletWizardryProgress';

export default function WalletWizardry() {
  return (
    <TokenGate>
      <div className="flex flex-col items-center min-h-screen py-8 px-4 bg-background text-foreground">
        <div className="w-full max-w-5xl mb-8 relative">
          <div className="absolute top-0 left-0 z-10 pt-4 pl-4">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="bg-card hover:bg-muted text-accent hover:text-accent-foreground border-accent"
            >
              <Link href="/courses" className="flex items-center space-x-1">
                <ArrowLeft size={16} />
                <span>Back to Courses</span>
              </Link>
            </Button>
          </div>
          <header className="text-center pt-16">
            <h1 className="text-4xl font-bold text-cyan-400 mb-2">Wallet Wizardry</h1>
            <p className="text-md text-muted-foreground">Secure the Bag</p>
          </header>
        </div>
        <main className="w-full max-w-2xl text-center">
          <p className="text-foreground">Welcome to Wallet Wizardry! Learn wallet setup and security.</p>
          {/* Existing quiz, lesson, progress tracker content */}
        </main>
        <footer className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">#StayBuilding #StayHODLing</p>
        </footer>
      </div>
    </TokenGate>
  );
}
