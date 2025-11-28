/**
 * PDF generation using Puppeteer
 * Configured for serverless environment with error handling
 * Requirements: 7.2
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { InvoiceJSON } from '@/types';
import { generateInvoiceHTML } from './invoice-template';

let browserInstance: Browser | null = null;

/**
 * Get or create a browser instance
 * Configured for serverless environments (Vercel, AWS Lambda)
 */
async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }

  try {
    // Configuration for serverless environments
    const launchOptions: any = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--disable-extensions',
        '--disable-software-rasterizer',
      ],
      timeout: 30000,
    };

    // Use bundled Chromium in serverless environments
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      launchOptions.executablePath = await puppeteer.executablePath();
    }

    browserInstance = await puppeteer.launch(launchOptions);
    
    // Set up cleanup on process exit
    process.on('exit', () => {
      if (browserInstance) {
        browserInstance.close().catch(console.error);
      }
    });

    return browserInstance;
  } catch (error) {
    console.error('Failed to launch browser:', error);
    throw new Error('PDF generation service unavailable');
  }
}

/**
 * Close the browser instance
 * Should be called during cleanup or shutdown
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    try {
      await browserInstance.close();
      browserInstance = null;
    } catch (error) {
      console.error('Error closing browser:', error);
    }
  }
}

/**
 * Generate PDF from invoice data
 * @param invoice - Invoice JSON data
 * @returns PDF buffer
 * @throws Error if PDF generation fails
 */
export async function generateInvoicePDF(invoice: InvoiceJSON): Promise<Buffer> {
  let page: Page | null = null;
  let browser: Browser | null = null;

  try {
    // Get browser instance
    browser = await getBrowser();

    // Create new page
    page = await browser.newPage();

    // Set shorter timeout for faster response
    await page.setDefaultTimeout(5000);

    // Set viewport for consistent rendering
    await page.setViewport({
      width: 800,
      height: 1200,
      deviceScaleFactor: 1, // Reduced for faster rendering
    });

    // Generate HTML content
    const htmlContent = generateInvoiceHTML(invoice);

    // Set content with shorter timeout
    await page.setContent(htmlContent, {
      waitUntil: 'domcontentloaded', // Changed from networkidle0 for faster loading
      timeout: 5000,
    });

    // Generate PDF with optimized settings
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
      preferCSSPageSize: false,
      timeout: 10000,
    });

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(
      `Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  } finally {
    // Always close the page to free resources
    if (page && !page.isClosed()) {
      try {
        await page.close();
      } catch (error) {
        console.error('Error closing page:', error);
      }
    }
  }
}

/**
 * Generate PDF from HTML string (for testing or custom templates)
 * @param html - HTML content
 * @returns PDF buffer
 * @throws Error if PDF generation fails
 */
export async function generatePDFFromHTML(html: string): Promise<Buffer> {
  let page: Page | null = null;

  try {
    const browser = await getBrowser();
    page = await browser.newPage();

    await page.setViewport({
      width: 800,
      height: 1200,
      deviceScaleFactor: 2,
    });

    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 10000,
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF from HTML:', error);
    throw new Error(
      `Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (error) {
        console.error('Error closing page:', error);
      }
    }
  }
}

/**
 * Generate PDF report from report data
 * @param reportHTML - HTML content for the report
 * @returns PDF buffer
 * @throws Error if PDF generation fails
 * Requirements: 10.2
 */
export async function generateReportPDF(reportHTML: string): Promise<Buffer> {
  return generatePDFFromHTML(reportHTML);
}
