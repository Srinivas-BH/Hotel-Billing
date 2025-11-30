require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function diagnose() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('\n🔍 TABLE STATUS DIAGNOSTIC REPORT');
    console.log('='.repeat(70));

    // Get all hotels and their orders
    const hotels = await pool.query(`
      SELECT id, hotel_name, email, table_count 
      FROM hotels 
      ORDER BY hotel_name
    `);

    console.log(`\n📊 Found ${hotels.rows.length} hotel(s) in database\n`);

    for (const hotel of hotels.rows) {
      console.log('─'.repeat(70));
      console.log(`\n🏨 HOTEL: ${hotel.hotel_name}`);
      console.log(`   Email: ${hotel.email}`);
      console.log(`   ID: ${hotel.id}`);
      console.log(`   Total Tables: ${hotel.table_count}`);

      // Get open orders for this hotel
      const orders = await pool.query(`
        SELECT order_id, table_number, status, items,
               created_at, updated_at
        FROM orders 
        WHERE hotel_id = $1 AND status = 'OPEN'
        ORDER BY table_number
      `, [hotel.id]);

      console.log(`\n   📋 Open Orders: ${orders.rows.length}`);

      if (orders.rows.length > 0) {
        console.log('\n   BUSY Tables (should show RED):');
        orders.rows.forEach(order => {
          const items = Array.isArray(order.items) ? order.items : [];
          console.log(`   🔴 Table ${order.table_number}`);
          console.log(`      - Order ID: ${order.order_id}`);
          console.log(`      - Items: ${items.length}`);
          console.log(`      - Created: ${new Date(order.created_at).toLocaleString()}`);
        });

        // Calculate FREE tables
        const busyTables = orders.rows.map(o => o.table_number);
        const allTables = Array.from({ length: hotel.table_count }, (_, i) => i + 1);
        const freeTables = allTables.filter(t => !busyTables.includes(t));

        if (freeTables.length > 0) {
          console.log(`\n   FREE Tables (should show GREEN): ${freeTables.join(', ')}`);
        }
      } else {
        console.log(`\n   🟢 All ${hotel.table_count} tables are FREE (no open orders)`);
      }

      console.log('');
    }

    console.log('='.repeat(70));
    console.log('\n💡 TROUBLESHOOTING GUIDE:\n');
    console.log('If dashboard shows all tables as GREEN but orders exist:');
    console.log('');
    console.log('1. CHECK YOUR LOGIN:');
    console.log('   - Open: http://localhost:8000/test-login-status.html');
    console.log('   - Verify which hotel account you\'re logged in as');
    console.log('');
    console.log('2. VERIFY TOKEN:');
    console.log('   - Open browser DevTools (F12)');
    console.log('   - Go to Console tab');
    console.log('   - Type: localStorage.getItem("auth_token")');
    console.log('   - Check if token exists');
    console.log('');
    console.log('3. CHECK DASHBOARD LOGS:');
    console.log('   - Open dashboard page');
    console.log('   - Open browser DevTools Console');
    console.log('   - Look for logs starting with "📊 Dashboard:"');
    console.log('   - Check how many orders are being received');
    console.log('');
    console.log('4. SOLUTION:');
    console.log('   - If logged in as hotel with no orders: Create a new order');
    console.log('   - If logged in as wrong hotel: Logout and login with correct account');
    console.log('');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

diagnose();
