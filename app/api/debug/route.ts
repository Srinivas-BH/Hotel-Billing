import { NextResponse } from 'next/server';

export async function GET() {
  // Debug endpoint to check environment variables (without exposing secrets)
  return NextResponse.json({
    hasDatabase: !!process.env.DATABASE_URL,
    hasJWT: !!process.env.JWT_SECRET,
    hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
    nodeEnv: process.env.NODE_ENV,
    databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + '...',
  });
}
