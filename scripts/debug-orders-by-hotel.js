require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function debugOrders() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Checking all orders in database...\n');

    // Get all orders
    const ordersResult = await pool.query(`
      SELECT order_id, hotel_id, table_number, status, created_at, 
             jsonb_array_length(items) as item_count
      FROM orders 
      ORDER BY created_at DESC
    `);

    console.log(`📊 Total orders in database: ${ordersResult.rows.length}\n`);

    if (ordersResult.rows.length > 0) {
      console.log('All orders:');
      ordersResult.rows.forEach(order => {
        console.log(`  - Order ID: ${order.order_id}`);
        console.log(`    Hotel ID: ${order.hotel_id}`);
        console.log(`    Table: ${order.table_number}`);
        console.log(`    Status: ${order.status}`);
        console.log(`    Items: ${order.item_count}`);
        console.log(`    Created: ${order.created_at}`);
        console.log('');
      });
    }

    // Get all hotels
    console.log('\n🏨 Checking all hotels in database...\n');
    const hotelsResult = await pool.query(`
      SELECT id as hotel_id, hotel_name, email 
      FROM hotels 
      ORDER BY hotel_name
    `);

    console.log(`📊 Total hotels: ${hotelsResult.rows.length}\n`);
    hotelsResult.rows.forEach(hotel => {
      console.log(`  - Hotel: ${hotel.hotel_name}`);
      console.log(`    ID: ${hotel.hotel_id}`);
      console.log(`    Email: ${hotel.email}`);
      console.log('');
    });

    // Match orders to hotels
    console.log('\n🔗 Matching orders to hotels...\n');
    for (const order of ordersResult.rows) {
      const hotel = hotelsResult.rows.find(h => h.hotel_id === order.hotel_id);
      if (hotel) {
        console.log(`  ✅ Order ${order.order_id} (Table ${order.table_number}, ${order.status})`);
        console.log(`     belongs to: ${hotel.hotel_name} (${hotel.email})`);
      } else {
        console.log(`  ❌ Order ${order.order_id} has unknown hotel_id: ${order.hotel_id}`);
      }
    }

    // Show OPEN orders by hotel
    console.log('\n\n📋 OPEN Orders by Hotel:\n');
    for (const hotel of hotelsResult.rows) {
      const hotelOrders = ordersResult.rows.filter(
        o => o.hotel_id === hotel.hotel_id && o.status === 'OPEN'
      );
      console.log(`  ${hotel.hotel_name} (${hotel.email}):`);
      if (hotelOrders.length > 0) {
        hotelOrders.forEach(order => {
          console.log(`    - Table ${order.table_number}: ${order.item_count} items`);
        });
      } else {
        console.log(`    - No open orders`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

debugOrders();
