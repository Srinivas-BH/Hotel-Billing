import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { query } = await import('@/lib/db');
    
    // Check if hotels table exists
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'hotels'
      );
    `);
    
    const hotelsTableExists = tableCheck.rows[0].exists;
    
    // If table exists, check its structure
    let tableStructure = null;
    if (hotelsTableExists) {
      const structureCheck = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'hotels'
        ORDER BY ordinal_position;
      `);
      tableStructure = structureCheck.rows;
    }
    
    return NextResponse.json({
      databaseConnected: true,
      hotelsTableExists,
      tableStructure,
      message: hotelsTableExists 
        ? 'Database is ready!' 
        : 'Database connected but tables need to be created',
    });
  } catch (error) {
    return NextResponse.json({
      databaseConnected: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
