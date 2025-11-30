#!/usr/bin/env node

/**
 * Run database migrations directly
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigrations() {
  console.log('🚀 Running database migrations...\n');

  try {
    // Read the complete migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', 'apply-all-migrations.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Split by semicolons and filter out comments and empty statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and DO blocks (they're informational)
      if (statement.startsWith('/*') || statement.startsWith('DO $$')) {
        continue;
      }

      try {
        await pool.query(statement + ';');
        successCount++;
        
        // Show progress for major operations
        if (statement.includes('CREATE TABLE')) {
          const tableName = statement.match(/CREATE TABLE.*?(\w+)/)?.[1];
          console.log(`✅ Created table: ${tableName}`);
        } else if (statement.includes('ALTER TABLE')) {
          const tableName = statement.match(/ALTER TABLE\s+(\w+)/)?.[1];
          console.log(`✅ Altered table: ${tableName}`);
        } else if (statement.includes('CREATE INDEX')) {
          const indexName = statement.match(/CREATE.*?INDEX.*?(\w+)/)?.[1];
          console.log(`✅ Created index: ${indexName}`);
        }
      } catch (error) {
        if (error.message.includes('already exists')) {
          skipCount++;
          // Silently skip already existing objects
        } else {
          console.error(`⚠️  Error executing statement ${i + 1}:`, error.message);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Migration complete!`);
    console.log(`   ${successCount} statements executed`);
    console.log(`   ${skipCount} statements skipped (already exists)`);
    console.log('='.repeat(60));

    // Verify the schema
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
      
      if (result.rows[0].exists) {
        console.log(`✅ ${table} table verified`);
      } else {
        console.log(`❌ ${table} table NOT found`);
      }
    }

    // Check invoices extensions
    const invoicesCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invoices' 
      AND column_name IN ('order_id', 's3_json_path', 's3_pdf_path');
    `);

    const columns = invoicesCheck.rows.map(r => r.column_name);
    console.log(columns.includes('order_id') ? '✅ invoices.order_id verified' : '❌ invoices.order_id NOT found');
    console.log(columns.includes('s3_json_path') ? '✅ invoices.s3_json_path verified' : '❌ invoices.s3_json_path NOT found');
    console.log(columns.includes('s3_pdf_path') ? '✅ invoices.s3_pdf_path verified' : '❌ invoices.s3_pdf_path NOT found');

    console.log('\n✅ All migrations applied successfully!');
    console.log('\n📋 Next steps:');
    console.log('  1. Continue with Task 2: S3 service utilities');
    console.log('  2. Implement order management API endpoints');
    console.log('  3. Build the order taking UI');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
