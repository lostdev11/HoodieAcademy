import { Metadata } from 'next';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Course } from '@/types/course';
import CoursesPageClient from './CoursesPageClient';

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

// Fetch published courses directly
const getPublishedCourses = async () => {
  const supabase = createServerComponentClient({ cookies });
  
  const { data: courses, error } = await supabase
    .from('courses')
    .select(`
      id,
      title,
      emoji,
      squad,
      level,
      access,
      description,
      total_lessons,
      category,
      created_at,
      updated_at,
      is_visible,
      is_published,
      slug,
      sort_order
    `)
    .eq('is_published', true)
    .eq('is_visible', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching published courses:', error);
    return [];
  }

  return courses || [];
};

export default async function CoursesPage() {
  try {
    const courses = await getPublishedCourses();
    console.log('Public courses page rendering with:', courses?.length || 0, 'published courses');
    return <CoursesPageClient initialCourses={courses || []} />;
  } catch (error) {
    console.error('Error in CoursesPage:', error);
    return <CoursesPageClient initialCourses={[]} />;
  }
}
