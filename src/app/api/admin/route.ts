import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Admin API endpoint',
    available: [
      '/api/admin/courses',
      '/api/admin/bulk-import-courses',
      '/api/admin/users',
      '/api/admin/submissions',
      '/api/admin/course-stats'
    ]
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    error: 'Use specific admin endpoints',
    available: [
      '/api/admin/courses',
      '/api/admin/bulk-import-courses',
      '/api/admin/users',
      '/api/admin/submissions'
    ]
  }, { status: 400 });
}
