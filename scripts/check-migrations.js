#!/usr/bin/env node

/**
 * Check if migrations have been applied
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkMigrations() {
  console.log('🔍 Checking migration status...\n');

  try {
    // Check for orders table
    const ordersCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'orders'
      );
    `);

    const ordersExists = ordersCheck.rows[0].exists;
    console.log(ordersExists ? '✅ orders table exists' : '❌ orders table NOT found');

    // Check for audit_logs table
    const auditCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_logs'
      );
    `);

    const auditExists = auditCheck.rows[0].exists;
    console.log(auditExists ? '✅ audit_logs table exists' : '❌ audit_logs table NOT found');

    // Check for reports table
    const reportsCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'reports'
      );
    `);

    const reportsExists = reportsCheck.rows[0].exists;
    console.log(reportsExists ? '✅ reports table exists' : '❌ reports table NOT found');

    // Check invoices extensions
    const invoicesCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invoices' 
      AND column_name IN ('order_id', 's3_json_path', 's3_pdf_path');
    `);

    const invoiceColumns = invoicesCheck.rows.map(r => r.column_name);
    console.log(invoiceColumns.includes('order_id') ? '✅ invoices.order_id exists' : '❌ invoices.order_id NOT found');
    console.log(invoiceColumns.includes('s3_json_path') ? '✅ invoices.s3_json_path exists' : '❌ invoices.s3_json_path NOT found');
    console.log(invoiceColumns.includes('s3_pdf_path') ? '✅ invoices.s3_pdf_path exists' : '❌ invoices.s3_pdf_path NOT found');

    console.log('\n' + '='.repeat(60));

    if (ordersExists && auditExists && reportsExists && invoiceColumns.length === 3) {
      console.log('✅ ALL MIGRATIONS APPLIED!');
      console.log('\nYou can proceed with implementing the order management features.');
    } else {
      console.log('⚠️  MIGRATIONS NOT APPLIED');
      console.log('\nPlease run the migrations:');
      console.log('  1. Open Supabase SQL Editor');
      console.log('  2. Copy and paste: migrations/apply-all-migrations.sql');
      console.log('  3. Execute the script');
      console.log('\nOr use the migration script:');
      console.log('  node scripts/apply-migrations.js');
    }

  } catch (error) {
    console.error('❌ Error checking migrations:', error.message);
  } finally {
    await pool.end();
  }
}

checkMigrations();
