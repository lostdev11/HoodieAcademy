import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import CoursesPageClient from './CoursesPageClient';

// Generate metadata for the courses page
export const metadata: Metadata = {
  title: 'Courses - Hoodie Academy',
  description: 'Explore Web3 courses on NFT trading, technical analysis, wallet security, and community building. Join the Hoodie Academy and master crypto trading like a degen.',
  keywords: [
    'Web3 courses',
    'NFT trading courses',
    'crypto education',
    'technical analysis',
    'wallet security',
    'Solana trading',
    'blockchain learning',
    'crypto alpha',
    'trading psychology',
    'community building',
    'Hoodie Academy courses'
  ],
  openGraph: {
    title: 'Web3 Courses - Hoodie Academy',
    description: 'Master Web3, NFTs, and crypto trading with our comprehensive course library. From beginners to advanced traders.',
    type: 'website',
    url: 'https://hoodieacademy.xyz/courses',
    images: [
      {
        url: '/images/hoodie-academy-courses.png',
        width: 1200,
        height: 630,
        alt: 'Hoodie Academy Courses - Web3 Learning',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Web3 Courses - Hoodie Academy',
    description: 'Master Web3, NFTs, and crypto trading with our comprehensive course library.',
    images: ['/images/hoodie-academy-courses.png'],
  },
  alternates: {
    canonical: '/courses',
  },
};

import { headers } from "next/headers";

function getBaseUrl() {
  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  return `${proto}://${host}`;
}

export const revalidate = 0;

async function getCourses() {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/courses`, { cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default async function CoursesPage() {
  const courses = await getCourses();
  return (
    <main className="max-w-6xl mx-auto p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((c: any) => (
        <a
          key={c.id}
          href={c.href}
          className="rounded-2xl border p-4 bg-card hover:shadow transition"
        >
          <div className="text-3xl">{c.emoji}</div>
          <h2 className="mt-2 text-lg font-semibold">{c.title}</h2>
          <p className="text-sm text-muted-foreground line-clamp-3">{c.description}</p>
          <div className="mt-3 text-xs flex gap-2">
            <span className="px-2 py-1 border rounded-full">{c.badge}</span>
            {c.level ? <span className="px-2 py-1 border rounded-full">{c.level}</span> : null}
            {c.squad ? <span className="px-2 py-1 border rounded-full">{c.squad}</span> : null}
          </div>
        </a>
      ))}
    </main>
  );
}
