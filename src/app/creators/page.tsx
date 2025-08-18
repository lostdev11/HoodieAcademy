import fs from 'fs';
import path from 'path';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  badge: string;
  emoji: string;
  squad: string;
  category: string;
  level: string;
  access: string;
  modules: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
}

async function getCreatorsCourses(): Promise<Course[]> {
  const coursesDir = path.join(process.cwd(), 'public', 'courses');
  const courseFiles = fs.readdirSync(coursesDir);
  
  const creatorsCourses: Course[] = [];
  
  for (const file of courseFiles) {
    if (file.endsWith('.json')) {
      const filePath = path.join(coursesDir, file);
      const courseData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      
      if (courseData.squad === 'Creators') {
        creatorsCourses.push(courseData);
      }
    }
  }
  
  // Sort by level (beginner first) and then by title
  return creatorsCourses.sort((a, b) => {
    if (a.level === 'beginner' && b.level !== 'beginner') return -1;
    if (b.level === 'beginner' && a.level !== 'beginner') return 1;
    return a.title.localeCompare(b.title);
  });
}

export default async function CreatorsPage() {
  const courses = await getCreatorsCourses();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            🎨 Hoodie Creators
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Master the visual arts of Web3. From pixel art to meme creation, 
            learn to craft compelling content that builds communities and spreads lore.
          </p>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link key={course.id} href={`/courses/${course.slug}`}>
              <Card className="bg-slate-800/50 border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300 hover:scale-105 cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl">{course.emoji}</span>
                    <div className="flex gap-2">
                      <Badge 
                        variant="outline" 
                        className={`border-${course.level === 'beginner' ? 'green' : course.level === 'intermediate' ? 'yellow' : 'red'}-500 text-${course.level === 'beginner' ? 'green' : course.level === 'intermediate' ? 'yellow' : 'red'}-400`}
                      >
                        {course.level}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`border-${course.access === 'free' ? 'green' : 'purple'}-500 text-${course.access === 'free' ? 'green' : 'purple'}-400`}
                      >
                        {course.access}
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="text-xl text-white group-hover:text-cyan-400 transition-colors">
                    {course.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4 line-clamp-3">
                    {course.description}
                  </p>
                  
                  {/* First 3 modules */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-cyan-400 mb-2">
                      Modules:
                    </h4>
                    {course.modules.slice(0, 3).map((module, index) => (
                      <div key={module.id} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                        <span className="text-sm text-gray-400">
                          {module.title}
                        </span>
                      </div>
                    ))}
                    {course.modules.length > 3 && (
                      <div className="text-xs text-gray-500 mt-2">
                        +{course.modules.length - 3} more modules
                      </div>
                    )}
                  </div>
                  
                  {/* Badge */}
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <Badge className="bg-gradient-to-r from-purple-600 to-cyan-600">
                      {course.badge}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <div className="bg-slate-800/50 border border-cyan-500/30 rounded-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4">
              Ready to Create?
            </h2>
            <p className="text-gray-300 mb-6">
              Start with the fundamentals and work your way up to advanced techniques. 
              Each course builds on the previous one, creating a comprehensive creative education.
            </p>
            <Link href="/tracks">
              <button className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105">
                Explore All Tracks
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 