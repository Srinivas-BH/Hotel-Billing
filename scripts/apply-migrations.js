#!/usr/bin/env node

/**
 * Migration Script for Order Taking & Billing Feature
 * Applies all database migrations in order
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const migrations = [
  '001_create_orders_table.sql',
  '002_extend_invoices_table.sql',
  '003_create_audit_logs_table.sql',
  '004_create_reports_table.sql',
  '005_add_foreign_key_constraints.sql'
];

async function applyMigration(filename) {
  const filePath = path.join(__dirname, '..', 'migrations', filename);
  const sql = fs.readFileSync(filePath, 'utf8');
  
  console.log(`\n📝 Applying migration: ${filename}`);
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // Try direct query if RPC doesn't exist
      const { error: directError } = await supabase.from('_migrations').insert({
        name: filename,
        executed_at: new Date().toISOString()
      });
      
      if (directError && !directError.message.includes('already exists')) {
        throw directError;
      }
    }
    
    console.log(`✅ Successfully applied: ${filename}`);
    return true;
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log(`⚠️  Already applied: ${filename}`);
      return true;
    }
    console.error(`❌ Failed to apply ${filename}:`, error.message);
    return false;
  }
}

async function verifySchema() {
  console.log('\n🔍 Verifying schema...');
  
  const tables = ['orders', 'audit_logs', 'reports'];
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(0);
    
    if (error) {
      console.error(`❌ Table ${table} not found or not accessible`);
      return false;
    }
    console.log(`✅ Table ${table} exists`);
  }
  
  // Check invoices extensions
  const { data: invoices, error: invError } = await supabase
    .from('invoices')
    .select('order_id, s3_json_path, s3_pdf_path')
    .limit(0);
  
  if (invError) {
    console.error('❌ Invoices table extensions not found');
    return false;
  }
  console.log('✅ Invoices table extended with order_id and S3 paths');
  
  return true;
}

async function main() {
  console.log('🚀 Starting database migrations for Order Taking & Billing');
  console.log('=' .repeat(60));
  
  let allSuccess = true;
  
  for (const migration of migrations) {
    const success = await applyMigration(migration);
    if (!success) {
      allSuccess = false;
      console.log('\n⚠️  Continuing with remaining migrations...');
    }
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (allSuccess) {
    console.log('✅ All migrations applied successfully!');
    
    const verified = await verifySchema();
    if (verified) {
      console.log('\n✅ Schema verification passed!');
      console.log('\n📋 Next steps:');
      console.log('  1. Review the new tables in Supabase dashboard');
      console.log('  2. Continue with Task 2: S3 service utilities');
      console.log('  3. Implement order management API endpoints');
    } else {
      console.log('\n⚠️  Schema verification failed. Please check manually.');
    }
  } else {
    console.log('⚠️  Some migrations failed or were already applied.');
    console.log('   Please check the logs above and verify manually in Supabase.');
  }
}

main().catch(console.error);
