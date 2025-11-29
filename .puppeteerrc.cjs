const { join } = require('path');

/**
 * Puppeteer configuration for Render.com deployment
 * This tells Puppeteer to skip downloading Chromium during build
 * and use the system Chrome instead
 */
module.exports = {
  // Skip Chromium download during npm install
  skipDownload: process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD === 'true',
  
  // Use system Chrome on Render
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  
  // Cache directory (optional)
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
