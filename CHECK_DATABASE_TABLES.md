# 🔍 Check Database Tables

## 🎯 Current Status

You're getting "Failed to create account" which means:
- ✅ Database is connecting
- ❌ But something is wrong with the tables

---

## 🚀 Push Database Check Endpoint

```bash
git add app/api/db-check/route.ts
git commit -m "Add database table check endpoint"
git push origin main
```

---

## ⏱️ After Deployment (5 minutes)

Visit: `https://hotel-billing-70ov.onrender.com/api/db-check`

You'll see:
```json
{
  "hotelsTableExists": true/false,
  "tableStructure": [...],
  "message": "..."
}
```

---

## 🔍 If Tables Don't Exist

You need to create them in Supabase:

### Step 1: Go to Supabase Dashboard

https://supabase.com/dashboard

### Step 2: Open SQL Editor

Click on "SQL Editor" in the left sidebar

### Step 3: Run This SQL

```sql
-- Create hotels table
CREATE TABLE IF NOT EXISTS hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  hotel_name VARCHAR(255) NOT NULL,
  hotel_photo_key VARCHAR(500),
  table_count INTEGER NOT NULL CHECK (table_count > 0),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  dish_name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  table_number INTEGER NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  gst_percentage DECIMAL(5, 2) DEFAULT 0,
  gst_amount DECIMAL(10, 2) DEFAULT 0,
  service_charge_percentage DECIMAL(5, 2) DEFAULT 0,
  service_charge_amount DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  grand_total DECIMAL(10, 2) NOT NULL,
  invoice_json JSONB NOT NULL,
  pdf_key VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create invoice_items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  dish_name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total DECIMAL(10, 2) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_hotel_id ON menu_items(hotel_id);
CREATE INDEX IF NOT EXISTS idx_invoices_hotel_id ON invoices(hotel_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_invoices_table_number ON invoices(table_number);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
```

### Step 4: Click "Run"

This will create all the tables your app needs.

---

## 🚀 Do This Now

### 1. Push the check endpoint:
```bash
git add app/api/db-check/route.ts
git commit -m "Add database check"
git push origin main
```

### 2. Wait 5 minutes for deployment

### 3. Visit `/api/db-check`

### 4. If tables don't exist, create them in Supabase

---

**This will tell us exactly what's missing! 🔍**
