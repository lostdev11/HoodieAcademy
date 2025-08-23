import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CoursePageClient from './CoursePageClient';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import fs from 'fs';
import path from 'path';

// Function to get course data
async function getCourseData(slug: string) {
  try {
    console.log('getCourseData: Attempting to load course:', slug);
    
    // Use the API route to get course data
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3008' 
      : 'https://hoodieacademy.xyz';
    
    const response = await fetch(`${baseUrl}/api/courses/${slug}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Disable caching for development
      cache: process.env.NODE_ENV === 'development' ? 'no-store' : 'force-cache'
    });
    
    if (!response.ok) {
      console.error(`getCourseData: API returned ${response.status}: ${response.statusText}`);
      return null;
    }
    
    const course = await response.json();
    console.log('getCourseData: Course loaded from API:', course.title);
    console.log('getCourseData: Course has modules:', course.modules?.length || 0);
    console.log('getCourseData: Course modules:', course.modules);
    
    // Validate course structure
    if (!course.modules || !Array.isArray(course.modules) || course.modules.length === 0) {
      console.error('getCourseData: Course has no valid modules');
      return null;
    }
    
    return course;
  } catch (error) {
    console.error(`Error loading course ${slug}:`, error);
    
    // Fallback: try to read the course file directly
    try {
      console.log('getCourseData: API failed, trying fs fallback');
      const coursePath = path.join(process.cwd(), 'public', 'courses', `${slug}.json`);
      console.log('getCourseData: Course path:', coursePath);
      
      // Check if file exists
      if (!fs.existsSync(coursePath)) {
        console.error('getCourseData: Course file does not exist:', coursePath);
        return null;
      }
      
      const courseData = fs.readFileSync(coursePath, 'utf8');
      console.log('getCourseData: Course file read successfully, size:', courseData.length);
      
      if (!courseData || courseData.trim() === '') {
        console.error('getCourseData: Course file is empty');
        return null;
      }
      
      const parsedCourse = JSON.parse(courseData);
      console.log('getCourseData: Course parsed successfully:', parsedCourse.title);
      console.log('getCourseData: Course has modules:', parsedCourse.modules?.length || 0);
      console.log('getCourseData: Course modules:', parsedCourse.modules);
      
      // Validate course structure
      if (!parsedCourse.modules || !Array.isArray(parsedCourse.modules) || parsedCourse.modules.length === 0) {
        console.error('getCourseData: Course has no valid modules');
        return null;
      }
      
      return parsedCourse;
    } catch (fsError) {
      console.error('getCourseData: FS fallback also failed:', fsError);
      return null;
    }
  }
}

// Generate metadata for dynamic course pages
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const course = await getCourseData(params.slug);
    
    if (!course) {
      return {
        title: 'Course Not Found - Hoodie Academy',
        description: 'The requested course could not be found.',
      };
    }
    
    return {
      title: `${course.title} - Hoodie Academy`,
      description: course.description,
      keywords: [
        course.title,
        course.squad,
        course.level,
        course.category,
        'Web3 education',
        'NFT academy',
        'crypto trading',
        'blockchain learning',
        'Hoodie Academy'
      ],
      openGraph: {
        title: `${course.title} - Hoodie Academy`,
        description: course.description,
        type: 'website',
        url: `https://hoodieacademy.xyz/courses/${params.slug}`,
        images: [
          {
            url: '/images/hoodie-academy-courses.png',
            width: 1200,
            height: 630,
            alt: `${course.title} - Hoodie Academy Course`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${course.title} - Hoodie Academy`,
        description: course.description,
        images: ['/images/hoodie-academy-courses.png'],
      },
      alternates: {
        canonical: `/courses/${params.slug}`,
      },
    };
  } catch (error) {
    return {
      title: 'Course Not Found - Hoodie Academy',
      description: 'The requested course could not be found.',
    };
  }
}

// Generate structured data for SEO
function generateStructuredData(course: any) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": course.title,
    "description": course.description,
    "provider": {
      "@type": "Organization",
      "name": "Hoodie Academy",
      "url": "https://hoodieacademy.xyz"
    },
    "courseMode": "online",
    "educationalLevel": course.level === 'beginner' ? 'Beginner' : course.level === 'intermediate' ? 'Intermediate' : 'Advanced',
    "inLanguage": "en-US",
    "isAccessibleForFree": course.access === 'free',
    "coursePrerequisites": course.level === 'intermediate' ? "Basic Web3 knowledge" : "No prerequisites",
    "teaches": course.modules.map((module: any) => module.title).join(', '),
    "hasCourseInstance": {
      "@type": "CourseInstance",
      "courseMode": "online",
      "inLanguage": "en-US"
    },
    "about": [
      {
        "@type": "Thing",
        "name": course.category
      },
      {
        "@type": "Thing", 
        "name": course.squad
      }
    ],
    "audience": {
      "@type": "Audience",
      "audienceType": course.squad
    },
    "learningResourceType": "Course",
    "educationalAlignment": {
      "@type": "AlignmentObject",
      "alignmentType": "teaches",
      "educationalFramework": "Web3 Education",
      "targetName": course.squad
    }
  };
}

export default async function CoursePage({ params }: { params: { slug: string } }) {
  try {
    console.log('CoursePage: Loading course with slug:', params.slug);
    console.log('CoursePage: Current working directory:', process.cwd());
    
    const course = await getCourseData(params.slug);
    
    if (!course) {
      console.error('CoursePage: Course not found for slug:', params.slug);
      notFound();
    }
    
    console.log('CoursePage: Course loaded successfully:', course.title);
    console.log('CoursePage: Course has modules:', course.modules?.length || 0);
    console.log('CoursePage: Course modules:', course.modules);
    console.log('CoursePage: Course ID:', course.id);
    
    return (
      <>
        {/* Structured Data for Course */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateStructuredData(course))
          }}
        />
        
        {/* Course Summary for AI/GPT Understanding */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CreativeWork",
              "name": course.title,
              "description": course.description,
              "summary": `A ${course.level} course explaining ${course.category} for ${course.squad} squad members. Includes ${course.modules.length} modules covering ${course.modules.map((m: any) => m.title).join(', ')}. Perfect for ${course.level} learners interested in ${course.category}.`,
              "keywords": `${course.title}, ${course.squad}, ${course.level}, ${course.category}, Web3 education, NFT academy, crypto trading`,
              "audience": {
                "@type": "Audience",
                "audienceType": `${course.level} ${course.squad} members`
              },
              "learningOutcome": course.modules.map((module: any) => module.description).join('. '),
              "teaches": course.modules.map((module: any) => module.title).join(', '),
              "educationalLevel": course.level,
              "isAccessibleForFree": course.access === 'free',
              "provider": {
                "@type": "Organization",
                "name": "Hoodie Academy",
                "url": "https://hoodieacademy.xyz"
              }
            })
          }}
        />
        
        <ErrorBoundary>
          <CoursePageClient course={course} />
        </ErrorBoundary>
      </>
    );
  } catch (error) {
    console.error('Error in course page:', error);
    notFound();
  }
} 