'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface CampaignRow {
  id: string;
  campaign_id: string;
  campaign_name: string;
  cost: string;
  net_cost: string;
  orders_sku: string;
  gross_revenue: string;
  roi: string;
}

function ManualEntryContent() {
  const searchParams = useSearchParams();
  const [reportDate, setReportDate] = useState(() => {
    if (searchParams) {
      const dateParam = searchParams.get('date');
      if (dateParam) return dateParam;
    }
    return new Date().toISOString().split('T')[0];
  });
  const [userEmail, setUserEmail] = useState<string>('');

  // Get user email from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUserEmail(userData.email || '');
        } catch (error) {
          console.error('Failed to parse user data:', error);
        }
      }
    }
  }, []);
  
  const [rows, setRows] = useState<CampaignRow[]>([
    {
      id: '1',
      campaign_id: '',
      campaign_name: '',
      cost: '',
      net_cost: '',
      orders_sku: '',
      gross_revenue: '',
      roi: '',
    },
  ]);
  
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const addRow = () => {
    setRows([
      ...rows,
      {
        id: Date.now().toString(),
        campaign_id: '',
        campaign_name: '',
        cost: '',
        net_cost: '',
        orders_sku: '',
        gross_revenue: '',
        roi: '',
      },
    ]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter((row) => row.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof CampaignRow, value: string) => {
    setRows(
      rows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleSubmit = async () => {
    if (!reportDate) {
      alert('Please select a report date');
      return;
    }

    // Validate rows
    const validRows = rows.filter(
      (row) =>
        row.campaign_id.trim() &&
        row.campaign_name.trim() &&
        (row.cost.trim() || row.gross_revenue.trim())
    );

    if (validRows.length === 0) {
      alert('Please enter at least one valid campaign record');
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      // Format data for API
      const formattedData = validRows.map((row) => {
        return {
          campaign_id: row.campaign_id.trim(),
          campaign_name: row.campaign_name.trim(),
          campaign_group: row.campaign_name.trim(), // Use campaign name directly as group
          cost: parseFloat(row.cost) || 0,
          net_cost: parseFloat(row.net_cost) || parseFloat(row.cost) || 0,
          orders_sku: parseInt(row.orders_sku) || 0,
          gross_revenue: parseFloat(row.gross_revenue) || 0,
          roi: parseFloat(row.roi) || 0,
          currency: 'RM',
        };
      });

      const response = await fetch('/api/tiktok/product-gmv/manual-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportDate,
          data: formattedData,
          userEmail: userEmail || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to save data');
      }

      setResult({
        success: true,
        message: data.message || `Successfully saved ${data.recordsInserted || formattedData.length} records`,
      });

      // Clear form on success
      if (data.success) {
        setRows([
          {
            id: Date.now().toString(),
            campaign_id: '',
            campaign_name: '',
            cost: '',
            net_cost: '',
            orders_sku: '',
            gross_revenue: '',
            roi: '',
          },
        ]);
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save data',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
                Manual Data Entry
              </h1>
              <p className="text-sm text-gray-600 mt-1">Enter Product GMV campaign data manually</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/sales-portal/tiktok/product-gmv"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Instructions */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-blue-900 mb-2">How to Enter Data</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Select the report date for this data</li>
                <li>Enter campaign information in the table below</li>
                <li><strong>Campaign Group:</strong> Campaign names are used directly as group names. No bracket detection is performed.</li>
                <li>Click &quot;+ Add Row&quot; to add more campaigns</li>
                <li>Click the &quot;×&quot; button to remove a row</li>
                <li>Click &quot;Save Data&quot; when done</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Date Selection */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Report Date <span className="text-red-500">*</span>
              {searchParams?.get('date') && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-100 rounded">
                  Update Mode
                </span>
              )}
            </label>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              disabled={submitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              Select the date this data represents. Entering data for an existing date will update all records for that date.
            </p>
          </div>
        </div>

        {/* Data Entry Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Campaign Data</h2>
            <button
              onClick={addRow}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + Add Row
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign Name</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net Cost</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Orders (SKU)</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Revenue</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ROI</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={row.campaign_id}
                        onChange={(e) => updateRow(row.id, 'campaign_id', e.target.value)}
                        placeholder="1234567890"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        disabled={submitting}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={row.campaign_name}
                        onChange={(e) => updateRow(row.id, 'campaign_name', e.target.value)}
                        placeholder="Campaign Name"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        disabled={submitting}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={row.cost}
                        onChange={(e) => updateRow(row.id, 'cost', e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        disabled={submitting}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={row.net_cost}
                        onChange={(e) => updateRow(row.id, 'net_cost', e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        disabled={submitting}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={row.orders_sku}
                        onChange={(e) => updateRow(row.id, 'orders_sku', e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        disabled={submitting}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={row.gross_revenue}
                        onChange={(e) => updateRow(row.id, 'gross_revenue', e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        disabled={submitting}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={row.roi}
                        onChange={(e) => updateRow(row.id, 'roi', e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        disabled={submitting}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {rows.length > 1 && (
                        <button
                          onClick={() => removeRow(row.id)}
                          disabled={submitting}
                          className="text-red-600 hover:text-red-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ×
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <Link
            href="/sales-portal/tiktok/product-gmv"
            className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={!reportDate || submitting || rows.length === 0}
            className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-pink-600 to-red-600 rounded-lg hover:from-pink-700 hover:to-red-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </span>
            ) : (
              '💾 Save Data'
            )}
          </button>
        </div>

        {/* Result Display */}
        {result && (
          <div className={`rounded-2xl p-6 border-2 ${
            result.success 
              ? 'bg-green-50 border-green-500' 
              : 'bg-red-50 border-red-500'
          }`}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                {result.success ? (
                  <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-bold mb-2 ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                  {result.success ? '✅ Data Saved Successfully!' : '❌ Failed to Save Data'}
                </h3>
                <p className={`text-sm ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.message}
                </p>
                {result.success && (
                  <div className="mt-4">
                    <Link
                      href="/sales-portal/tiktok/product-gmv"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-600 to-red-600 text-white font-semibold rounded-lg hover:from-pink-700 hover:to-red-700 transition-all shadow-md text-sm"
                    >
                      <span>View Dashboard</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ManualEntryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    }>
      <ManualEntryContent />
    </Suspense>
  );
}

