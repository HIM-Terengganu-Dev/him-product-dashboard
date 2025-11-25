'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface DateRecord {
  report_date: string;
  num_campaigns: number;
  num_groups: number;
  total_cost: number;
  total_revenue: number;
  total_orders: number;
  last_uploaded: string | null;
}

interface OperationLog {
    id: number;
    operation_type: string;
    report_date: string;
    user_email: string;
    action_details: any;
    created_at: string;
}

export default function LiveGMVRecordsPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [records, setRecords] = useState<DateRecord[]>([]);
    const [deletingDate, setDeletingDate] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [logs, setLogs] = useState<OperationLog[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [showLogs, setShowLogs] = useState(false);
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

    const fetchRecords = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/tiktok/live-gmv/dates');
            
            if (!response.ok) {
                throw new Error('Failed to fetch records');
            }

            const data = await response.json();
            setRecords(data.data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch records');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    const fetchLogs = useCallback(async (date?: string) => {
        setLogsLoading(true);
        try {
            const url = date 
                ? `/api/tiktok/live-gmv/logs?date=${encodeURIComponent(date)}&limit=50`
                : `/api/tiktok/live-gmv/logs?limit=100`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch logs');
            }
            const data = await response.json();
            setLogs(data.data || []);
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        } finally {
            setLogsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (showLogs) {
            fetchLogs();
        }
    }, [showLogs, fetchLogs]);

    const handleDelete = async (date: string) => {
        if (confirmDelete !== date) {
            setConfirmDelete(date);
            return;
        }

        setDeletingDate(date);
        try {
            // Ensure date is in YYYY-MM-DD format and properly encoded
            const dateParam = encodeURIComponent(date);
            const userEmailParam = userEmail ? `&userEmail=${encodeURIComponent(userEmail)}` : '';
            const response = await fetch(`/api/tiktok/live-gmv/delete?date=${dateParam}${userEmailParam}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to delete records');
            }

            // Refresh the list and logs
            await fetchRecords();
            if (showLogs) {
                await fetchLogs();
            }
            setConfirmDelete(null);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete records');
        } finally {
            setDeletingDate(null);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('ms-MY', {
            style: 'currency',
            currency: 'MYR',
            minimumFractionDigits: 2,
        }).format(value);
    };

    const formatNumber = (value: number) => {
        return value.toLocaleString('ms-MY');
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const formatDateTime = (dateStr: string | null) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Live GMV Records Management
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">Manage and view all uploaded Live GMV data by date</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href="/sales-portal/live-gmv/upload"
                                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors shadow-md"
                            >
                                📤 Upload Data
                            </Link>
                            <Link
                                href="/sales-portal/live-gmv"
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                ← Back to Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Loading State */}
                {loading && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                            <span className="ml-4 text-gray-600">Loading records...</span>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg mb-6">
                        <div className="flex items-center">
                            <svg className="w-6 h-6 text-red-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <h3 className="text-lg font-bold text-red-900">Error</h3>
                                <p className="text-red-800">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Records Table */}
                {!loading && !error && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h2 className="text-lg font-bold text-gray-900">
                                Records by Date ({records.length} {records.length === 1 ? 'date' : 'dates'})
                            </h2>
                        </div>

                        {records.length === 0 ? (
                            <div className="p-12 text-center">
                                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-gray-500 text-lg mb-2">No records found</p>
                                <p className="text-gray-400 text-sm mb-6">Upload your first Live GMV data to get started</p>
                                <Link
                                    href="/sales-portal/live-gmv/upload"
                                    className="inline-block px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors shadow-md"
                                >
                                    Upload Data
                                </Link>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Report Date
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Campaigns
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Groups
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Total Cost
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Total Revenue
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Orders
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Last Uploaded
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {records.map((record) => (
                                            <tr key={record.report_date} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {formatDate(record.report_date)}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {record.report_date}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-gray-900 font-medium">
                                                        {formatNumber(record.num_campaigns)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-sm text-gray-900 font-medium">
                                                        {formatNumber(record.num_groups)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <span className="text-sm text-gray-900 font-medium">
                                                        {formatCurrency(record.total_cost)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <span className="text-sm font-bold text-green-600">
                                                        {formatCurrency(record.total_revenue)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <span className="text-sm text-gray-900 font-medium">
                                                        {formatNumber(record.total_orders)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-xs text-gray-500">
                                                        {formatDateTime(record.last_uploaded)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link
                                                            href={`/sales-portal/live-gmv/upload?date=${record.report_date}`}
                                                            className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                                                        >
                                                            Update
                                                        </Link>
                                                        {confirmDelete === record.report_date ? (
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => handleDelete(record.report_date)}
                                                                    disabled={deletingDate === record.report_date}
                                                                    className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                                                >
                                                                    {deletingDate === record.report_date ? 'Deleting...' : 'Confirm'}
                                                                </button>
                                                                <button
                                                                    onClick={() => setConfirmDelete(null)}
                                                                    className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleDelete(record.report_date)}
                                                                disabled={deletingDate === record.report_date}
                                                                className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                                                            >
                                                                {deletingDate === record.report_date ? 'Deleting...' : 'Delete'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Operation Logs Section */}
                {!loading && !error && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mt-6">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900">
                                Operation Logs
                            </h2>
                            <button
                                onClick={() => {
                                    setShowLogs(!showLogs);
                                    if (!showLogs) {
                                        fetchLogs();
                                    }
                                }}
                                className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                            >
                                {showLogs ? 'Hide Logs' : 'Show Logs'}
                            </button>
                        </div>

                        {showLogs && (
                            <div className="p-6">
                                {logsLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                        <span className="ml-3 text-gray-600">Loading logs...</span>
                                    </div>
                                ) : logs.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        No operation logs found
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Time
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Operation
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Date
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        User
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Details
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {logs.map((log) => (
                                                    <tr key={log.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                            {formatDateTime(log.created_at)}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                                log.operation_type === 'upload' || log.operation_type === 'manual_entry' 
                                                                    ? 'bg-blue-100 text-blue-800'
                                                                    : log.operation_type === 'update'
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}>
                                                                {log.operation_type.replace('_', ' ').toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                            {formatDate(log.report_date)}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                            {log.user_email}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">
                                                            {log.action_details ? (
                                                                <div className="space-y-1">
                                                                    {log.action_details.records_inserted !== undefined && (
                                                                        <div>Inserted: {log.action_details.records_inserted}</div>
                                                                    )}
                                                                    {log.action_details.records_updated !== undefined && (
                                                                        <div>Updated: {log.action_details.records_updated}</div>
                                                                    )}
                                                                    {log.action_details.records_deleted !== undefined && (
                                                                        <div>Deleted: {log.action_details.records_deleted}</div>
                                                                    )}
                                                                    {log.action_details.records_processed !== undefined && (
                                                                        <div>Processed: {log.action_details.records_processed}</div>
                                                                    )}
                                                                    {log.action_details.filename && (
                                                                        <div className="text-xs text-gray-500 truncate max-w-xs" title={log.action_details.filename}>
                                                            File: {log.action_details.filename}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-400">-</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

