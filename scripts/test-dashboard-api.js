#!/usr/bin/env node

/**
 * Test the dashboard API to see what data it returns
 */

const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function testDashboardAPI() {
  console.log('🔍 Testing Dashboard API\n');
  console.log('='.repeat(60));

  try {
    // You need to provide a valid token
    console.log('\n⚠️  To test the API, you need a valid JWT token.');
    console.log('Please follow these steps:\n');
    console.log('1. Open your browser');
    console.log('2. Go to: http://localhost:8000/dashboard');
    console.log('3. Open Developer Tools (F12)');
    console.log('4. Go to Console tab');
    console.log('5. Type: localStorage.getItem("token")');
    console.log('6. Copy the token value');
    console.log('\nThen run this script with the token:');
    console.log('node scripts/test-dashboard-api.js YOUR_TOKEN_HERE\n');

    const token = process.argv[2];

    if (!token) {
      console.log('❌ No token provided. Exiting...\n');
      return;
    }

    console.log('✅ Token provided, testing API...\n');

    // Test the orders API
    const response = await fetch('http://localhost:8000/api/orders', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.log(`❌ API returned error: ${response.status} ${response.statusText}`);
      const errorData = await response.json().catch(() => ({}));
      console.log('Error details:', errorData);
      return;
    }

    const data = await response.json();
    console.log('✅ API Response received!\n');
    console.log('='.repeat(60));
    console.log('\n📊 Orders Data:\n');
    console.log(JSON.stringify(data, null, 2));

    if (data.orders && Array.isArray(data.orders)) {
      console.log('\n='.repeat(60));
      console.log(`\n📋 Found ${data.orders.length} orders:\n`);
      
      data.orders.forEach((order, index) => {
        const statusIcon = order.status === 'OPEN' ? '🔴' : '🟢';
        console.log(`${index + 1}. Table ${order.table_number} ${statusIcon}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Order ID: ${order.order_id}`);
        
        let itemCount = 0;
        if (order.items) {
          if (typeof order.items === 'string') {
            try {
              const parsed = JSON.parse(order.items);
              itemCount = Array.isArray(parsed) ? parsed.length : 0;
            } catch (e) {
              itemCount = 0;
            }
          } else if (Array.isArray(order.items)) {
            itemCount = order.items.length;
          }
        }
        console.log(`   Items: ${itemCount}`);
        console.log('');
      });

      const openOrders = data.orders.filter(o => o.status === 'OPEN');
      console.log('='.repeat(60));
      console.log(`\n🔴 OPEN Orders (should show as BUSY): ${openOrders.length}`);
      console.log(`🟢 Other Orders: ${data.orders.length - openOrders.length}`);
    }

  } catch (error) {
    console.error('\n❌ Error testing API:', error.message);
  }
}

testDashboardAPI();
