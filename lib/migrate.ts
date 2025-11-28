import { readFileSync } from 'fs';
import { join } from 'path';
import { query, closePool } from './db';

/**
 * Run database migrations
 */
export async function runMigrations(): Promise<void> {
  try {
    console.log('Starting database migrations...');
    
    // Read the schema file
    const schemaPath = join(process.cwd(), 'lib', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    // Execute the schema
    await query(schema);
    
    console.log('Database migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

/**
 * Drop all tables (useful for testing)
 */
export async function dropAllTables(): Promise<void> {
  try {
    console.log('Dropping all tables...');
    
    await query(`
      DROP TABLE IF EXISTS invoice_items CASCADE;
      DROP TABLE IF EXISTS invoices CASCADE;
      DROP TABLE IF EXISTS menu_items CASCADE;
      DROP TABLE IF EXISTS hotels CASCADE;
      DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
    `);
    
    console.log('All tables dropped successfully!');
  } catch (error) {
    console.error('Drop tables failed:', error);
    throw error;
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migration script completed');
      return closePool();
    })
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      closePool().then(() => process.exit(1));
    });
}
