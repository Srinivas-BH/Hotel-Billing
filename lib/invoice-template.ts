/**
 * HTML invoice template generator
 * Creates printable invoice HTML with professional styling
 * Requirements: 6.2
 */

import { InvoiceJSON } from '@/types';

/**
 * Generate HTML invoice template from invoice data
 * @param invoice - Invoice JSON data
 * @returns HTML string for the invoice
 */
export function generateInvoiceHTML(invoice: InvoiceJSON): string {
  const formattedDate = new Date(invoice.date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const itemRows = invoice.items
    .map(
      (item) => `
      <tr>
        <td>${escapeHtml(item.dishName)}</td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">₹${item.price.toFixed(2)}</td>
        <td style="text-align: right;">₹${item.total.toFixed(2)}</td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${escapeHtml(invoice.invoiceNumber)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      padding: 40px;
      background-color: #ffffff;
      color: #333;
      line-height: 1.6;
    }
    
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      padding: 40px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
    }
    
    .header h1 {
      font-size: 32px;
      color: #2563eb;
      margin-bottom: 10px;
      font-weight: 700;
    }
    
    .header .invoice-title {
      font-size: 18px;
      color: #666;
      font-weight: 500;
    }
    
    .invoice-details {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      padding: 20px;
      background-color: #f8fafc;
      border-radius: 6px;
    }
    
    .invoice-details .detail-group {
      flex: 1;
    }
    
    .invoice-details .label {
      font-weight: 600;
      color: #475569;
      font-size: 14px;
      margin-bottom: 5px;
    }
    
    .invoice-details .value {
      font-size: 16px;
      color: #1e293b;
      font-weight: 500;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    
    thead {
      background-color: #2563eb;
      color: white;
    }
    
    th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    th:nth-child(2),
    th:nth-child(3),
    th:nth-child(4) {
      text-align: right;
    }
    
    th:nth-child(2) {
      text-align: center;
    }
    
    tbody tr {
      border-bottom: 1px solid #e2e8f0;
    }
    
    tbody tr:hover {
      background-color: #f8fafc;
    }
    
    td {
      padding: 12px;
      font-size: 14px;
    }
    
    .totals {
      margin-top: 30px;
      padding: 20px;
      background-color: #f8fafc;
      border-radius: 6px;
    }
    
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 15px;
    }
    
    .totals-row.subtotal {
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 12px;
      margin-bottom: 8px;
    }
    
    .totals-row .label {
      color: #475569;
      font-weight: 500;
    }
    
    .totals-row .value {
      color: #1e293b;
      font-weight: 600;
      min-width: 120px;
      text-align: right;
    }
    
    .totals-row.grand-total {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 2px solid #2563eb;
      font-size: 18px;
    }
    
    .totals-row.grand-total .label {
      color: #2563eb;
      font-weight: 700;
    }
    
    .totals-row.grand-total .value {
      color: #2563eb;
      font-weight: 700;
      font-size: 20px;
    }
    
    .footer {
      margin-top: 40px;
      text-align: center;
      padding-top: 20px;
      border-top: 2px solid #e0e0e0;
      color: #64748b;
      font-size: 13px;
    }
    
    @media print {
      body {
        padding: 0;
      }
      
      .invoice-container {
        border: none;
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <h1>${escapeHtml(invoice.hotelName)}</h1>
      <div class="invoice-title">TAX INVOICE</div>
    </div>
    
    <div class="invoice-details">
      <div class="detail-group">
        <div class="label">Invoice Number</div>
        <div class="value">${escapeHtml(invoice.invoiceNumber)}</div>
      </div>
      <div class="detail-group">
        <div class="label">Table Number</div>
        <div class="value">${invoice.tableNumber}</div>
      </div>
      <div class="detail-group">
        <div class="label">Date & Time</div>
        <div class="value">${formattedDate}</div>
      </div>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>
    
    <div class="totals">
      <div class="totals-row subtotal">
        <span class="label">Subtotal</span>
        <span class="value">₹${invoice.subtotal.toFixed(2)}</span>
      </div>
      ${
        invoice.discount > 0
          ? `
      <div class="totals-row">
        <span class="label">Discount</span>
        <span class="value">- ₹${invoice.discount.toFixed(2)}</span>
      </div>
      `
          : ''
      }
      ${
        invoice.gst.percentage > 0
          ? `
      <div class="totals-row">
        <span class="label">GST (${invoice.gst.percentage}%)</span>
        <span class="value">₹${invoice.gst.amount.toFixed(2)}</span>
      </div>
      `
          : ''
      }
      ${
        invoice.serviceCharge.percentage > 0
          ? `
      <div class="totals-row">
        <span class="label">Service Charge (${invoice.serviceCharge.percentage}%)</span>
        <span class="value">₹${invoice.serviceCharge.amount.toFixed(2)}</span>
      </div>
      `
          : ''
      }
      <div class="totals-row grand-total">
        <span class="label">GRAND TOTAL</span>
        <span class="value">₹${invoice.grandTotal.toFixed(2)}</span>
      </div>
    </div>
    
    <div class="footer">
      <p>Thank you for dining with us!</p>
      <p>This is a computer-generated invoice.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Escape HTML special characters to prevent XSS
 * @param text - Text to escape
 * @returns Escaped text
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
