'use client';

import React, { useRef } from 'react';

interface InvoiceItem {
  dishName: string;
  price: number;
  quantity: number;
  total: number;
}

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  tableNumber: number;
  subtotal: number;
  gstPercentage: number;
  gstAmount: number;
  serviceChargePercentage: number;
  serviceChargeAmount: number;
  discountAmount: number;
  grandTotal: number;
  items: InvoiceItem[];
  createdAt: string;
}

interface InvoicePreviewProps {
  invoice: InvoiceData;
  pdfUrl: string | null;
  hotelName: string;
  onClose: () => void;
}

export function InvoicePreview({ invoice, pdfUrl, hotelName, onClose }: InvoicePreviewProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Invoice ${invoice.invoiceNumber}</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  padding: 20px;
                  max-width: 800px;
                  margin: 0 auto;
                }
                .header {
                  text-align: center;
                  margin-bottom: 30px;
                  border-bottom: 2px solid #333;
                  padding-bottom: 20px;
                }
                .header h1 {
                  margin: 0;
                  font-size: 28px;
                  color: #333;
                }
                .invoice-details {
                  margin-bottom: 30px;
                  display: flex;
                  justify-content: space-between;
                }
                .invoice-details div {
                  flex: 1;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 20px;
                }
                th, td {
                  border: 1px solid #ddd;
                  padding: 12px;
                  text-align: left;
                }
                th {
                  background-color: #f8f9fa;
                  font-weight: bold;
                }
                .text-right {
                  text-align: right;
                }
                .totals {
                  margin-top: 20px;
                  text-align: right;
                }
                .totals div {
                  padding: 8px 0;
                  display: flex;
                  justify-content: flex-end;
                  gap: 40px;
                }
                .totals .grand-total {
                  font-size: 20px;
                  font-weight: bold;
                  border-top: 2px solid #333;
                  padding-top: 12px;
                  margin-top: 12px;
                }
                @media print {
                  body {
                    padding: 0;
                  }
                }
              </style>
            </head>
            <body>
              ${printRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  };

  const handleDownloadPDF = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Invoice Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close invoice preview"
          >
            ×
          </button>
        </div>

        {/* Invoice Content */}
        <div className="p-4 sm:p-6">
          <div ref={printRef}>
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8 border-b-2 border-gray-800 pb-4 sm:pb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{hotelName}</h1>
              <p className="text-base sm:text-lg text-gray-600">Invoice</p>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Invoice Number</p>
                <p className="text-base sm:text-lg font-semibold text-gray-900 break-all">{invoice.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Date</p>
                <p className="text-base sm:text-lg font-semibold text-gray-900">{formatDate(invoice.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Table Number</p>
                <p className="text-base sm:text-lg font-semibold text-gray-900">Table {invoice.tableNumber}</p>
              </div>
            </div>

            {/* Items Table - Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full mb-6">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Item</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Price</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Qty</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="px-4 py-3 text-gray-900">{item.dishName}</td>
                      <td className="px-4 py-3 text-right text-gray-900">${Number(item.price).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-gray-900">{item.quantity}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        ${Number(item.total).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Items List - Mobile */}
            <div className="sm:hidden space-y-3 mb-6">
              {invoice.items.map((item, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-md">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-gray-900 flex-1">{item.dishName}</p>
                    <p className="font-bold text-gray-900 ml-2">${Number(item.total).toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>${Number(item.price).toFixed(2)} × {item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="text-right space-y-2 text-sm sm:text-base">
              <div className="flex justify-end gap-4 sm:gap-12 text-gray-700">
                <span className="font-medium">Subtotal:</span>
                <span className="w-20 sm:w-24 text-right">${Number(invoice.subtotal).toFixed(2)}</span>
              </div>

              {invoice.discountAmount > 0 && (
                <div className="flex justify-end gap-4 sm:gap-12 text-gray-700">
                  <span className="font-medium">Discount:</span>
                  <span className="w-20 sm:w-24 text-right">-${Number(invoice.discountAmount).toFixed(2)}</span>
                </div>
              )}

              {invoice.gstPercentage > 0 && (
                <div className="flex justify-end gap-4 sm:gap-12 text-gray-700">
                  <span className="font-medium">GST ({Number(invoice.gstPercentage).toFixed(1)}%):</span>
                  <span className="w-20 sm:w-24 text-right">${Number(invoice.gstAmount).toFixed(2)}</span>
                </div>
              )}

              {invoice.serviceChargePercentage > 0 && (
                <div className="flex justify-end gap-4 sm:gap-12 text-gray-700">
                  <span className="font-medium">Service Charge ({Number(invoice.serviceChargePercentage).toFixed(1)}%):</span>
                  <span className="w-20 sm:w-24 text-right">${Number(invoice.serviceChargeAmount).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-end gap-4 sm:gap-12 text-lg sm:text-xl font-bold text-gray-900 pt-3 border-t-2 border-gray-800 mt-3">
                <span>Grand Total:</span>
                <span className="w-20 sm:w-24 text-right">${Number(invoice.grandTotal).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer with Action Buttons */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
          <button
            onClick={handlePrint}
            className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700 min-h-[44px] order-2 sm:order-1"
          >
            Print
          </button>
          {pdfUrl && (
            <button
              onClick={handleDownloadPDF}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 min-h-[44px] order-1 sm:order-2"
            >
              Download PDF
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-50 min-h-[44px] order-3"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
