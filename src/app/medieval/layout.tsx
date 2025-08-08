// src/app/medieval/layout.tsx
import type { ReactNode } from "react";

// V0 styles (if you want their extra effects) — optional:
import "@/styles/globals.css";       // from V0 export (optional if noisy)
// import "@/components/fantasy.css"; // from V0 export (optional)

// Scoped parchment vars & helpers:
import "@/styles/parchment.css";

export default function MedievalLayout({ children }: { children: ReactNode }) {
  return (
    <section className="parchment-theme min-h-dvh bg-background text-foreground">
      {children}
    </section>
  );
}
