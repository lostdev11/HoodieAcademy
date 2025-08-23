import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import EventsList from '@/components/EventsList';
import PageLayout from '@/components/layouts/PageLayout';

export const metadata: Metadata = {
  title: 'Events - Hoodie Academy',
  description: 'Stay updated with the latest events, workshops, and meetups at Hoodie Academy. Join our community events and enhance your Web3 knowledge.',
  keywords: [
    'Web3 events',
    'crypto workshops',
    'blockchain meetups',
    'NFT trading events',
    'Solana events',
    'Hoodie Academy events',
    'crypto community events'
  ],
  openGraph: {
    title: 'Events - Hoodie Academy',
    description: 'Stay updated with the latest events, workshops, and meetups at Hoodie Academy.',
    type: 'website',
    url: 'https://hoodieacademy.xyz/events',
    images: [
      {
        url: '/images/hoodie-academy-events.png',
        width: 1200,
        height: 630,
        alt: 'Hoodie Academy Events',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Events - Hoodie Academy',
    description: 'Stay updated with the latest events, workshops, and meetups at Hoodie Academy.',
    images: ['/images/hoodie-academy-events.png'],
  },
  alternates: {
    canonical: '/events',
  },
};

export default async function EventsPage() {
  const supabase = createServerComponentClient({ cookies });

  // Fetch events from Supabase
  const { data: events } = await supabase
    .from("events")
    .select("id,title,description,type,date,time,created_at,updated_at")
    .order("date", { ascending: true });

  return (
    <PageLayout
      title="📅 Academy Events"
      subtitle="Stay updated with the latest events, workshops, and meetups"
      showHomeButton={true}
      showBackButton={true}
      backHref="/dashboard"
      backgroundImage={undefined}
      backgroundOverlay={false}
    >
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Upcoming Events</h2>
          <p className="text-gray-600">
            Join our community events, workshops, and meetups to enhance your Web3 knowledge and connect with fellow Hoodie Academy members.
          </p>
        </div>
        
        <EventsList initialEvents={events ?? []} />
      </div>
    </PageLayout>
  );
}
