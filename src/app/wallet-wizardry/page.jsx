"use client";
import TokenGate from "@/components/TokenGate";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
              <Link href="/" className="flex items-center space-x-1">
                <ArrowLeft size={16} />
                <span>Back to Home</span>
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