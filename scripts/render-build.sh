#!/bin/bash

# Render Build Script for Hotel Billing Admin
# This script optimizes the build process for Render's environment

set -e  # Exit on error

echo "🚀 Starting Render build process..."

# Set Node options for better memory management
export NODE_OPTIONS="--max-old-space-size=4096"

# Clean any previous build artifacts
echo "🧹 Cleaning previous builds..."
rm -rf .next
rm -rf node_modules/.cache

# Install ALL dependencies including devDependencies (needed for Tailwind, PostCSS, etc.)
echo "📦 Installing dependencies (including devDependencies)..."
npm install --include=dev

# Build the Next.js application
echo "🔨 Building Next.js application..."
npm run build

echo "✅ Build completed successfully!"
