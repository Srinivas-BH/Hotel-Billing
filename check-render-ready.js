#!/usr/bin/env node

/**
 * Pre-deployment checklist for Render.com
 * Run this before deploying to catch common issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Render Deployment Readiness...\n');

let allChecks = true;

// Check 1: package.json exists and has required scripts
console.log('✓ Checking package.json...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  if (!packageJson.scripts.build) {
    console.log('  ❌ Missing "build" script');
    allChecks = false;
  }
  
  if (!packageJson.scripts.start && !packageJson.scripts['start:render']) {
    console.log('  ❌ Missing "start" or "start:render" script');
    allChecks = false;
  }
  
  if (allChecks) {
    console.log('  ✅ package.json looks good\n');
  }
} catch (error) {
  console.log('  ❌ package.json not found or invalid\n');
  allChecks = false;
}

// Check 2: render.yaml exists
console.log('✓ Checking render.yaml...');
if (fs.existsSync('render.yaml')) {
  console.log('  ✅ render.yaml found\n');
} else {
  console.log('  ⚠️  render.yaml not found (optional but recommended)\n');
}

// Check 3: .env.example exists
console.log('✓ Checking .env.example...');
if (fs.existsSync('.env.example')) {
  console.log('  ✅ .env.example found\n');
} else {
  console.log('  ⚠️  .env.example not found\n');
}

// Check 4: Health check endpoint exists
console.log('✓ Checking health check endpoint...');
const healthCheckPath = path.join('app', 'api', 'health', 'route.ts');
if (fs.existsSync(healthCheckPath)) {
  console.log('  ✅ Health check endpoint found\n');
} else {
  console.log('  ❌ Health check endpoint missing at app/api/health/route.ts\n');
  allChecks = false;
}

// Check 5: .gitignore includes .env files
console.log('✓ Checking .gitignore...');
if (fs.existsSync('.gitignore')) {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  if (gitignore.includes('.env') || gitignore.includes('.env.local')) {
    console.log('  ✅ .env files are gitignored\n');
  } else {
    console.log('  ⚠️  .env files might not be gitignored\n');
  }
} else {
  console.log('  ⚠️  .gitignore not found\n');
}

// Check 6: node_modules is gitignored
console.log('✓ Checking node_modules...');
if (fs.existsSync('.gitignore')) {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  if (gitignore.includes('node_modules')) {
    console.log('  ✅ node_modules is gitignored\n');
  } else {
    console.log('  ❌ node_modules should be gitignored\n');
    allChecks = false;
  }
}

// Check 7: Puppeteer configuration
console.log('✓ Checking Puppeteer configuration...');
if (fs.existsSync('.puppeteerrc.cjs')) {
  console.log('  ✅ Puppeteer config found\n');
} else {
  console.log('  ⚠️  .puppeteerrc.cjs not found (PDF generation might fail)\n');
}

// Check 8: Database connection file
console.log('✓ Checking database connection...');
const dbPath = path.join('lib', 'db.ts');
if (fs.existsSync(dbPath)) {
  console.log('  ✅ Database connection file found\n');
} else {
  console.log('  ❌ Database connection file missing at lib/db.ts\n');
  allChecks = false;
}

// Final summary
console.log('═══════════════════════════════════════════════════════');
if (allChecks) {
  console.log('✅ All critical checks passed!');
  console.log('🚀 Your app is ready for Render deployment!');
  console.log('\nNext steps:');
  console.log('1. Push to GitHub: git push origin main');
  console.log('2. Follow RENDER_QUICK_START.md for deployment');
} else {
  console.log('❌ Some checks failed!');
  console.log('⚠️  Please fix the issues above before deploying');
}
console.log('═══════════════════════════════════════════════════════\n');

// Environment variables reminder
console.log('📋 Required Environment Variables for Render:');
console.log('   1. DATABASE_URL');
console.log('   2. JWT_SECRET');
console.log('   3. JWT_EXPIRES_IN');
console.log('   4. NEXT_PUBLIC_APP_URL');
console.log('   5. NODE_ENV');
console.log('\n💡 See RENDER_QUICK_START.md for the exact values\n');

process.exit(allChecks ? 0 : 1);
