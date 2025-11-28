# Quick Start Guide

Get the Hotel Billing Management Admin Portal running locally in under 10 minutes.

## Prerequisites

- Node.js 18+ installed
- Git installed
- A code editor (VS Code recommended)

## Step 1: Clone and Install (2 minutes)

```bash
# Clone the repository
git clone https://github.com/your-username/hotel-billing-admin.git
cd hotel-billing-admin

# Install dependencies
npm install
```

## Step 2: Set Up Environment Variables (3 minutes)

```bash
# Copy the example environment file
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

### Minimum Required for Local Development:

```bash
# Database (Supabase)
DATABASE_URL=postgresql://postgres:password@localhost:5432/hotel_billing

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your_generated_secret_here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Optional (for full functionality):

```bash
# AWS S3 (for file uploads)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
S3_BUCKET_PHOTOS=your-photos-bucket
S3_BUCKET_INVOICES=your-invoices-bucket

# Hugging Face (for AI invoice generation)
HUGGINGFACE_API_KEY=your_api_key
HUGGINGFACE_MODEL=facebook/bart-large-cnn
```

## Step 3: Set Up Database (3 minutes)

### Option A: Local PostgreSQL

```bash
# Install PostgreSQL if needed
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql

# Create database
createdb hotel_billing

# Run migrations
npm run migrate
```

### Option B: Supabase (Recommended)

1. Sign up at https://supabase.com
2. Create a new project
3. Get connection string from Settings > Database
4. Update `DATABASE_URL` in `.env.local`
5. Run migrations in Supabase SQL Editor (copy from `lib/schema.sql`)

## Step 4: Run the Application (1 minute)

```bash
# Start development server
npm run dev
```

Open http://localhost:3000 in your browser.

## Step 5: Create Your First Account

1. Navigate to http://localhost:3000/signup
2. Fill in the signup form:
   - Email: test@example.com
   - Password: password123
   - Hotel Name: Test Hotel
   - Table Count: 10
3. Click "Sign Up"
4. You'll be redirected to the dashboard

## What's Next?

### Try These Features:

1. **Menu Management**: Add some menu items
   - Go to Menu page
   - Click "Add Item"
   - Enter dish name and price

2. **Generate Invoice**: Create your first bill
   - Go to Billing page
   - Select a table number
   - Add menu items
   - Click "Generate Invoice"

3. **View Reports**: Check revenue reports
   - Go to Reports page
   - View daily/monthly summaries
   - Export to CSV or PDF

### Development Workflow:

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linter
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## Troubleshooting

### Port 3000 Already in Use

```bash
# Kill the process using port 3000
# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use a different port:
PORT=3001 npm run dev
```

### Database Connection Error

- Verify PostgreSQL is running
- Check DATABASE_URL is correct
- Ensure database exists
- Run migrations: `npm run migrate`

### Module Not Found Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
# Rebuild TypeScript
npm run build
```

## Project Structure

```
hotel-billing-admin/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── billing/           # Billing page
│   ├── dashboard/         # Dashboard page
│   ├── login/             # Login page
│   ├── menu/              # Menu management
│   ├── profile/           # Profile page
│   └── reports/           # Reports page
├── components/            # React components
├── contexts/              # React contexts
├── lib/                   # Backend utilities
│   ├── auth.ts           # Authentication
│   ├── billing.ts        # Billing logic
│   ├── db.ts             # Database client
│   └── schema.sql        # Database schema
├── types/                 # TypeScript types
├── __tests__/            # Test files
└── docs/                 # Documentation
```

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm start               # Start production server

# Testing
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode

# Database
npm run migrate         # Run database migrations

# Code Quality
npm run lint            # Run ESLint
npm run type-check      # Run TypeScript checks
```

## Need Help?

- 📖 [Full Documentation](./DEPLOYMENT.md)
- 🔧 [Troubleshooting Guide](./DEPLOYMENT.md#troubleshooting)
- 🐛 [Report Issues](https://github.com/your-username/hotel-billing-admin/issues)

## Ready to Deploy?

See the [Deployment Guide](./DEPLOYMENT.md) for production deployment instructions.
