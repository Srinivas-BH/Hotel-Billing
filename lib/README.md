# Database Setup Guide

## Prerequisites

1. Create a Supabase account at https://supabase.com
2. Create a new project in Supabase
3. Get your database connection string from Project Settings > Database

## Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the `DATABASE_URL` in `.env` with your Supabase connection string:
   ```
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```

## Running Migrations

To create the database schema, run:

```bash
npm run migrate
```

This will create all necessary tables:
- `hotels` - Store hotel information and credentials
- `menu_items` - Store menu items for each hotel
- `invoices` - Store generated invoices
- `invoice_items` - Store line items for each invoice

## Testing Database Connection

To test your database connection:

```bash
node -e "require('./lib/db').testConnection()"
```

## Running Database Tests

The property-based tests for database schema integrity require a valid database connection:

```bash
npm test -- --testPathPattern=db-schema
```

**Note:** These tests will create and delete test data. It's recommended to use a separate test database.

## Database Schema

The schema includes:
- UUID primary keys for all tables
- Foreign key constraints with CASCADE delete
- Check constraints for data validation (positive prices, table counts)
- Indexes on frequently queried columns
- Automatic timestamp updates via triggers

See `lib/schema.sql` for the complete schema definition.
