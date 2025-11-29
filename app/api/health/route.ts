import { NextResponse } from 'next/server';

export async function GET() {
  // Simple health check without database connection
  // This ensures Render can verify the app is running
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}

// Optional: Add a separate endpoint for database health check
export async function POST() {
  try {
    const { testConnection } = await import('@/lib/db');
    const isConnected = await testConnection();
    
    if (isConnected) {
      return NextResponse.json({
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json({
        status: 'unhealthy',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      }, { status: 503 });
    }
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      database: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
