import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { notFound } from 'next/navigation';
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

export default function DecodersPage() {
  const courseDir = path.join(process.cwd(), 'public/courses');
  const files = fs.readdirSync(courseDir);
  const courses: Course[] = files
    .map((file) => {
      const content = fs.readFileSync(path.join(courseDir, file), 'utf-8');
      return JSON.parse(content);
    })
    .filter((course) => course.squad === 'Decoders');

  if (!courses.length) return notFound();

  return (
    <div className="p-6 max-w-5xl mx-auto bg-gradient-to-b from-[#fefce8] via-white to-[#ecfdf5] min-h-screen">
      <h1 className="text-4xl font-bold mb-6 text-emerald-800 drop-shadow-sm">📊 Hoodie Decoders Track</h1>
      <p className="mb-6 text-gray-700 text-lg">
        Decoders analyze trends, charts, and data to lead Hoodie Alpha strategy. These are your precision tools:
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Link key={course.slug} href={`/courses/${course.slug}`}>
            <div className="border rounded-lg p-4 bg-white hover:shadow-lg transition relative">
              <h2 className="text-xl font-semibold mb-2 text-green-900 font-mono">{course.title}</h2>
              <p className="text-sm text-gray-500 mb-2">Level: {course.level}</p>
              <ul className="text-sm text-gray-700 list-disc list-inside">
                {course.modules.slice(0, 3).map((mod, idx) => (
                  <li key={idx}><strong>{mod.title}</strong></li>
                ))}
              </ul>
              <CourseSchema
                title={course.title}
                description={course.modules[0].description}
                squad={course.squad}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 