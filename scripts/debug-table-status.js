#!/usr/bin/env node

/**
 * Comprehensive debugging for table status issue
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function debugTableStatus() {
  console.log('🔍 DEBUGGING TABLE STATUS ISSUE\n');
  console.log('='.repeat(70));

  try {
    // 1. Check hotels
    console.log('\n1️⃣ Checking Hotels:\n');
    const hotels = await pool.query('SELECT id, email, hotel_name FROM hotels');
    
    if (hotels.rows.length === 0) {
      console.log('❌ No hotels found! Please sign up first.');
      return;
    }
    
    hotels.rows.forEach((hotel, index) => {
      console.log(`   ${index + 1}. ${hotel.hotel_name} (${hotel.email})`);
      console.log(`      Hotel ID: ${hotel.id}`);
    });

    const hotelId = hotels.rows[0].id;
    console.log(`\n   Using Hotel ID: ${hotelId} for testing`);

    // 2. Check orders for this hotel
    console.log('\n' + '='.repeat(70));
    console.log('\n2️⃣ Checking Orders for this Hotel:\n');
    
    const orders = await pool.query(`
      SELECT 
        order_id,
        table_number,
        status,
        version,
        items,
        created_at,
        updated_at
      FROM orders
      WHERE hotel_id = $1
      ORDER BY created_at DESC;
    `, [hotelId]);

    if (orders.rows.length === 0) {
      console.log('   ℹ️  No orders found for this hotel.');
      console.log('   This is normal if you haven\'t created any orders yet.');
    } else {
      orders.rows.forEach((order, index) => {
        const statusIcon = order.status === 'OPEN' ? '🔴 BUSY' : '🟢 FREE';
        let itemCount = 0;
        
        try {
          const items = typeof order.items === 'string' 
            ? JSON.parse(order.items) 
            : order.items;
          itemCount = Array.isArray(items) ? items.length : 0;
        } catch (e) {
          itemCount = 0;
        }

        console.log(`   ${index + 1}. Table ${order.table_number} ${statusIcon}`);
        console.log(`      Order ID: ${order.order_id}`);
        console.log(`      Status: ${order.status}`);
        console.log(`      Items: ${itemCount}`);
        console.log(`      Version: ${order.version}`);
        console.log(`      Created: ${new Date(order.created_at).toLocaleString()}`);
        console.log(`      Updated: ${new Date(order.updated_at).toLocaleString()}`);
        console.log('');
      });
    }

    // 3. Check OPEN orders specifically
    console.log('='.repeat(70));
    console.log('\n3️⃣ OPEN Orders (Tables that SHOULD be BUSY):\n');
    
    const openOrders = await pool.query(`
      SELECT table_number, order_id, status
      FROM orders
      WHERE hotel_id = $1 AND status = 'OPEN'
      ORDER BY table_number;
    `, [hotelId]);

    if (openOrders.rows.length === 0) {
      console.log('   ℹ️  No OPEN orders found.');
      console.log('   All tables should show as FREE (GREEN) on dashboard.');
    } else {
      console.log(`   Found ${openOrders.rows.length} OPEN orders:\n`);
      openOrders.rows.forEach(order => {
        console.log(`   🔴 Table ${order.table_number} - Order: ${order.order_id}`);
      });
      console.log(`\n   ✅ These tables SHOULD show as BUSY (RED) on dashboard!`);
    }

    // 4. Test API response format
    console.log('\n' + '='.repeat(70));
    console.log('\n4️⃣ Testing API Response Format:\n');
    
    const apiOrders = await pool.query(`
      SELECT 
        order_id,
        hotel_id,
        table_number,
        items,
        notes,
        status,
        version,
        created_at,
        updated_at
      FROM orders
      WHERE hotel_id = $1 AND status = 'OPEN'
      LIMIT 1;
    `, [hotelId]);

    if (apiOrders.rows.length > 0) {
      const sampleOrder = apiOrders.rows[0];
      console.log('   Sample OPEN order (as API would return it):\n');
      console.log(JSON.stringify({
        order_id: sampleOrder.order_id,
        hotel_id: sampleOrder.hotel_id,
        table_number: sampleOrder.table_number,
        status: sampleOrder.status,
        version: sampleOrder.version,
        items: sampleOrder.items,
        created_at: sampleOrder.created_at
      }, null, 2));
    }

    // 5. Summary and recommendations
    console.log('\n' + '='.repeat(70));
    console.log('\n5️⃣ SUMMARY & RECOMMENDATIONS:\n');
    
    const totalOrders = orders.rows.length;
    const openCount = openOrders.rows.length;
    const billedCount = totalOrders - openCount;

    console.log(`   📊 Total Orders: ${totalOrders}`);
    console.log(`   🔴 OPEN Orders: ${openCount} (should be BUSY)`);
    console.log(`   🟢 BILLED Orders: ${billedCount} (should be FREE)`);

    console.log('\n   🔍 Troubleshooting Steps:\n');
    
    if (openCount === 0) {
      console.log('   1. ✅ No OPEN orders - all tables should be FREE');
      console.log('   2. Create a new order to test BUSY status');
      console.log('   3. Go to: http://localhost:8000/orders');
      console.log('   4. Select a table, add items, and save');
      console.log('   5. Return to dashboard - table should be RED');
    } else {
      console.log(`   1. ✅ Found ${openCount} OPEN orders in database`);
      console.log('   2. These tables SHOULD show as BUSY (RED) on dashboard');
      console.log('   3. If not showing:');
      console.log('      a. Hard refresh dashboard (Ctrl+Shift+R)');
      console.log('      b. Check browser console for errors (F12)');
      console.log('      c. Verify you\'re logged in with correct account');
      console.log('      d. Check localStorage token matches hotel_id');
      console.log('      e. Clear browser cache and cookies');
    }

    console.log('\n   📝 To test the complete flow:');
    console.log('   1. Go to: http://localhost:8000/dashboard');
    console.log('   2. Click a GREEN table');
    console.log('   3. Add items and click "Save Order"');
    console.log('   4. Return to dashboard');
    console.log('   5. Table should now be RED (BUSY)');
    console.log('   6. Click RED table in Billing Section');
    console.log('   7. Generate bill');
    console.log('   8. Table should return to GREEN (FREE)');

    console.log('\n' + '='.repeat(70));
    console.log('\n✅ Debug complete!\n');

  } catch (error) {
    console.error('\n❌ Error during debugging:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

debugTableStatus();
