import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Profile test route is working!' });
}

export async function POST() {
  return NextResponse.json({ message: 'Profile test POST route is working!' });
}
