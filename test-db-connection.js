// Simple script to test Supabase database connection
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');
  
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found in .env.local');
    process.exit(1);
  }
  
  console.log('📋 Connection String:', connectionString.substring(0, 30) + '...\n');
  
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000,
  });
  
  try {
    console.log('⏳ Attempting to connect...');
    const client = await pool.connect();
    console.log('✅ Connected successfully!\n');
    
    console.log('⏳ Testing query...');
    const result = await client.query('SELECT NOW() as current_time, version()');
    console.log('✅ Query successful!');
    console.log('📅 Current Time:', result.rows[0].current_time);
    console.log('🗄️  PostgreSQL Version:', result.rows[0].version.substring(0, 50) + '...\n');
    
    console.log('⏳ Checking if hotels table exists...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'hotels'
      );
    `);
    
    const hotelsExists = tableCheck.rows[0].exists;
    console.log(hotelsExists ? '✅ hotels table exists!' : '❌ hotels table does NOT exist\n');
    
    if (!hotelsExists) {
      console.log('💡 You need to create the tables in Supabase:');
      console.log('   1. Go to https://supabase.com/dashboard');
      console.log('   2. Open SQL Editor');
      console.log('   3. Copy SQL from database-schema.sql');
      console.log('   4. Paste and click Run\n');
    }
    
    client.release();
    await pool.end();
    
    console.log('═══════════════════════════════════════');
    console.log('✅ Database connection test PASSED!');
    console.log('═══════════════════════════════════════\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed!');
    console.error('Error:', error.message);
    console.error('\n💡 Possible issues:');
    console.error('   1. Supabase database is paused or inactive');
    console.error('   2. Wrong connection string');
    console.error('   3. Network/firewall blocking connection');
    console.error('   4. Supabase project was deleted\n');
    
    await pool.end();
    process.exit(1);
  }
}

testConnection();
