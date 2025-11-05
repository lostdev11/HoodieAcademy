import Head from 'next/head';

interface CourseSchemaProps {
  title: string;
  description: string;
  squad: string;
  level?: string;
  category?: string;
  modules?: Array<{
    title: string;
    description?: string;
  }>;
  access?: string;
}

export default function CourseSchema({ 
  title, 
  description, 
  squad, 
  level = 'beginner',
  category = 'Web3',
  modules = [],
  access = 'free'
}: CourseSchemaProps) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": title,
    "description": description,
    "provider": {
      "@type": "Organization",
      "name": "Hoodie Academy",
      "url": "https://hoodieacademy.com"
    },
    "courseMode": "online",
    "educationalLevel": level === 'beginner' ? 'Beginner' : level === 'intermediate' ? 'Intermediate' : 'Advanced',
    "inLanguage": "en-US",
    "isAccessibleForFree": access === 'free',
    "coursePrerequisites": level === 'intermediate' ? "Basic Web3 knowledge" : "No prerequisites",
    "teaches": modules.map(module => module.title).join(', '),
    "hasCourseInstance": {
      "@type": "CourseInstance",
      "courseMode": "online",
      "inLanguage": "en-US"
    },
    "about": [
      {
        "@type": "Thing",
        "name": category
      },
      {
        "@type": "Thing", 
        "name": squad
      }
    ],
    "audience": {
      "@type": "Audience",
      "audienceType": squad
    },
    "learningResourceType": "Course",
    "educationalAlignment": {
      "@type": "AlignmentObject",
      "alignmentType": "teaches",
      "educationalFramework": "Web3 Education",
      "targetName": squad
    }
  };

  // Additional structured data for AI/GPT understanding
  const aiStructuredData = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "name": title,
    "description": description,
    "summary": `A ${level} course explaining ${category} for ${squad} squad members. Includes ${modules.length} modules covering ${modules.map(m => m.title).join(', ')}. Perfect for ${level} learners interested in ${category}.`,
    "keywords": `${title}, ${squad}, ${level}, ${category}, Web3 education, NFT academy, crypto trading`,
    "audience": {
      "@type": "Audience",
      "audienceType": `${level} ${squad} members`
    },
    "learningOutcome": modules.map(module => module.description).join('. '),
    "teaches": modules.map(module => module.title).join(', '),
    "educationalLevel": level,
    "isAccessibleForFree": access === 'free',
    "provider": {
      "@type": "Organization",
      "name": "Hoodie Academy",
      "url": "https://hoodieacademy.xyz"
    }
  };

  return (
    <Head>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(aiStructuredData)}
      </script>
    </Head>
  );
} 