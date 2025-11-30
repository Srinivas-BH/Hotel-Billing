# Hotel Billing Management System - User Guide

## 🌐 Access Your Application

**Local Development:** http://localhost:8000

## 📋 Complete Feature List

### ✅ Implemented Features

1. **Authentication**
   - Sign up with hotel details
   - Login/Logout
   - Secure JWT token authentication

2. **Menu Management**
   - Add menu items with name and price
   - Edit existing menu items
   - Delete menu items
   - View all menu items

3. **Order Taking** (NEW!)
   - Select table number
   - Add menu items to cart
   - Adjust quantities
   - Add notes to orders
   - Save orders (table becomes BUSY)
   - Update existing orders
   - Auto-save draft orders

4. **Dashboard**
   - View all tables with status (FREE/BUSY)
   - See BUSY tables with order details
   - Quick access to billing for BUSY tables
   - Real-time status updates

5. **Billing**
   - Generate bills from saved orders
   - Apply GST and service charges
   - Apply discounts
   - View invoice preview
   - Print invoices
   - Download PDF invoices
   - Automatic table freeing after billing

6. **Reports**
   - View daily revenue
   - View monthly revenue
   - Search invoices
   - Export to CSV/PDF

7. **Profile Management**
   - Update hotel name
   - Change table count
   - Upload hotel photo

## 🎯 How to Use the Order Taking Feature

### Step 1: Add Menu Items
1. Go to **Menu** page (http://localhost:8000/menu)
2. Click "Add Menu Item"
3. Enter dish name and price
4. Click "Add Item"
5. Repeat for all your menu items

### Step 2: Take an Order
1. Go to **Dashboard** (http://localhost:8000/dashboard)
2. Click on any **GREEN (FREE)** table
3. You'll be redirected to the Order Taking page
4. Select menu items by clicking on them
5. Adjust quantities using +/- buttons
6. Add notes if needed
7. Click **"Save Order"**
8. Table status changes to **BUSY (RED)**

### Step 3: View BUSY Tables
1. Return to **Dashboard**
2. BUSY tables appear in **RED**
3. You'll see:
   - Table number
   - Number of items in order
   - Time order was created
4. Two sections:
   - **Billing Section**: Click to generate bill directly
   - **Table Status Section**: Click to edit the order

### Step 4: Generate Bill
1. From Dashboard, click a **RED (BUSY)** table in the **Billing Section**
2. Order details are automatically loaded
3. Click **"Generate Bill"** button
4. Enter GST percentage (optional)
5. Enter service charge percentage (optional)
6. Enter discount amount (optional)
7. Review the calculated totals
8. Click **"Generate Invoice"**
9. Invoice is generated and displayed
10. Table automatically returns to **FREE** status

### Step 5: View/Print Invoice
1. After billing, invoice preview appears
2. Click **"Print"** to print
3. Click **"Download PDF"** to save
4. Invoice is saved in Reports

## 🔄 Order Workflow Diagram

```
┌─────────────┐
│   Dashboard │
│  (All FREE) │
└──────┬──────┘
       │ Click Table
       ▼
┌─────────────┐
│ Order Taking│
│    Page     │
└──────┬──────┘
       │ Add Items & Save
       ▼
┌─────────────┐
│   Dashboard │
│ (Table BUSY)│
└──────┬──────┘
       │ Click BUSY Table
       ▼
┌─────────────┐
│   Billing   │
│    Modal    │
└──────┬──────┘
       │ Generate Bill
       ▼
┌─────────────┐
│   Invoice   │
│   Preview   │
└──────┬──────┘
       │ Complete
       ▼
┌─────────────┐
│   Dashboard │
│ (Table FREE)│
└─────────────┘
```

## 🎨 Visual Indicators

### Table Colors
- **🟢 GREEN**: Table is FREE (no active order)
- **🔴 RED**: Table is BUSY (has active order)

### Dashboard Sections
1. **Quick Actions**: Navigate to different pages
2. **Billing Section**: Shows only BUSY tables for quick billing
3. **Table Status**: Shows all tables with their current status

## 💡 Tips & Best Practices

### For Order Taking
- ✅ Always save orders before navigating away
- ✅ Orders are auto-saved as drafts in browser
- ✅ You can edit orders anytime before billing
- ✅ Add notes for special instructions
- ✅ Check table status on dashboard before taking new orders

### For Billing
- ✅ Review order items before generating bill
- ✅ Apply GST/service charges as per your policy
- ✅ Double-check calculations before finalizing
- ✅ Print or download invoice for customer
- ✅ Table automatically frees after billing

### For Menu Management
- ✅ Keep menu items up to date
- ✅ Use clear, descriptive names
- ✅ Set accurate prices
- ✅ Delete items that are no longer available

## 🔧 Troubleshooting

### Table Not Showing as BUSY
**Problem:** Saved order but table still shows FREE

**Solutions:**
1. Refresh the dashboard page
2. Check if order was saved successfully (look for success message)
3. Verify you're logged in with correct account
4. Check browser console for errors

### Can't Save Order
**Problem:** Error when trying to save order

**Solutions:**
1. Ensure you have menu items added
2. Check that cart is not empty
3. Verify database connection
4. Check if migrations are applied: `node scripts/check-migrations.js`

### Order Not Loading
**Problem:** Order doesn't load when clicking table

**Solutions:**
1. Refresh the page
2. Clear browser cache
3. Check network tab for API errors
4. Verify token is valid (try logging out and back in)

### Billing Fails
**Problem:** Error when generating bill

**Solutions:**
1. Ensure order is saved first
2. Check that order has items
3. Verify all prices are valid numbers
4. Check S3 configuration if PDF fails

## 📊 Database Tables

The system uses these main tables:

1. **hotels**: Your hotel information
2. **menu_items**: Your menu items
3. **orders**: Active and completed orders
4. **invoices**: Generated bills
5. **invoice_items**: Items in each bill
6. **audit_logs**: Activity tracking
7. **reports**: Revenue summaries

See `DATABASE_SCHEMA_COMPLETE.md` for detailed schema.

## 🔐 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Secure HTTPS connections
- ✅ Authorization checks on all APIs
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ Rate limiting

## 📱 Mobile Support

The application is fully responsive and works on:
- 📱 Mobile phones
- 📱 Tablets
- 💻 Desktops
- 💻 Laptops

## 🆘 Getting Help

### Check Logs
```bash
# View server logs
npm run dev

# Check database status
node scripts/verify-complete-setup.js

# Check migrations
node scripts/check-migrations.js
```

### Common Commands
```bash
# Start development server
npm run dev

# Run migrations
node scripts/run-individual-migrations.js

# Verify setup
node scripts/verify-complete-setup.js

# Run tests
npm test
```

## 📞 Support

For issues or questions:
1. Check this user guide
2. Review `DATABASE_SCHEMA_COMPLETE.md`
3. Check `IMPLEMENTATION_PROGRESS.md`
4. Review error messages in browser console
5. Check server logs in terminal

---

**Version:** 2.0 (with Order Taking)
**Last Updated:** 2025-11-30
