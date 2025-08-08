// src/app/medieval/page.tsx
import Link from "next/link";

export default function MedievalHome() {
  return (
    <main className="parchment-bg relative flex min-h-[calc(100dvh-0px)] flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-wide">
          Hoodie Academy
        </h1>
        <p className="opacity-80">Your scroll of destiny awaits, hoodlum.</p>

        <div className="grid gap-4">
          <Link
            href="/medieval/wallet-wizardry"
            className="inline-flex items-center justify-center px-5 py-3 rounded-xl font-semibold shadow-scroll hover:shadow-glow transition bg-card/90 animate-parchmentGlow"
          >
            Enter the Academy
          </Link>
        </div>

        <div className="mt-8 rounded-2xl p-6 shadow-scroll hover:shadow-glow transition animate-parchmentGlow bg-card/90">
          <h2 className="text-xl font-semibold mb-2">Scroll of the Day</h2>
          <p className="opacity-80">
            Placement tests are open. Choose your squad wisely.
          </p>
        </div>
      </div>
    </main>
  );
}
