'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    ChartBarIcon,
    CurrencyDollarIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    CalendarIcon,
    RefreshIcon
} from '@/components/Icons';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock data for prototype
const mockSalesData = {
    totalSales: 1250000,
    salesGrowth: 12.5,
    totalCost: 385000,
    costGrowth: -8.3,
    salesByProduct: [
        { name: 'HIM Premium', value: 550000, percentage: 44 },
        { name: 'HIM Standard', value: 425000, percentage: 34 },
        { name: 'HIM Lite', value: 275000, percentage: 22 },
    ],
    salesBySource: [
        { name: 'Facebook', value: 450000, percentage: 36 },
        { name: 'Instagram', value: 350000, percentage: 28 },
        { name: 'Shopee', value: 250000, percentage: 20 },
        { name: 'Lazada', value: 150000, percentage: 12 },
        { name: 'Website', value: 50000, percentage: 4 },
    ],
    monthlySales: [
        { month: 'Jul', sales: 180000, cost: 55000 },
        { month: 'Aug', sales: 195000, cost: 58000 },
        { month: 'Sep', sales: 210000, cost: 62000 },
        { month: 'Oct', sales: 225000, cost: 65000 },
        { month: 'Nov', sales: 240000, cost: 70000 },
        { month: 'Dec', sales: 200000, cost: 75000 },
    ],
    costMetrics: {
        ttam: 2450,
        gmv: 1850000,
        lgmv: 240000,
        costTTAM: 157.14, // Cost per TTAM
        costGMV: 20.81, // Cost as % of GMV
        costLGMV: 160.42, // Cost as % of LGMV
    },
    marketingMetrics: {
        result: 8540,
        impression: 1250000,
        thruplay: 95000,
        click: 42500,
        ctr: 3.4, // Click-through rate
        cpm: 30.8, // Cost per thousand impressions
    }
};

const COLORS = {
    primary: ['#6366f1', '#8b5cf6', '#a855f7'],
    sources: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'],
    success: '#10b981',
    danger: '#ef4444',
};

const SalesPortalPrototype = () => {
    const [selectedPeriod, setSelectedPeriod] = useState('month');

    const MetricCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'indigo' }: any) => (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-200">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <div className={`p-3 rounded-xl bg-gradient-to-br from-${color}-500 to-${color}-600 shadow-md`}>
                            <Icon className="h-6 w-6 text-white" />
                        </div>
                        <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">{title}</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
                    {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${trend === 'up' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {trend === 'up' ? (
                            <ArrowUpIcon className="h-4 w-4 text-green-600" />
                        ) : (
                            <ArrowDownIcon className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`text-sm font-bold ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                            {trendValue}%
                        </span>
                    </div>
                )}
            </div>
        </div>
    );

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('ms-MY', {
            style: 'currency',
            currency: 'MYR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const formatNumber = (value: number) => {
        return value.toLocaleString('ms-MY');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                HIM Product Sales Portal
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">Sales Performance & BI Dashboard - Prototype</p>
                        </div>
                        <Link
                            href="/sales-portal"
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            ← Back to Dev Notice
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Period Selector */}
                <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-gray-500" />
                            <span className="text-sm font-semibold text-gray-700">Period:</span>
                        </div>
                        <div className="flex gap-2">
                            {['Today', 'Week', 'Month', 'Quarter', 'Year'].map((period) => (
                                <button
                                    key={period}
                                    onClick={() => setSelectedPeriod(period.toLowerCase())}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${selectedPeriod === period.toLowerCase()
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {period}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Alert Banner */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-blue-800 font-medium">
                                📊 This is a PROTOTYPE showing the final portal design. All data shown is mock/sample data for demonstration purposes.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Section 1: SALES METRICS */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="w-2 h-8 bg-indigo-600 rounded-full"></span>
                        Sales Performance
                    </h2>

                    {/* Row 1: Total Sales Card */}
                    <MetricCard
                        title="1. Total Sales"
                        value={formatCurrency(mockSalesData.totalSales)}
                        subtitle="Jumlah Jualan Keseluruhan"
                        icon={CurrencyDollarIcon}
                        trend="up"
                        trendValue={mockSalesData.salesGrowth}
                        color="indigo"
                    />

                    {/* Row 2: Sales by Product & Source */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Sales by Product */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-200">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">2. Sales by Product</h3>
                            <p className="text-sm text-gray-500 mb-4">Jualan Mengikut Jenis Produk</p>
                            <div className="relative h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={mockSalesData.salesByProduct}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={110}
                                            paddingAngle={5}
                                            dataKey="value"
                                            cornerRadius={5}
                                        >
                                            {mockSalesData.salesByProduct.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS.primary[index % COLORS.primary.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: any) => formatCurrency(value)} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                    <span className="text-2xl font-bold text-gray-800">{formatCurrency(mockSalesData.totalSales)}</span>
                                    <p className="text-xs text-gray-500">Total</p>
                                </div>
                            </div>
                        </div>

                        {/* Sales by Source */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-200">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">3. Sales by Source</h3>
                            <p className="text-sm text-gray-500 mb-4">Jualan Mengikut Sumber/Saluran</p>
                            <div className="relative h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={mockSalesData.salesBySource} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis type="category" dataKey="name" width={80} />
                                        <Tooltip formatter={(value: any) => formatCurrency(value)} />
                                        <Bar dataKey="value" fill="#6366f1" radius={[0, 8, 8, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: COST METRICS */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="w-2 h-8 bg-purple-600 rounded-full"></span>
                        Cost Analysis
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Total Cost */}
                        <MetricCard
                            title="4. Total Cost"
                            value={formatCurrency(mockSalesData.totalCost)}
                            subtitle="Jumlah Kos Keseluruhan"
                            icon={ChartBarIcon}
                            trend="down"
                            trendValue={Math.abs(mockSalesData.costGrowth)}
                            color="purple"
                        />

                        {/* Cost TTAM */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-200">
                            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">5. Cost TTAM</p>
                            <p className="text-3xl font-bold text-gray-900 mb-1">{formatCurrency(mockSalesData.costMetrics.costTTAM)}</p>
                            <p className="text-sm text-gray-500">per unit (Kos Terhadap TTAM)</p>
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-xs text-gray-500">Total TTAM: <span className="font-semibold text-gray-700">{formatNumber(mockSalesData.costMetrics.ttam)}</span></p>
                            </div>
                        </div>

                        {/* Cost GMV */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-200">
                            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">6. Cost GMV</p>
                            <p className="text-3xl font-bold text-gray-900 mb-1">{mockSalesData.costMetrics.costGMV.toFixed(2)}%</p>
                            <p className="text-sm text-gray-500">Kos Terhadap GMV</p>
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-xs text-gray-500">GMV: <span className="font-semibold text-gray-700">{formatCurrency(mockSalesData.costMetrics.gmv)}</span></p>
                            </div>
                        </div>

                        {/* Cost LGMV */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-200">
                            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">7. Cost LGMV</p>
                            <p className="text-3xl font-bold text-gray-900 mb-1">{mockSalesData.costMetrics.costLGMV.toFixed(2)}%</p>
                            <p className="text-sm text-gray-500">Kos Terhadap LGMV</p>
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-xs text-gray-500">LGMV: <span className="font-semibold text-gray-700">{formatCurrency(mockSalesData.costMetrics.lgmv)}</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 3: MARKETING PERFORMANCE */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="w-2 h-8 bg-pink-600 rounded-full"></span>
                        Marketing Performance
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Result */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-200">
                            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">8. Result</p>
                            <p className="text-3xl font-bold text-gray-900 mb-1">{formatNumber(mockSalesData.marketingMetrics.result)}</p>
                            <p className="text-sm text-gray-500">Hasil Kempen</p>
                        </div>

                        {/* Impression */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-200">
                            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">9. Impression</p>
                            <p className="text-3xl font-bold text-gray-900 mb-1">{formatNumber(mockSalesData.marketingMetrics.impression)}</p>
                            <p className="text-sm text-gray-500">Pendedahan Iklan</p>
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-xs text-gray-500">CPM: <span className="font-semibold text-gray-700">{formatCurrency(mockSalesData.marketingMetrics.cpm)}</span></p>
                            </div>
                        </div>

                        {/* Thruplay */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-200">
                            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">10. Thruplay</p>
                            <p className="text-3xl font-bold text-gray-900 mb-1">{formatNumber(mockSalesData.marketingMetrics.thruplay)}</p>
                            <p className="text-sm text-gray-500">Tontonan Video</p>
                        </div>

                        {/* Click */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-200">
                            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">11. Click</p>
                            <p className="text-3xl font-bold text-gray-900 mb-1">{formatNumber(mockSalesData.marketingMetrics.click)}</p>
                            <p className="text-sm text-gray-500">Klik Pada Iklan</p>
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-xs text-gray-500">CTR: <span className="font-semibold text-gray-700">{mockSalesData.marketingMetrics.ctr}%</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Trend Chart */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Sales vs Cost Trend</h3>
                    <p className="text-sm text-gray-500 mb-4">6-Month Performance Overview</p>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={mockSalesData.monthlySales}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                                <Legend />
                                <Line type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={3} name="Sales" />
                                <Line type="monotone" dataKey="cost" stroke="#8b5cf6" strokeWidth={3} name="Cost" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Footer Note */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                        <RefreshIcon className="h-6 w-6 text-indigo-600 flex-shrink-0 mt-1" />
                        <div>
                            <h4 className="font-bold text-gray-900 mb-2">Next Steps for Full Implementation</h4>
                            <ul className="text-sm text-gray-700 space-y-1">
                                <li>✅ Data entry form for daily sales input</li>
                                <li>✅ Data validation and duplicate detection</li>
                                <li>✅ Historical data migration from existing sources</li>
                                <li>✅ User role management (view-only vs data entry)</li>
                                <li>✅ Export to Excel/PDF functionality</li>
                                <li>✅ Real-time data updates and refresh</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesPortalPrototype;
