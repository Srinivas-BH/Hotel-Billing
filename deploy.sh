#!/bin/bash

# Hotel Billing Management System - Deployment Script
# This script helps you deploy to Vercel

echo "🚀 Hotel Billing Management System - Deployment"
echo "================================================"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null
then
    echo "❌ Vercel CLI is not installed"
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
    echo "✅ Vercel CLI installed!"
    echo ""
fi

# Check if user is logged in
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null
then
    echo "❌ Not logged in to Vercel"
    echo "🔑 Please login to Vercel..."
    vercel login
    echo ""
fi

echo "✅ Authenticated with Vercel"
echo ""

# Ask deployment type
echo "📋 Select deployment type:"
echo "1) Development (preview)"
echo "2) Production"
read -p "Enter choice (1 or 2): " choice

echo ""

if [ "$choice" = "1" ]; then
    echo "🔨 Deploying to development..."
    vercel
elif [ "$choice" = "2" ]; then
    echo "🚀 Deploying to production..."
    vercel --prod
else
    echo "❌ Invalid choice"
    exit 1
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Test your deployment"
echo "2. Update NEXT_PUBLIC_APP_URL in Vercel environment variables"
echo "3. Update README.md with your live URL"
echo "4. Update AWS_BLOG_POST.md with your live URL"
echo ""
echo "🎉 Your app is live!"
