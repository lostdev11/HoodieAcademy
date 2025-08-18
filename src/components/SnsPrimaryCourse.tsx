'use client';

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  PlayCircle,
  ExternalLink,
  UserCircle2,
  ShieldCheck,
  Sparkles,
  Link2,
  Camera,
  ListChecks,
  ChevronRight,
  ChevronDown,
  Video,
} from "lucide-react";

/**
 * SNS Primary Onboarding Course Module
 * Drop this file anywhere in your Next.js app (e.g. app/(courses)/sns-primary/page.tsx)
 * Make sure shadcn/ui is installed. Uses localStorage to persist progress.
 */

const LS_KEY = "sns-course-progress-v1";

type StepKey =
  | "why-primary"
  | "set-primary"
  | "confirm-solscan"
  | "set-pfp"
  | "join-discord";

type SnsPrimaryCourseProps = {
  getStepStatus?: (key: StepKey) => boolean;        // from your global store
  setStepStatus?: (key: StepKey, done: boolean) => void;
  onFinish?: () => void;                             // calls Supabase completion
  useShellProgress?: boolean;                        // hide local bar if true
  buttonVariant?: "default" | "secondary" | "brand"; // quick style toggle
};

const STEPS: Array<{
  key: StepKey;
  title: string;
  summary: string;
  actions?: Array<{ label: string; href: string; }>; // Keep links editable
  bullets: string[];
  broll: string[]; // narration lines for the b‑roll
}> = [
  {
    key: "why-primary",
    title: "Why Your Primary Domain Matters",
    summary:
      "Your .sol becomes your readable identity across Solana—clean, trusted, and portable.",
    bullets: [
      "Replaces long wallet strings with a human name (yourname.sol)",
      "Displays in supported wallets, explorers, and dApps",
      "Builds reputation & consistency across the ecosystem",
    ],
    actions: [],
    broll: [
      "Your .sol domain is more than just a name—it's your identity across Solana.",
      "By setting a primary, your wallet becomes simple and recognizable.",
    ],
  },
  {
    key: "set-primary",
    title: "Set Your Primary Domain",
    summary: "Use the SNS app to pick your main .sol and confirm the transaction.",
    bullets: [
      "Open the SNS manager and connect your wallet",
      "Select your domain and click 'Set as Primary'",
      "Approve the wallet transaction",
      "Tip: Use the wallet you rely on most",
    ],
    actions: [
      { label: "Open SNS App", href: "https://sns.id" },
    ],
    broll: [
      "Head to the SNS app, connect your wallet, choose your domain, and click 'Set as Primary'.",
      "Approve the transaction—and you're done.",
    ],
  },
  {
    key: "confirm-solscan",
    title: "Confirm on Solscan",
    summary: "Verify the chain shows your primary domain next to your wallet.",
    bullets: [
      "Go to solscan.io",
      "Paste your wallet address",
      "Look for your .sol domain attached to the account",
    ],
    actions: [
      { label: "Open Solscan", href: "https://solscan.io/" },
    ],
    broll: [
      "Open Solscan and search your wallet.",
      "You should see your .sol domain next to the address.",
    ],
  },
  {
    key: "set-pfp",
    title: "Set an NFT as Your PFP",
    summary:
      "Personalize your identity—link a wallet NFT so supporting apps display it with your .sol.",
    bullets: [
      "Open your wallet's profile settings",
      "Choose an NFT you own as the avatar",
      "Save/confirm—supported apps will show it",
    ],
    actions: [],
    broll: [
      "Now make it personal—pick an NFT PFP to link with your .sol.",
      "Apps that support SNS avatars will display it automatically.",
    ],
  },
  {
    key: "join-discord",
    title: "Join Discord & Verify",
    summary: "Connect your wallet to unlock community channels and perks.",
    bullets: [
      "Join the official SNS Discord",
      "Use the verification channel/bot",
      "Connect your wallet to auto-verify your .sol + PFP",
    ],
    actions: [
      { label: "Open SNS Discord", href: "https://discord.gg/solana-name-service" },
    ],
    broll: [
      "Join the SNS Discord and verify your wallet.",
      "Your name and PFP unlock community-only channels.",
    ],
  },
];

export default function SnsPrimaryCourse({
  getStepStatus,
  setStepStatus,
  onFinish,
  useShellProgress = false,
  buttonVariant = "default"
}: SnsPrimaryCourseProps) {
  const [open, setOpen] = useState<StepKey | null>("why-primary");

  const toggle = (key: StepKey) => setOpen((cur) => (cur === key ? null : key));

  // Calculate effective progress from external system or fallback
  const effectivePct = getStepStatus
    ? Math.round(
        (STEPS.filter(s => getStepStatus(s.key)).length / STEPS.length) * 100
      )
    : 0;

  // Check if all steps are completed
  const allCompleted = getStepStatus 
    ? STEPS.every(s => getStepStatus(s.key))
    : false;
  
  // Call onFinish when all steps are completed
  useEffect(() => {
    if (allCompleted && onFinish) {
      onFinish();
    }
  }, [allCompleted, onFinish]);

  const getButtonVariant = (isDone: boolean) => {
    if (buttonVariant === "brand") {
      return isDone ? "secondary" : "default";
    }
    return isDone ? "secondary" : buttonVariant;
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6" /> SNS: Primary Domain & Community Setup
          </h1>
          <p className="text-muted-foreground mt-1">
            Set your primary .sol, confirm on Solscan, add a PFP, and verify in Discord.
          </p>
        </div>
        {!useShellProgress && (
          <Badge variant="secondary" className="text-base py-1 px-3">{effectivePct}%</Badge>
        )}
      </header>

      {!useShellProgress && <Progress value={effectivePct} />}

      <div className="space-y-4">
        {STEPS.map((step, idx) => {
          const isOpen = open === step.key;
          const isDone = getStepStatus ? getStepStatus(step.key) : false;
          return (
            <Card key={step.key} className={`overflow-hidden ${isDone ? "border-green-500/40" : ""}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={isDone ? "default" : "secondary"}>
                      Step {idx + 1}
                    </Badge>
                    {isDone && (
                      <span className="inline-flex items-center text-green-600 text-sm">
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Completed
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-lg md:text-xl">
                    {step.title}
                  </CardTitle>
                  <CardDescription>{step.summary}</CardDescription>
                </div>
                <div className="flex items-center gap-2 self-start">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggle(step.key)}
                    className="gap-1"
                  >
                    {isOpen ? (
                      <>
                        <ChevronDown className="h-4 w-4" /> Collapse
                      </>
                    ) : (
                      <>
                        <ChevronRight className="h-4 w-4" /> Expand
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant={getButtonVariant(isDone)}
                    onClick={() => {
                      if (setStepStatus) setStepStatus(step.key, !isDone);
                    }}
                    className="gap-2"
                  >
                    <ListChecks className="h-4 w-4" />
                    {isDone ? "Mark Incomplete" : "Mark Complete"}
                  </Button>
                </div>
              </CardHeader>

              {isOpen && (
                <CardContent>
                  {/* Action Buttons */}
                  {step.actions && step.actions.length > 0 && (
                    <div className="flex flex-wrap gap-3 mb-4">
                      {step.actions.map((a) => (
                        <Button asChild key={a.href} className="gap-2">
                          <a href={a.href} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-4 w-4" /> {a.label}
                          </a>
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Bullets */}
                  <ul className="space-y-2 list-disc pl-6">
                    {step.bullets.map((b, i) => (
                      <li key={i} className="leading-relaxed">{b}</li>
                    ))}
                  </ul>

                  {/* B‑roll Script */}
                  <div className="mt-6 rounded-2xl border p-4 bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Video className="h-4 w-4" />
                      <p className="font-semibold">B‑roll Narration (optional)</p>
                    </div>
                    <ol className="list-decimal pl-6 space-y-1 text-sm text-muted-foreground">
                      {step.broll.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ol>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Sticky Footer CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-10"
      >
        <Card>
          <CardContent className="py-5 flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" /> Finish & Verify
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                When all steps are complete, you should see your .sol on Solscan and have access to SNS Discord channels.
              </p>
            </div>
            <div className="flex gap-3">
              <Button asChild variant="secondary" className="gap-2">
                <a href="https://solscan.io/" target="_blank" rel="noreferrer">
                  <Link2 className="h-4 w-4" /> Check Solscan
                </a>
              </Button>
              <Button asChild className="gap-2">
                <a href="https://discord.gg/solana-name-service" target="_blank" rel="noreferrer">
                  <UserCircle2 className="h-5 w-5" /> Open Discord
                </a>
              </Button>
              {onFinish && (
                <Button onClick={() => onFinish()} className="gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Finish Course
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notes / Implementation Help */}
      <div className="text-xs text-muted-foreground mt-6">
        <p>
          Tip: You can embed this component inside your course shell and pass completion
          upward if needed. For custom wallet/PFP flows, replace link targets with your
          in‑app routes or modals.
        </p>
      </div>
    </div>
  );
}
