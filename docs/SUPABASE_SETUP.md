# Supabase Production Database Setup Guide

This guide walks you through setting up the Supabase PostgreSQL database for the Hotel Billing Management Admin Portal.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Access to your project's database credentials

## Step 1: Create a Supabase Project

1. Log in to your Supabase dashboard at https://app.supabase.com
2. Click "New Project"
3. Fill in the project details:
   - **Name**: `hotel-billing-admin` (or your preferred name)
   - **Database Password**: Generate a strong password and save it securely
   - **Region**: Choose the region closest to your users
   - **Pricing Plan**: Select Free tier for development or Pro for production
4. Click "Create new project"
5. Wait for the project to be provisioned (usually 1-2 minutes)

## Step 2: Get Database Connection String

1. In your Supabase project dashboard, navigate to **Settings** > **Database**
2. Scroll down to **Connection string** section
3. Select the **URI** tab
4. Copy the connection string (it will look like this):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with the database password you created in Step 1
6. Save this connection string - you'll need it for environment variables

## Step 3: Run Database Migrations

### Option A: Using Supabase SQL Editor (Recommended)

1. In your Supabase dashboard, navigate to **SQL Editor**
2. Click **New query**
3. Copy the entire contents of `lib/schema.sql` from this project
4. Paste it into the SQL editor
5. Click **Run** to execute the migration
6. Verify that all tables were created successfully by checking the **Table Editor**

### Option B: Using Command Line

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Link your project:
   ```bash
   supabase link --project-ref [YOUR-PROJECT-REF]
   ```

3. Run the migration:
   ```bash
   psql [YOUR-CONNECTION-STRING] < lib/schema.sql
   ```

## Step 4: Configure Connection Pooling

Connection pooling is essential for serverless environments like Vercel.

1. In Supabase dashboard, go to **Settings** > **Database**
2. Scroll to **Connection Pooling** section
3. Enable **Connection Pooling**
4. Copy the **Connection Pooling** string (port 6543)
5. Use this pooled connection string for production:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true
   ```

## Step 5: Set Up Row Level Security (Optional but Recommended)

For additional security, enable Row Level Security (RLS) policies:

1. In Supabase dashboard, navigate to **Authentication** > **Policies**
2. Enable RLS for each table
3. Create policies to ensure hotels can only access their own data

### Example RLS Policy for menu_items table:

```sql
-- Enable RLS
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Policy: Hotels can only see their own menu items
CREATE POLICY "Hotels can view own menu items"
  ON menu_items
  FOR SELECT
  USING (hotel_id = auth.uid());

-- Policy: Hotels can insert their own menu items
CREATE POLICY "Hotels can insert own menu items"
  ON menu_items
  FOR INSERT
  WITH CHECK (hotel_id = auth.uid());

-- Policy: Hotels can update their own menu items
CREATE POLICY "Hotels can update own menu items"
  ON menu_items
  FOR UPDATE
  USING (hotel_id = auth.uid());

-- Policy: Hotels can delete their own menu items
CREATE POLICY "Hotels can delete own menu items"
  ON menu_items
  FOR DELETE
  USING (hotel_id = auth.uid());
```

**Note**: Since this application uses JWT authentication (not Supabase Auth), you may skip RLS or implement custom policies based on your security requirements.

## Step 6: Configure Environment Variables

Add the following to your environment variables:

### For Local Development (.env.local):
```bash
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true
```

### For Vercel Production:
1. Go to your Vercel project dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add the variable:
   - **Name**: `DATABASE_URL`
   - **Value**: Your pooled connection string
   - **Environment**: Production, Preview, Development (select as needed)

## Step 7: Verify Database Setup

Run the migration utility to verify the connection:

```bash
npm run migrate
```

Or test the connection with a simple query:

```bash
psql [YOUR-CONNECTION-STRING] -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
```

You should see the following tables:
- hotels
- menu_items
- invoices
- invoice_items

## Step 8: Set Up Database Backups (Production)

1. In Supabase dashboard, go to **Settings** > **Database**
2. Scroll to **Backups** section
3. Supabase automatically creates daily backups on Pro plan
4. For Free tier, consider setting up manual backup scripts

### Manual Backup Script:
```bash
pg_dump [YOUR-CONNECTION-STRING] > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Troubleshooting

### Connection Timeout Issues
- Ensure you're using the connection pooling string (port 6543)
- Check that your IP is not blocked by Supabase firewall
- Verify the password is correct (no special characters causing issues)

### Migration Errors
- Ensure the pgcrypto extension is enabled
- Check for existing tables that might conflict
- Review error messages in the SQL Editor

### Performance Issues
- Verify indexes are created (check `lib/schema.sql`)
- Use connection pooling for serverless environments
- Monitor query performance in Supabase dashboard

## Security Best Practices

1. **Never commit** your database password or connection string to version control
2. Use **connection pooling** for production deployments
3. Rotate database passwords regularly
4. Enable **SSL mode** for all connections (included by default in Supabase)
5. Monitor database access logs in Supabase dashboard
6. Set up **database backups** and test restoration procedures

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)

## Support

If you encounter issues:
1. Check Supabase status page: https://status.supabase.com
2. Review Supabase documentation
3. Contact Supabase support through their dashboard
