#!/usr/bin/env node

/**
 * Complete verification of order-taking-billing setup
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function verifySetup() {
  console.log('🔍 Verifying Complete Order-Taking-Billing Setup\n');
  console.log('='.repeat(60));

  let allGood = true;

  try {
    // 1. Check all tables exist
    console.log('\n📋 Checking Database Tables...\n');
    
    const tables = ['hotels', 'menu_items', 'invoices', 'invoice_items', 'orders', 'audit_logs', 'reports'];
    for (const table of tables) {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      
      if (result.rows[0].exists) {
        console.log(`✅ ${table} table exists`);
      } else {
        console.log(`❌ ${table} table NOT found`);
        allGood = false;
      }
    }

    // 2. Check invoices extensions
    console.log('\n📋 Checking Invoices Table Extensions...\n');
    
    const invoicesCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invoices' 
      AND column_name IN ('order_id', 's3_json_path', 's3_pdf_path');
    `);

    const columns = invoicesCheck.rows.map(r => r.column_name);
    console.log(columns.includes('order_id') ? '✅ invoices.order_id' : '❌ invoices.order_id NOT found');
    console.log(columns.includes('s3_json_path') ? '✅ invoices.s3_json_path' : '❌ invoices.s3_json_path NOT found');
    console.log(columns.includes('s3_pdf_path') ? '✅ invoices.s3_pdf_path' : '❌ invoices.s3_pdf_path NOT found');

    if (columns.length !== 3) allGood = false;

    // 3. Check orders table structure
    console.log('\n📋 Checking Orders Table Structure...\n');
    
    const ordersColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders'
      ORDER BY ordinal_position;
    `);

    const requiredColumns = ['order_id', 'hotel_id', 'table_number', 'items', 'status', 'version', 'locked_by', 'lock_expires_at'];
    for (const col of requiredColumns) {
      const found = ordersColumns.rows.find(r => r.column_name === col);
      if (found) {
        console.log(`✅ orders.${col} (${found.data_type})`);
      } else {
        console.log(`❌ orders.${col} NOT found`);
        allGood = false;
      }
    }

    // 4. Check indexes
    console.log('\n📋 Checking Indexes...\n');
    
    const indexes = await pool.query(`
      SELECT tablename, indexname
      FROM pg_indexes 
      WHERE schemaname = 'public'
        AND tablename IN ('orders', 'audit_logs', 'reports')
      ORDER BY tablename, indexname;
    `);

    console.log(`Found ${indexes.rows.length} indexes on orders, audit_logs, and reports tables`);
    indexes.rows.forEach(row => {
      console.log(`  ✅ ${row.tablename}.${row.indexname}`);
    });

    // 5. Test order creation (if hotel exists)
    console.log('\n📋 Testing Order Functionality...\n');
    
    const hotelCheck = await pool.query('SELECT id, hotel_name FROM hotels LIMIT 1');
    
    if (hotelCheck.rows.length > 0) {
      const testHotel = hotelCheck.rows[0];
      console.log(`✅ Found test hotel: ${testHotel.hotel_name}`);
      
      // Check if there are any open orders
      const openOrders = await pool.query(`
        SELECT COUNT(*) as count FROM orders 
        WHERE hotel_id = $1 AND status = 'OPEN'
      `, [testHotel.id]);
      
      console.log(`✅ Open orders for this hotel: ${openOrders.rows[0].count}`);
      
      // Check if there are any billed orders
      const billedOrders = await pool.query(`
        SELECT COUNT(*) as count FROM orders 
        WHERE hotel_id = $1 AND status = 'BILLED'
      `, [testHotel.id]);
      
      console.log(`✅ Billed orders for this hotel: ${billedOrders.rows[0].count}`);
    } else {
      console.log('⚠️  No hotels found in database. Please sign up first.');
    }

    // 6. Check API endpoints exist
    console.log('\n📋 Checking API Files...\n');
    
    const fs = require('fs');
    const path = require('path');
    
    const apiFiles = [
      'app/api/orders/route.ts',
      'app/api/orders/[order_id]/route.ts',
      'app/orders/page.tsx',
      'app/dashboard/page.tsx',
      'lib/services/orderService.ts'
    ];
    
    for (const file of apiFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}`);
      } else {
        console.log(`❌ ${file} NOT found`);
        allGood = false;
      }
    }

    console.log('\n' + '='.repeat(60));

    if (allGood) {
      console.log('\n✅ ALL CHECKS PASSED!');
      console.log('\n📋 Your order-taking-billing system is ready!');
      console.log('\n🌐 Access your application at: http://localhost:8000');
      console.log('\n📝 How to use:');
      console.log('  1. Go to Dashboard: http://localhost:8000/dashboard');
      console.log('  2. Click on any table to take an order');
      console.log('  3. Add menu items to the cart');
      console.log('  4. Save the order - table will show as BUSY');
      console.log('  5. Return to dashboard - BUSY tables appear in red');
      console.log('  6. Click BUSY table in Billing Section to generate bill');
      console.log('  7. After billing, table returns to FREE status');
    } else {
      console.log('\n⚠️  SOME CHECKS FAILED');
      console.log('\nTo fix issues:');
      console.log('  1. Run migrations: node scripts/run-individual-migrations.js');
      console.log('  2. Restart the dev server: npm run dev');
      console.log('  3. Check DATABASE_URL in .env.local');
    }

  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    allGood = false;
  } finally {
    await pool.end();
  }

  process.exit(allGood ? 0 : 1);
}

verifySetup();
