import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { query } = await import('@/lib/db');
    
    // Check all required tables
    const tablesToCheck = ['hotels', 'menu_items', 'invoices', 'invoice_items', 'orders', 'audit_logs'];
    
    const tableCheck = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = ANY($1::text[])
      ORDER BY table_name;
    `, [tablesToCheck]);
    
    const existingTables = tableCheck.rows.map((row: any) => row.table_name);
    const missingTables = tablesToCheck.filter(table => !existingTables.includes(table));
    
    // Check database connection
    const connectionTest = await query('SELECT NOW() as current_time, version() as pg_version');
    
    return NextResponse.json({
      databaseConnected: true,
      currentTime: connectionTest.rows[0].current_time,
      pgVersion: connectionTest.rows[0].pg_version?.substring(0, 50),
      tables: {
        existing: existingTables,
        missing: missingTables,
        allExist: missingTables.length === 0
      },
      message: missingTables.length === 0
        ? 'Database is fully configured!' 
        : `Missing tables: ${missingTables.join(', ')}. Run migrations with: npm run migrate`,
    });
  } catch (error: any) {
    return NextResponse.json({
      databaseConnected: false,
      error: error instanceof Error ? error.message : String(error),
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      message: error.message?.includes('DATABASE_URL') 
        ? 'DATABASE_URL not configured. Please set it in .env.local'
        : 'Database connection failed. Check your DATABASE_URL configuration.',
    }, { status: 500 });
  }
}
