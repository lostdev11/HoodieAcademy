
'use client'

import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { useEffect, useState } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay"
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

      <main className="flex flex-col items-center justify-center px-4 md:px-8">
        <section className="mb-8 text-center">
          <p className="text-lg md:text-xl text-foreground">
            Welcome to <span className="text-secondary font-semibold">Hoodie Academy</span>, the premier Web3 learning center.
            Dive into the world of <span className="text-primary">NFTs</span>,{' '}
            <span className="text-primary">meme coins</span>, and <span className="text-primary">crypto culture</span> with our
            cutting-edge courses.
          </p>
          <div className="mt-4 w-full max-w-md md:max-w-lg lg:max-w-xl mx-auto">
            <Carousel
              plugins={[
                Autoplay({
                  delay: 3000, // Change slide every 3 seconds
                  stopOnInteraction: true,
                }),
              ]}
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent>
                <CarouselItem>
                  <div className="p-1">
                      <Image
                        src="/hoodie-logo.png"
                        alt="Hoodie Academy Logo"
                        width={400}
                        height={200}
                        className="rounded-lg shadow-md w-full h-auto object-contain"
                        data-ai-hint="hoodie logo"
                      />
                  </div>
                </CarouselItem>
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex"/>
              <CarouselNext className="hidden md:flex"/>
            </Carousel>
          </div>
        </section>

        <section className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-4">
          <Button variant="secondary">
            <Link href="/courses">Explore Courses</Link>
          </Button>
          <Button variant="outline">
            <Link href="/great-hoodie-hall">Discover the Great Hoodie Hall</Link>
          </Button>
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
