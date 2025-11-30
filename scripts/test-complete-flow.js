require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function testCompleteFlow() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 COMPLETE FLOW TEST\n');
    console.log('=' .repeat(60));

    // Step 1: Get all hotels
    console.log('\n📋 STEP 1: Get all hotels from database');
    const hotelsResult = await pool.query(`
      SELECT id, hotel_name, email, table_count 
      FROM hotels 
      ORDER BY hotel_name
    `);

    console.log(`Found ${hotelsResult.rows.length} hotels:\n`);
    hotelsResult.rows.forEach((hotel, idx) => {
      console.log(`${idx + 1}. ${hotel.hotel_name}`);
      console.log(`   Email: ${hotel.email}`);
      console.log(`   ID: ${hotel.id}`);
      console.log(`   Tables: ${hotel.table_count}`);
      console.log('');
    });

    // Step 2: For each hotel, simulate login and check orders
    console.log('\n' + '='.repeat(60));
    console.log('📋 STEP 2: Simulate login for each hotel and check orders\n');

    for (const hotel of hotelsResult.rows) {
      console.log(`\n🏨 Testing hotel: ${hotel.hotel_name} (${hotel.email})`);
      console.log('-'.repeat(60));

      // Simulate token generation (like login does)
      const token = jwt.sign(
        { userId: hotel.id, email: hotel.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Decode token to verify
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log(`✅ Token generated with userId: ${decoded.userId}`);

      // Query orders using the hotel_id from token (like API does)
      const ordersResult = await pool.query(`
        SELECT order_id, table_number, status, 
               jsonb_array_length(items) as item_count,
               created_at
        FROM orders 
        WHERE hotel_id = $1 AND status = 'OPEN'
        ORDER BY table_number
      `, [decoded.userId]);

      console.log(`📊 Found ${ordersResult.rows.length} OPEN orders for this hotel`);

      if (ordersResult.rows.length > 0) {
        console.log('\nOrders:');
        ordersResult.rows.forEach(order => {
          console.log(`  • Table ${order.table_number}: ${order.item_count} items (${order.status})`);
          console.log(`    Order ID: ${order.order_id}`);
          console.log(`    Created: ${order.created_at}`);
        });

        // Show which tables should be BUSY
        const busyTables = ordersResult.rows.map(o => o.table_number);
        console.log(`\n🔴 Tables that should show as BUSY: ${busyTables.join(', ')}`);
        
        // Show which tables should be FREE
        const allTables = Array.from({ length: hotel.table_count }, (_, i) => i + 1);
        const freeTables = allTables.filter(t => !busyTables.includes(t));
        console.log(`🟢 Tables that should show as FREE: ${freeTables.join(', ')}`);
      } else {
        console.log('🟢 All tables should show as FREE (no open orders)');
      }
    }

    // Step 3: Check for orphaned orders
    console.log('\n\n' + '='.repeat(60));
    console.log('📋 STEP 3: Check for orphaned orders (orders without matching hotel)\n');

    const allOrdersResult = await pool.query(`
      SELECT o.order_id, o.hotel_id, o.table_number, o.status
      FROM orders o
      LEFT JOIN hotels h ON o.hotel_id = h.id
      WHERE h.id IS NULL
    `);

    if (allOrdersResult.rows.length > 0) {
      console.log(`⚠️  Found ${allOrdersResult.rows.length} orphaned orders:`);
      allOrdersResult.rows.forEach(order => {
        console.log(`  • Order ${order.order_id} (Table ${order.table_number})`);
        console.log(`    Hotel ID: ${order.hotel_id} (DOES NOT EXIST)`);
      });
    } else {
      console.log('✅ No orphaned orders found');
    }

    // Step 4: Summary
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 SUMMARY\n');

    const totalOrders = await pool.query('SELECT COUNT(*) FROM orders WHERE status = \'OPEN\'');
    console.log(`Total OPEN orders in database: ${totalOrders.rows[0].count}`);
    console.log(`Total hotels in database: ${hotelsResult.rows.length}`);

    console.log('\n✅ Test complete!');
    console.log('\n💡 To see BUSY tables on dashboard:');
    console.log('   1. Log in with the hotel account that has OPEN orders');
    console.log('   2. Or create new orders while logged in as your current hotel');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

testCompleteFlow();
