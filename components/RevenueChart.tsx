'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { DailyReport, MonthlyReport } from '@/types';
import { BarChart3 } from 'lucide-react';

type ReportType = 'daily' | 'monthly';

interface RevenueChartProps {
  startDate?: string;
  endDate?: string;
}

export function RevenueChart({ startDate, endDate }: RevenueChartProps) {
  const { token } = useAuth();
  const [reportType, setReportType] = useState<ReportType>('daily');

  // Calculate default date range (last 30 days)
  const getDefaultDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  const defaultRange = getDefaultDateRange();
  const effectiveStartDate = startDate || defaultRange.startDate;
  const effectiveEndDate = endDate || defaultRange.endDate;

  // Fetch daily reports
  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: ['daily-revenue', effectiveStartDate, effectiveEndDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: effectiveStartDate,
        endDate: effectiveEndDate,
      });

      const response = await fetch(`/api/reports/daily?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch daily reports');
      }

      const data = await response.json();
      return data.reports as DailyReport[];
    },
    enabled: !!token && reportType === 'daily',
  });

  // Fetch monthly reports
  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ['monthly-revenue', effectiveStartDate, effectiveEndDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: effectiveStartDate,
        endDate: effectiveEndDate,
      });

      const response = await fetch(`/api/reports/monthly?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch monthly reports');
      }

      const data = await response.json();
      return data.reports as MonthlyReport[];
    },
    enabled: !!token && reportType === 'monthly',
  });

  const isLoading = reportType === 'daily' ? dailyLoading : monthlyLoading;
  const reports = reportType === 'daily' ? dailyData : monthlyData;

  // Calculate max revenue for scaling
  const maxRevenue = reports?.reduce((max, report) => 
    Math.max(max, report.totalRevenue), 0) || 0;

  // Calculate total revenue and invoice count
  const totalRevenue = reports?.reduce((sum, report) => sum + report.totalRevenue, 0) || 0;
  const totalInvoices = reports?.reduce((sum, report) => sum + report.invoiceCount, 0) || 0;

  const formatLabel = (report: DailyReport | MonthlyReport) => {
    if ('date' in report) {
      // Daily report
      const date = new Date(report.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      // Monthly report
      return `${report.month} ${report.year}`;
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="text-blue-600" size={24} />
          <h2 className="text-lg font-semibold text-gray-900">Revenue Overview</h2>
        </div>
        
        {/* Toggle between daily and monthly */}
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          <button
            onClick={() => setReportType('daily')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              reportType === 'daily'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setReportType('monthly')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              reportType === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium">Total Revenue</p>
          <p className="text-2xl font-bold text-blue-900">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium">Total Invoices</p>
          <p className="text-2xl font-bold text-green-900">{totalInvoices}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-sm text-purple-600 font-medium">Average per Invoice</p>
          <p className="text-2xl font-bold text-purple-900">
            ${totalInvoices > 0 ? (totalRevenue / totalInvoices).toFixed(2) : '0.00'}
          </p>
        </div>
      </div>

      {/* Chart */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : !reports || reports.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <BarChart3 className="mx-auto mb-2 text-gray-400" size={48} />
          <p>No revenue data available for the selected period</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report, index) => {
            const barWidth = maxRevenue > 0 ? (report.totalRevenue / maxRevenue) * 100 : 0;
            
            return (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">{formatLabel(report)}</span>
                  <span className="text-gray-600">
                    ${report.totalRevenue.toFixed(2)} ({report.invoiceCount} invoices)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full flex items-center justify-end pr-2 transition-all duration-300"
                    style={{ width: `${Math.max(barWidth, 2)}%` }}
                  >
                    {barWidth > 15 && (
                      <span className="text-xs font-medium text-white">
                        ${report.totalRevenue.toFixed(0)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Date Range Info */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600 text-center">
          Showing {reportType} revenue from{' '}
          <span className="font-medium">{new Date(effectiveStartDate).toLocaleDateString()}</span>
          {' '}to{' '}
          <span className="font-medium">{new Date(effectiveEndDate).toLocaleDateString()}</span>
        </p>
      </div>
    </div>
  );
}
