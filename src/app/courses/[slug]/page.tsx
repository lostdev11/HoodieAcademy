import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CoursePageClient from './CoursePageClient';

// Generate metadata for each course
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/courses/${params.slug}.json?v=${Date.now()}`);
    
    if (!response.ok) {
      return {
        title: 'Course Not Found',
        description: 'The requested course could not be found.',
      };
    }

    const course = await response.json();
    
    return {
      title: course.title,
      description: `Learn ${course.title} inside Hoodie Academy – Squad: ${course.squad}. ${course.description}`,
      keywords: [
        course.title.toLowerCase(),
        course.squad.toLowerCase(),
        course.level,
        'Web3 education',
        'NFT academy',
        'crypto trading',
        'blockchain learning',
        'Hoodie Academy',
        course.category,
        ...course.modules[0]?.description?.split(' ').slice(0, 10) || []
      ],
      openGraph: {
        title: course.title,
        description: `A ${course.level} course for ${course.squad}. ${course.description}`,
        type: 'article',
        url: `https://hoodieacademy.xyz/courses/${params.slug}`,
        images: [
          {
            url: `/images/course-${params.slug}.png`,
            width: 1200,
            height: 630,
            alt: `${course.title} - Hoodie Academy Course`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: course.title,
        description: `A ${course.level} course for ${course.squad}. ${course.description}`,
        images: [`/images/course-${params.slug}.png`],
      },
      alternates: {
        canonical: `/courses/${params.slug}`,
      },
    };
  } catch (error) {
    return {
      title: 'Course Not Found',
      description: 'The requested course could not be found.',
    };
  }
}

// Generate structured data for the course
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
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/courses/${params.slug}.json?v=${Date.now()}`);
    
    if (!response.ok) {
      notFound();
    }

    const course = await response.json();
    
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
        
        <CoursePageClient course={course} />
      </>
    );
  } catch (error) {
    notFound();
  }
} 