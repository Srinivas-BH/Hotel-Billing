'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { RetryButton } from './RetryButton';
import { fetchWithRetry, handleApiError } from '@/lib/client-error-handling';

interface ReportExportProps {
  startDate?: string;
  endDate?: string;
  tableNumber?: string;
  invoiceId?: string;
}

type ExportFormat = 'csv' | 'pdf';
type ReportType = 'daily' | 'monthly';

export function ReportExport({ startDate, endDate, tableNumber, invoiceId }: ReportExportProps) {
  const { token } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [error, setError] = useState<string | null>(null);
  const { showError, showSuccess } = useToast();

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    setError(null);

    try {
      const body: any = {
        format,
      };

      // Add filters if provided
      if (startDate) body.startDate = startDate;
      if (endDate) body.endDate = endDate;
      if (tableNumber) body.tableNumber = parseInt(tableNumber);
      if (invoiceId) body.invoiceId = invoiceId;

      // Add report type for PDF exports
      if (format === 'pdf') {
        body.reportType = reportType;
      }

      // Use fetchWithRetry for automatic retry on transient failures
      const response = await fetchWithRetry('/api/reports/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }, 3);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Export failed');
      }

      // Get the PDF blob directly
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-${reportType}-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showSuccess('PDF export completed successfully!');
    } catch (err) {
      console.error('Export error:', err);
      const errorMessage = await handleApiError(err, 'Failed to export report');
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="flex items-center gap-2 mb-4">
        <Download className="text-blue-600" size={24} />
        <h2 className="text-lg font-semibold text-gray-900">Export Reports</h2>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Export invoice data and revenue reports based on your current filters.
      </p>

      {/* PDF Report Type Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          PDF Report Type
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setReportType('daily')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              reportType === 'daily'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Daily Summary
          </button>
          <button
            onClick={() => setReportType('monthly')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              reportType === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Monthly Summary
          </button>
        </div>
      </div>

      {/* Export Button */}
      <div className="w-full">
        {/* PDF Export */}
        <button
          onClick={() => handleExport('pdf')}
          disabled={isExporting}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 active:bg-red-800 active:scale-98 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-100 shadow-md hover:shadow-lg"
        >
          {isExporting ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Generating PDF...
            </>
          ) : (
            <>
              <FileText size={20} />
              Export as PDF
            </>
          )}
        </button>
      </div>

      {/* Error Display with Retry */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800 mb-2">{error}</p>
          <RetryButton
            onRetry={() => handleExport('pdf')}
            label="Retry Export"
            className="text-sm px-3 py-1"
          />
        </div>
      )}

      {/* Active Filters Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs font-medium text-gray-700 mb-2">Active Filters:</p>
        <div className="flex flex-wrap gap-2">
          {startDate && (
            <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
              From: {new Date(startDate).toLocaleDateString()}
            </span>
          )}
          {endDate && (
            <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
              To: {new Date(endDate).toLocaleDateString()}
            </span>
          )}
          {tableNumber && (
            <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
              Table: {tableNumber}
            </span>
          )}
          {invoiceId && (
            <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
              Invoice: {invoiceId}
            </span>
          )}
          {!startDate && !endDate && !tableNumber && !invoiceId && (
            <span className="text-xs text-gray-500">No filters applied (all data)</span>
          )}
        </div>
      </div>
    </div>
  );
}
