import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const coursePath = path.join(process.cwd(), 'public', 'courses', `${params.slug}.json`);
    
    if (!fs.existsSync(coursePath)) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const courseData = fs.readFileSync(coursePath, 'utf8');
    const course = JSON.parse(courseData);

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error loading course:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
