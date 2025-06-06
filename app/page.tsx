'use client'

import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { useEffect, useState } from 'react';
import Link from 'next/link';


export default function Home() {
  const [currentTime, setCurrentTime] = useState<string | null>(null);

  useEffect(() => {
    // This will only run on the client, after initial hydration
    setCurrentTime(new Date().toLocaleTimeString());

    const timerId = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <header className="mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-accent">
          Hoodie Academy: Learn Hard, HODL Harder
        </h1>
        <p className="text-md md:text-lg text-muted-foreground mt-2">
          {currentTime ? `Current Time: ${currentTime}` : 'Loading time...'}
        </p>
      </header>

      <div className="mb-8 flex justify-center">
         <Image
           src="/images/hoodie-academy-pixel-art-logo.png"
           alt="Hoodie Academy Pixel Art Logo"
           width={300} // Adjust size as needed
           height={180} // Adjust size as needed
           className="object-contain"
           priority
           onError={(e) => {
             console.error('Error loading pixel art logo:', e);
           }}
         />
      </div>

      <main className="flex flex-col items-center justify-center px-4 md:px-8">
        <section className="mb-8 text-center">
          <p className="text-lg md:text-xl text-foreground">
            Welcome to <span className="text-secondary font-semibold">Hoodie Academy</span>, the premier Web3 learning center.
            Dive into the world of <span className="text-primary">NFTs</span>,{' '}
            <span className="text-primary">meme coins</span>, and <span className="text-primary">crypto culture</span> with our
            cutting-edge courses.
          </p>
        </section>

        <section className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex flex-col items-center space-y-4">
            <Button asChild size="lg" className="w-full bg-cyan-500 hover:bg-cyan-600 text-background shadow-lg hover:shadow-xl">
              <Link href="/courses">Enter the Hoodie Path</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full border-cyan-500 text-cyan-500 hover:bg-cyan-500/10">
              <Link href="/great-hoodie-hall">Great Hoodie Hall</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          #StayBuilding #StayHODLing
        </p>
      </footer>
    </div>
  );
}
