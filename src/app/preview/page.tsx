import { Metadata } from 'next';
import Link from "next/link";
import Image from "next/image";
import PreviewSubmissionForm from "@/components/preview/PreviewSubmissionForm";

export const metadata: Metadata = {
  title: 'Explore Hoodie Academy | Free T100 Preview Course',
  description: 'Get a taste of Hoodie Academy with our free T100 course on RSI, Bollinger Bands, Fibonacci, and candlestick basics. No wallet required.',
  keywords: [
    'free crypto course',
    'technical analysis',
    'RSI trading',
    'Bollinger Bands',
    'Fibonacci levels',
    'candlestick patterns',
    'Web3 education',
    'Hoodie Academy preview',
    'crypto trading basics',
    'free trading course'
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Explore Hoodie Academy | Free T100 Preview Course',
    description: 'Get a taste of Hoodie Academy with our free T100 course on RSI, Bollinger Bands, Fibonacci, and candlestick basics. No wallet required.',
    type: 'website',
    url: 'https://hoodieacademy.com/preview',
    images: [{
      url: '/images/hoodie-academy-pixel-art-logo.png',
      width: 1200,
      height: 630,
      alt: 'Hoodie Academy Preview - Free T100 Course',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Explore Hoodie Academy | Free T100 Preview Course',
    description: 'Get a taste of Hoodie Academy with our free T100 course on RSI, Bollinger Bands, Fibonacci, and candlestick basics.',
    images: ['/images/hoodie-academy-pixel-art-logo.png'],
  },
  alternates: {
    canonical: 'https://hoodieacademy.com/preview',
  },
};

export default function PreviewPage() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/Hoodie Courses.png"
          alt="Hoodie Courses Background"
          fill
          className="object-cover"
          priority
        />
      </div>
      
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/60 z-10"></div>
      
      <div className="relative z-20 px-6 py-12 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">🎓 Preview Hoodie Academy</h1>
        <p className="text-lg text-gray-300 mb-8">
          Not ready to connect your wallet yet? No problem. Here's one free course to explore what Hoodie Academy is all about.
        </p>

        <div className="border border-gray-700 rounded-xl p-6 bg-[#1a1a1a]/80 backdrop-blur-sm">
          <h2 className="text-2xl font-semibold mb-1">T100 🎯 Intro to Indicators</h2>
          <p className="text-indigo-400 mb-2">RSI, BBands, Fibs + Candle Basics</p>
          <p className="text-sm text-gray-300 mb-4">
            Learn the core tools of technical analysis: RSI, Bollinger Bands, Fibonacci levels, and candlestick theory. Start building your edge in the charts — no jargon, no fluff.
          </p>
          <Link
            href="/courses/t100-chart-literacy"
            className="inline-block mt-2 px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 transition"
          >
            Start Learning
          </Link>
        </div>

        {/* Preview Submission Form */}
        <div className="mt-8">
          <PreviewSubmissionForm />
        </div>

        <div className="mt-12 text-sm text-gray-400">
          👀 Want to learn more? Check out our <Link href="/faq" className="underline text-indigo-300">FAQ</Link> or <Link href="/" className="underline text-indigo-300">login to the Academy</Link> to unlock full access.
        </div>
      </div>
    </div>
  );
}
