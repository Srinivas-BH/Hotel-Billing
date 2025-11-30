#!/usr/bin/env node

/**
 * Check current order status in database
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkOrderStatus() {
  console.log('🔍 Checking Order Status in Database\n');
  console.log('='.repeat(60));

  try {
    // Get all orders
    const allOrders = await pool.query(`
      SELECT 
        order_id,
        hotel_id,
        table_number,
        status,
        version,
        created_at,
        updated_at,
        jsonb_array_length(items) as item_count
      FROM orders
      ORDER BY created_at DESC
      LIMIT 10;
    `);

    console.log(`\n📋 Recent Orders (Last 10):\n`);
    
    if (allOrders.rows.length === 0) {
      console.log('No orders found in database.');
    } else {
      allOrders.rows.forEach((order, index) => {
        const statusIcon = order.status === 'OPEN' ? '🔴' : '🟢';
        console.log(`${index + 1}. Table ${order.table_number} ${statusIcon}`);
        console.log(`   Order ID: ${order.order_id}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Items: ${order.item_count}`);
        console.log(`   Version: ${order.version}`);
        console.log(`   Created: ${new Date(order.created_at).toLocaleString()}`);
        console.log(`   Updated: ${new Date(order.updated_at).toLocaleString()}`);
        console.log('');
      });
    }

    // Get OPEN orders count
    const openCount = await pool.query(`
      SELECT COUNT(*) as count FROM orders WHERE status = 'OPEN';
    `);

    // Get BILLED orders count
    const billedCount = await pool.query(`
      SELECT COUNT(*) as count FROM orders WHERE status = 'BILLED';
    `);

    console.log('='.repeat(60));
    console.log(`\n📊 Order Statistics:\n`);
    console.log(`🔴 OPEN Orders (Tables should be BUSY): ${openCount.rows[0].count}`);
    console.log(`🟢 BILLED Orders (Tables should be FREE): ${billedCount.rows[0].count}`);

    // Get tables with OPEN orders
    const busyTables = await pool.query(`
      SELECT table_number, order_id, created_at
      FROM orders
      WHERE status = 'OPEN'
      ORDER BY table_number;
    `);

    if (busyTables.rows.length > 0) {
      console.log(`\n🔴 BUSY Tables (should show RED on dashboard):\n`);
      busyTables.rows.forEach(table => {
        console.log(`   Table ${table.table_number} - Order: ${table.order_id}`);
      });
    } else {
      console.log(`\n🟢 All tables are FREE (no OPEN orders)`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Status check complete!');
    console.log('\nIf tables are not showing as BUSY on dashboard:');
    console.log('  1. Refresh the dashboard page');
    console.log('  2. Check browser console for errors');
    console.log('  3. Verify you\'re logged in with the correct account');
    console.log('  4. Check that hotel_id matches between orders and your login');

  } catch (error) {
    console.error('\n❌ Error checking order status:', error.message);
  } finally {
    await pool.end();
  }
}

checkOrderStatus();
