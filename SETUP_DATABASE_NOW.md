# 🚀 Quick Database Setup - 5 Minutes

Follow these steps to enable full application features including invoice generation.

---

## Step 1: Create Supabase Account (2 minutes)

1. **Go to**: https://supabase.com
2. **Click**: "Start your project"
3. **Sign up** with GitHub or Email
4. **Verify** your email

---

## Step 2: Create Project (1 minute)

1. **Click**: "New Project"
2. **Fill in**:
   - **Name**: `hotel-billing` (or any name you like)
   - **Database Password**: Click "Generate a password" and **SAVE IT**
   - **Region**: Choose closest to you
   - **Plan**: Free (perfect for testing)
3. **Click**: "Create new project"
4. **Wait**: 1-2 minutes for setup

---

## Step 3: Get Connection String (1 minute)

1. In your Supabase project, click **"Settings"** (gear icon)
2. Click **"Database"** in the left menu
3. Scroll to **"Connection string"**
4. Select **"URI"** tab
5. **Copy** the connection string (looks like this):
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
6. **Replace** `[YOUR-PASSWORD]` with the password you saved

---

## Step 4: Update Environment File (30 seconds)

1. **Open** the file `.env.local` in your project
2. **Find** the line that says:
   ```bash
   # DATABASE_URL=postgresql://user:password@host:5432/database
   ```
3. **Replace** it with:
   ```bash
   DATABASE_URL=your_connection_string_here
   ```
   (Paste the connection string you copied)

4. **Save** the file

---

## Step 5: Run Database Migrations (1 minute)

1. In Supabase, click **"SQL Editor"** in the left menu
2. Click **"New query"**
3. **Open** the file `lib/schema.sql` from your project
4. **Copy** all the contents
5. **Paste** into the Supabase SQL Editor
6. **Click** "Run" (or press Ctrl+Enter)
7. **Verify**: You should see "Success. No rows returned"

---

## Step 6: Restart Your Server (30 seconds)

1. **Stop** the current server (press `Ctrl+C` in terminal)
2. **Start** again:
   ```bash
   npm run dev
   ```
3. **Wait** for "Ready" message

---

## ✅ Done! Test Your App

1. **Visit**: http://localhost:3000
2. **Create account** (will be saved to database now!)
3. **Add menu items** (will persist!)
4. **Generate invoice** (will work now!)
5. **Refresh page** (data stays!)

---

## 🎉 What Now Works

- ✅ **Login** - With real credentials
- ✅ **Signup** - Saves to database
- ✅ **Menu items** - Persist across refreshes
- ✅ **Invoice generation** - Creates and saves invoices
- ✅ **PDF generation** - Downloads invoices
- ✅ **Reports** - View revenue data
- ✅ **Data persistence** - Everything is saved!

---

## 🐛 Troubleshooting

### "Connection timeout"
- Check your internet connection
- Verify the connection string is correct
- Make sure you replaced `[YOUR-PASSWORD]`

### "Migrations failed"
- Make sure you copied the entire `lib/schema.sql` file
- Try running the SQL again
- Check for any error messages

### "Still not working"
- Make sure you saved `.env.local`
- Make sure you restarted the server
- Check the connection string has no extra spaces

---

## 📞 Need Help?

If you get stuck:
1. Check the connection string format
2. Verify the password is correct
3. Make sure Supabase project is active
4. Try creating a new project if needed

---

## 🎯 Quick Reference

**Supabase Dashboard**: https://app.supabase.com
**Your Project**: (bookmark it after creation)
**SQL Editor**: Project > SQL Editor
**Database Settings**: Project > Settings > Database

---

**Total Time**: ~5 minutes
**Cost**: Free
**Result**: Fully functional app! 🚀
