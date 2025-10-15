'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { GraduationCap, Info } from 'lucide-react';
import WelcomeTutorial from '@/components/onboarding/WelcomeTutorial';
import { resetOnboarding } from '@/utils/onboarding';

interface TutorialButtonProps {
  walletAddress?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'icon';
  size?: 'sm' | 'default' | 'lg';
  label?: string;
  showIcon?: boolean;
}

export function TutorialButton({
  walletAddress,
  variant = 'outline',
  size = 'default',
  label = 'Show Tutorial',
  showIcon = true
}: TutorialButtonProps) {
  const [showTutorial, setShowTutorial] = useState(false);

  const handleClick = () => {
    // Reset the onboarding flag
    resetOnboarding();
    // Show the tutorial
    setShowTutorial(true);
  };

  return (
    <>
      <Button
        onClick={handleClick}
        variant={variant}
        size={size}
        className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
        title="Take a guided tour of Hoodie Academy"
      >
        {showIcon && <GraduationCap className="w-4 h-4 mr-2" />}
        {label}
      </Button>

      {showTutorial && (
        <WelcomeTutorial 
          walletAddress={walletAddress}
          onClose={() => setShowTutorial(false)}
        />
      )}
    </>
  );
}

// Icon-only variant for compact spaces
export function TutorialIconButton({ walletAddress }: { walletAddress?: string }) {
  return (
    <TutorialButton
      walletAddress={walletAddress}
      variant="ghost"
      size="sm"
      label=""
      showIcon={true}
    />
  );
}

// Help button variant
export function HelpButton({ walletAddress }: { walletAddress?: string }) {
  const [showTutorial, setShowTutorial] = useState(false);

  return (
    <>
      <Button
        onClick={() => {
          resetOnboarding();
          setShowTutorial(true);
        }}
        variant="ghost"
        size="sm"
        className="text-gray-400 hover:text-purple-400 hover:bg-purple-500/10"
        title="Need help? Take the tutorial"
      >
        <Info className="w-4 h-4 mr-2" />
        Help
      </Button>

      {showTutorial && (
        <WelcomeTutorial 
          walletAddress={walletAddress}
          onClose={() => setShowTutorial(false)}
        />
      )}
    </>
  );
}

