import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'submissions.json');
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json([]);
    }

    const submissions = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return NextResponse.json(submissions);
  } catch (error) {
    console.error('[FETCH SUBMISSIONS ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 