import { NextResponse } from 'next/server';

export async function GET() {
  const envCheck = {
    hasDatabase: !!process.env.DATABASE_URL,
    hasJWT: !!process.env.JWT_SECRET,
    hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
    nodeEnv: process.env.NODE_ENV,
    databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 20) + '...',
  };

  // Test database connection
  let dbStatus = 'not_tested';
  let dbError = null;

  try {
    const { query } = await import('@/lib/db');
    const result = await query('SELECT NOW() as current_time');
    dbStatus = 'connected';
    dbError = null;
  } catch (error) {
    dbStatus = 'error';
    dbError = error instanceof Error ? error.message : String(error);
  }

  return NextResponse.json({
    ...envCheck,
    databaseConnection: dbStatus,
    databaseError: dbError,
  });
}
