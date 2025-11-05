import { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import CourseSchema from '@/components/CourseSchema';

interface Module {
  title: string;
  description: string;
}

interface Course {
  slug: string;
  title: string;
  level: string;
  access: string;
  squad: string;
  modules: Module[];
}

export const metadata: Metadata = {
  title: 'Hoodie Rangers Track - Hoodie Academy',
  description: 'Rangers are elite multi-class Hoodies. They\'ve walked all paths, proven their versatility, and serve wherever the mission calls. Explore the Rangers course track.',
  keywords: [
    'Hoodie Rangers',
    'Rangers squad',
    'multi-class Hoodies',
    'Web3 education',
    'NFT academy',
    'crypto trading',
    'Hoodie Academy Rangers',
    'elite squad courses'
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
    title: 'Hoodie Rangers Track - Hoodie Academy',
    description: 'Rangers are elite multi-class Hoodies. They\'ve walked all paths, proven their versatility, and serve wherever the mission calls.',
    type: 'website',
    url: 'https://hoodieacademy.com/rangers',
    images: [
      {
        url: '/images/hoodie-academy-courses.png',
        width: 1200,
        height: 630,
        alt: 'Hoodie Rangers Track - Hoodie Academy',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hoodie Rangers Track - Hoodie Academy',
    description: 'Rangers are elite multi-class Hoodies. Explore the Rangers course track.',
    images: ['/images/hoodie-academy-courses.png'],
  },
  alternates: {
    canonical: 'https://hoodieacademy.com/rangers',
  },
};

export default function RangersPage() {
  const courseDir = path.join(process.cwd(), 'public/courses');
  let courses: Course[] = [];
  
  try {
    const files = fs.readdirSync(courseDir);
    courses = files
      .map((file) => {
        try {
          const content = fs.readFileSync(path.join(courseDir, file), 'utf-8');
          return JSON.parse(content);
        } catch {
          return null;
        }
      })
      .filter((course): course is Course => 
        course !== null && course.squad === 'Rangers'
      );
  } catch (error) {
    console.error('Error loading Rangers courses:', error);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto bg-gradient-to-b from-[#f5f3ff] via-white to-[#ecfdf5] min-h-screen">
      <h1 className="text-4xl font-bold mb-6 text-indigo-800 drop-shadow-sm">🧢 Hoodie Rangers Track</h1>
      <p className="mb-6 text-gray-700 text-lg">
        Rangers are elite multi-class Hoodies. They've walked all paths, proven their versatility, and serve wherever the mission calls.
      </p>
      
      {courses.length === 0 ? (
        <div className="border rounded-lg p-8 bg-white text-center">
          <p className="text-gray-600 mb-4">
            Rangers courses are coming soon! Check back later for elite multi-class training content.
          </p>
          <Link 
            href="/courses" 
            className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Browse All Courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link key={course.slug} href={`/courses/${course.slug}`}>
              <div className="border rounded-lg p-4 bg-white hover:shadow-lg transition relative">
                <h2 className="text-xl font-semibold mb-2 text-indigo-900 font-mono">{course.title}</h2>
                <p className="text-sm text-gray-500 mb-2">Level: {course.level}</p>
                <ul className="text-sm text-gray-700 list-disc list-inside">
                  {course.modules.slice(0, 3).map((mod, idx) => (
                    <li key={idx}><strong>{mod.title}</strong></li>
                  ))}
                </ul>
                <CourseSchema
                  title={course.title}
                  description={course.modules[0]?.description || course.title}
                  squad={course.squad}
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
