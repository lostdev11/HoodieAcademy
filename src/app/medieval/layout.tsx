// src/app/medieval/layout.tsx
import type { ReactNode } from "react";
import { Cinzel, UnifrakturMaguntia } from "next/font/google";

// Scoped parchment vars & helpers:
import "../../../styles/parchment.css";

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
  display: 'swap',
});

const unifraktur = UnifrakturMaguntia({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-unifraktur',
  display: 'swap',
});

export default function MedievalLayout({ children }: { children: ReactNode }) {
  return (
    <section className={`parchment-theme min-h-dvh bg-background text-foreground ${cinzel.variable} ${unifraktur.variable}`}>
      {children}
    </section>
  );
}
