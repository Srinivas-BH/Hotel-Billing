#!/usr/bin/env node

/**
 * Run individual migration files
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const migrations = [
  '002_extend_invoices_table.sql',
  '003_create_audit_logs_table.sql',
  '004_create_reports_table.sql',
  '005_add_foreign_key_constraints.sql'
];

async function runMigration(filename) {
  console.log(`\n📝 Running: ${filename}`);
  
  const filePath = path.join(__dirname, '..', 'migrations', filename);
  const sql = fs.readFileSync(filePath, 'utf8');
  
  try {
    await pool.query(sql);
    console.log(`✅ Success: ${filename}`);
    return true;
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log(`⚠️  Skipped: ${filename} (already exists)`);
      return true;
    }
    console.error(`❌ Failed: ${filename}`);
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Running database migrations...');
  console.log('='.repeat(60));

  let allSuccess = true;

  for (const migration of migrations) {
    const success = await runMigration(migration);
    if (!success) {
      allSuccess = false;
    }
  }

  console.log('\n' + '='.repeat(60));

  // Verify
  console.log('\n🔍 Verifying schema...\n');

  const tables = ['orders', 'audit_logs', 'reports'];
  for (const table of tables) {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `, [table]);
    
    console.log(result.rows[0].exists ? `✅ ${table}` : `❌ ${table}`);
  }

  // Check invoices extensions
  const invoicesCheck = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'invoices' 
    AND column_name IN ('order_id', 's3_json_path', 's3_pdf_path');
  `);

  const columns = invoicesCheck.rows.map(r => r.column_name);
  console.log(columns.includes('order_id') ? '✅ invoices.order_id' : '❌ invoices.order_id');
  console.log(columns.includes('s3_json_path') ? '✅ invoices.s3_json_path' : '❌ invoices.s3_json_path');
  console.log(columns.includes('s3_pdf_path') ? '✅ invoices.s3_pdf_path' : '❌ invoices.s3_pdf_path');

  console.log('\n' + '='.repeat(60));

  if (allSuccess) {
    console.log('✅ All migrations completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('  1. Task 1 is complete ✓');
    console.log('  2. Continue with Task 2: S3 service utilities');
    console.log('  3. Then implement order management API endpoints');
  } else {
    console.log('⚠️  Some migrations failed. Please check the errors above.');
  }

  await pool.end();
}

main().catch(console.error);
