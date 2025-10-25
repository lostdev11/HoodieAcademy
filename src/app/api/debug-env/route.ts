import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    privyAppId: process.env.NEXT_PUBLIC_PRIVY_APP_ID ? 'Set' : 'Not Set',
    privyAppIdValue: process.env.NEXT_PUBLIC_PRIVY_APP_ID ? 
      `${process.env.NEXT_PUBLIC_PRIVY_APP_ID.substring(0, 10)}...` : 'undefined',
    nodeEnv: process.env.NODE_ENV,
    allPrivyVars: Object.keys(process.env).filter(key => key.includes('PRIVY'))
  });
}
