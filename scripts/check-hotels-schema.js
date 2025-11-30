require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function checkSchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Check hotels table schema
    const hotelsSchema = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name='hotels' 
      ORDER BY ordinal_position
    `);

    console.log('🏨 Hotels table columns:');
    hotelsSchema.rows.forEach(c => {
      console.log(`  - ${c.column_name}: ${c.data_type}`);
    });

    // Get all hotels
    const hotels = await pool.query('SELECT * FROM hotels LIMIT 5');
    console.log('\n📊 Hotels in database:');
    hotels.rows.forEach(h => {
      console.log(`  - ${JSON.stringify(h)}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkSchema();
