'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type { MetricsWithChange, GroupPerformance, PercentageChange } from '../../../types/tiktok';

export default function LiveGMVDashboard() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [metrics, setMetrics] = useState<MetricsWithChange | null>(null);
    const [groups, setGroups] = useState<GroupPerformance[]>([]);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [dateLoaded, setDateLoaded] = useState(false);
    const [comparisonPeriod, setComparisonPeriod] = useState<'yesterday' | 'lastWeek' | 'lastMonth' | 'lastThreeMonths'>('yesterday');

    // Fetch latest available date on mount
    useEffect(() => {
        const fetchLatestDate = async () => {
            try {
                const response = await fetch('/api/tiktok/live-gmv/latest-date');
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data?.latest_date) {
                        setSelectedDate(data.data.latest_date);
                    } else {
                        // If no data found, use today's date as fallback
                        setSelectedDate(new Date().toISOString().split('T')[0]);
                    }
                } else {
                    // Fallback to today's date if API fails
                    setSelectedDate(new Date().toISOString().split('T')[0]);
                }
            } catch (err) {
                // Fallback to today's date on error
                setSelectedDate(new Date().toISOString().split('T')[0]);
            } finally {
                setDateLoaded(true);
            }
        };

        fetchLatestDate();
    }, []);

    // Fetch data when date is loaded and whenever date or comparison period changes
    useEffect(() => {
        if (dateLoaded && selectedDate) {
            fetchData();
        }
    }, [selectedDate, comparisonPeriod, dateLoaded]);

    const fetchData = async () => {
        if (!selectedDate) return;
        
        setLoading(true);
        setError(null);
        try {
            const [metricsRes, groupsRes] = await Promise.all([
                fetch(`/api/tiktok/live-gmv/metrics?date=${selectedDate}&comparisonPeriod=${comparisonPeriod}`),
                fetch(`/api/tiktok/live-gmv/groups?date=${selectedDate}`)
            ]);

            if (!metricsRes.ok) {
                const errorData = await metricsRes.json();
                throw new Error(errorData.message || 'Failed to fetch metrics');
            }
            if (!groupsRes.ok) {
                throw new Error('Failed to fetch group data');
            }

            const metricsData = await metricsRes.json();
            const groupsData = await groupsRes.json();

            if (metricsData.data) {
                setMetrics(metricsData.data);
            } else {
                throw new Error('Invalid metrics data received');
            }
            
            if (groupsData.data) {
                setGroups(Array.isArray(groupsData.data) ? groupsData.data : []);
            } else {
                setGroups([]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch data');
        } finally {
            setLoading(false);
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

    const getChangeDisplay = (change: number | null) => {
        if (change === null) return <span className="text-gray-400 text-xs">N/A</span>;
        const isPositive = change >= 0;
        const color = isPositive ? 'text-green-600' : 'text-red-600';
        const bgColor = isPositive ? 'bg-green-50' : 'bg-red-50';
        const icon = isPositive ? '↑' : '↓';
        return (
            <span className={`${color} ${bgColor} px-2 py-1 rounded-full text-xs font-bold`}>
                {icon} {Math.abs(change).toFixed(1)}%
            </span>
        );
    };

    const getComparisonLabel = () => {
        switch (comparisonPeriod) {
            case 'yesterday': return 'vs Yesterday';
            case 'lastWeek': return 'vs Last Week';
            case 'lastMonth': return 'vs Last Month';
            case 'lastThreeMonths': return 'vs 3 Months Ago';
        }
    };

    const getChangeValue = (): PercentageChange | null => {
        if (!metrics) return null;
        try {
            switch (comparisonPeriod) {
                case 'yesterday': return metrics.vsYesterday || null;
                case 'lastWeek': return metrics.vsLastWeek || null;
                case 'lastMonth': return metrics.vsLastMonth || null;
                case 'lastThreeMonths': return metrics.vsLastThreeMonths || null;
                default: return null;
            }
        } catch (err) {
            console.error('Error getting change value:', err);
            return null;
        }
    };

    const changeData = getChangeValue();

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent truncate">
                                TikTok Live GMV Performance
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1 hidden sm:block">Real-time campaign analytics and metrics</p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                            {/* Hide data entry buttons on mobile - CEO view only needs viewing */}
                            <div className="hidden md:flex items-center gap-3">
                                <Link
                                    href="/sales-portal/live-gmv/records"
                                    className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <span className="hidden lg:inline">📋 Manage Records</span>
                                    <span className="lg:hidden">📋 Records</span>
                                </Link>
                                <Link
                                    href="/sales-portal/live-gmv/manual-entry"
                                    className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <span className="hidden lg:inline">✏️ Manual Entry</span>
                                    <span className="lg:hidden">✏️ Entry</span>
                                </Link>
                                <Link
                                    href="/sales-portal/live-gmv/upload"
                                    className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors shadow-md"
                                >
                                    <span className="hidden lg:inline">📤 Upload Data</span>
                                    <span className="lg:hidden">📤 Upload</span>
                                </Link>
                            </div>
                            <Link
                                href="/sales-portal"
                                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors ml-auto sm:ml-0"
                            >
                                <span className="hidden sm:inline">← Back</span>
                                <span className="sm:hidden">←</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
                {/* Date & Comparison Selector */}
                <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 border border-gray-100">
                    <div className="flex flex-col gap-3 sm:gap-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                <label className="text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Date:</label>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <input
                                        type="date"
                                        value={selectedDate || ''}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                    {selectedDate && (
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const response = await fetch('/api/tiktok/live-gmv/latest-date');
                                                    if (response.ok) {
                                                        const data = await response.json();
                                                        if (data.success && data.data?.latest_date) {
                                                            setSelectedDate(data.data.latest_date);
                                                        }
                                                    }
                                                } catch (err) {
                                                    console.error('Failed to fetch latest date:', err);
                                                }
                                            }}
                                            className="px-2 sm:px-3 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors whitespace-nowrap"
                                        >
                                            📅 Latest
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                                <span className="text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Compare:</span>
                                <div className="flex flex-wrap items-center gap-2">
                                    {(['yesterday', 'lastWeek', 'lastMonth', 'lastThreeMonths'] as const).map((period) => (
                                        <button
                                            key={period}
                                            onClick={() => setComparisonPeriod(period)}
                                            className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-medium rounded-lg transition-colors ${
                                                comparisonPeriod === period
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            {period === 'yesterday' && 'Yesterday'}
                                            {period === 'lastWeek' && 'Last Week'}
                                            {period === 'lastMonth' && 'Last Month'}
                                            {period === 'lastThreeMonths' && '3 Months'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                        <p className="text-red-800 font-medium">{error}</p>
                    </div>
                ) : metrics ? (
                    <>
                        {/* 6 Key Metrics */}
                        <div className="space-y-3 sm:space-y-4">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                                <span className="w-1.5 sm:w-2 h-6 sm:h-8 bg-indigo-600 rounded-full"></span>
                                <span className="truncate">Key Performance Metrics</span>
                                <span className="text-xs sm:text-sm font-normal text-gray-500 ml-2 hidden sm:inline">{getComparisonLabel()}</span>
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                {/* 1. Cost */}
                                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 hover:shadow-xl transition-shadow duration-200">
                                    <div className="flex items-start justify-between mb-2 sm:mb-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">1. Cost</p>
                                            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2 truncate">{formatCurrency(metrics.total_cost)}</p>
                                            <p className="text-xs text-gray-500 mt-1">Total Ad Spend</p>
                                        </div>
                                        <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-md flex-shrink-0 ml-2">
                                            <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-gray-100">
                                        <span className="text-xs text-gray-700 font-medium hidden sm:inline">{getComparisonLabel()}</span>
                                        <span className="text-xs text-gray-700 font-medium sm:hidden">vs</span>
                                        {changeData?.cost !== undefined && getChangeDisplay(changeData.cost)}
                                    </div>
                                </div>

                                {/* 2. Orders (SKU) */}
                                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 hover:shadow-xl transition-shadow duration-200">
                                    <div className="flex items-start justify-between mb-2 sm:mb-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">2. Orders (SKU)</p>
                                            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2 truncate">{formatNumber(metrics.total_orders)}</p>
                                            <p className="text-xs text-gray-500 mt-1">Total Orders</p>
                                        </div>
                                        <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md flex-shrink-0 ml-2">
                                            <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-gray-100">
                                        <span className="text-xs text-gray-700 font-medium hidden sm:inline">{getComparisonLabel()}</span>
                                        <span className="text-xs text-gray-700 font-medium sm:hidden">vs</span>
                                        {changeData?.orders !== undefined && getChangeDisplay(changeData.orders)}
                                    </div>
                                </div>

                                {/* 3. Gross Revenue */}
                                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 hover:shadow-xl transition-shadow duration-200">
                                    <div className="flex items-start justify-between mb-2 sm:mb-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">3. Gross Revenue</p>
                                            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2 truncate">{formatCurrency(metrics.total_revenue)}</p>
                                            <p className="text-xs text-gray-500 mt-1">Total Sales</p>
                                        </div>
                                        <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-md flex-shrink-0 ml-2">
                                            <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-gray-100">
                                        <span className="text-xs text-gray-700 font-medium hidden sm:inline">{getComparisonLabel()}</span>
                                        <span className="text-xs text-gray-700 font-medium sm:hidden">vs</span>
                                        {changeData?.revenue !== undefined && getChangeDisplay(changeData.revenue)}
                                    </div>
                                </div>

                                {/* 4. Cost per Purchase */}
                                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 hover:shadow-xl transition-shadow duration-200">
                                    <div className="flex items-start justify-between mb-2 sm:mb-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">4. Cost per Purchase</p>
                                            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2 truncate">{formatCurrency(metrics.cost_per_order)}</p>
                                            <p className="text-xs text-gray-500 mt-1">Cost ÷ Orders</p>
                                        </div>
                                        <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-md flex-shrink-0 ml-2">
                                            <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-gray-100">
                                        <span className="text-xs text-gray-700 font-medium hidden sm:inline">{getComparisonLabel()}</span>
                                        <span className="text-xs text-gray-700 font-medium sm:hidden">vs</span>
                                        {changeData?.costPerOrder !== undefined && getChangeDisplay(changeData.costPerOrder)}
                                    </div>
                                </div>

                                {/* 5. ROAS */}
                                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 hover:shadow-xl transition-shadow duration-200">
                                    <div className="flex items-start justify-between mb-2 sm:mb-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">5. ROAS</p>
                                            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2 truncate">{metrics.roas.toFixed(2)}</p>
                                            <p className="text-xs text-gray-500 mt-1">Return on Ad Spend</p>
                                        </div>
                                        <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 shadow-md flex-shrink-0 ml-2">
                                            <svg className="h-5 w-5 sm:h-6 sm:w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-gray-100">
                                        <span className="text-xs text-gray-700 font-medium hidden sm:inline">{getComparisonLabel()}</span>
                                        <span className="text-xs text-gray-700 font-medium sm:hidden">vs</span>
                                        {changeData?.roas !== undefined && getChangeDisplay(changeData.roas)}
                                    </div>
                                </div>

                                {/* Summary Card */}
                                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 text-white">
                                    <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider opacity-90">Summary</p>
                                    <p className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">{formatNumber(metrics.num_campaigns)} Campaigns</p>
                                    <p className="text-xs sm:text-sm opacity-90 mt-1">Across {formatNumber(metrics.num_groups)} Accounts</p>
                                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/20">
                                        <p className="text-xs opacity-75">For every RM 1 spent:</p>
                                        <p className="text-lg sm:text-xl font-bold">RM {metrics.roas.toFixed(2)} return</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Campaign Groups Performance */}
                        <div className="space-y-3 sm:space-y-4">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                                <span className="w-1.5 sm:w-2 h-6 sm:h-8 bg-purple-600 rounded-full"></span>
                                <span className="truncate">Performance by Campaign Account</span>
                            </h2>

                            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                                <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Account</th>
                                                <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Campaigns</th>
                                                <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Cost</th>
                                                <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Orders</th>
                                                <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Revenue</th>
                                                <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap hidden sm:table-cell">Cost/Order</th>
                                                <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">ROAS</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-100">
                                            {groups.map((group, index) => (
                                                <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                                                        <span className="font-semibold text-sm sm:text-base text-gray-900">{group.campaign_group}</span>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm text-gray-700">{group.num_campaigns}</td>
                                                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">{formatCurrency(group.total_cost)}</td>
                                                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm text-gray-700">{formatNumber(group.total_orders_sku)}</td>
                                                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">{formatCurrency(group.total_revenue)}</td>
                                                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-sm text-gray-700 hidden sm:table-cell">
                                                        {group.total_orders_sku > 0 
                                                            ? formatCurrency(group.total_cost / group.total_orders_sku)
                                                            : 'N/A'
                                                        }
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                                                        <span className={`text-sm font-bold ${group.roas >= 3 ? 'text-green-600' : group.roas >= 2 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                            {group.roas.toFixed(2)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
                        <p className="text-yellow-800">No data available for the selected date.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

