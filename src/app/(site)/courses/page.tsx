import { Metadata } from 'next';
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
    url: 'https://hoodieacademy.com/courses',
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

// Fetch published courses directly using service role key for static generation
const getPublishedCourses = async () => {
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // Build query to exclude hidden courses (handles both is_hidden and is_visible schemas)
  // We'll filter client-side to handle both schemas properly
  let query = supabase
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
      is_hidden,
      slug,
      sort_order
    `)
    .eq('is_published', true);
  
  // Try to filter by both columns (Supabase will ignore non-existent columns)
  // This provides some database-level filtering when possible
  query = query.eq('is_visible', true).eq('is_hidden', false);
  
  const { data: courses, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching published courses:', error);
    return [];
  }

  // Additional client-side filtering to ensure hidden courses are excluded
  // This handles cases where the database query might not catch both schemas
  const visibleCourses = (courses || []).filter(course => {
    // Course must be published
    if (!course.is_published) return false;
    
    // Check is_hidden column (if exists)
    if (course.is_hidden === true) return false;
    
    // Check is_visible column (if exists)
    if (course.is_visible === false) return false;
    
    // If neither column exists or both are null, default to visible
    return true;
  });

  return visibleCourses;
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
