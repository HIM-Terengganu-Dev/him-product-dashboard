'use client';

import React from 'react';
import Link from 'next/link';

export default function TikTokSalesPortalPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
                                TikTok Sales Portal
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">Manage TikTok Shop analytics and performance data</p>
                        </div>
                        <Link
                            href="/?view=Sales Portal"
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            ← Back to Sales Portal
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Dashboard Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Live GMV Card */}
                    <Link
                        href="/sales-portal/live-gmv"
                        className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border-2 border-indigo-100 hover:border-indigo-300 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 mt-1">
                                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Live GMV</h3>
                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">LIVE</span>
                                </div>
                                <p className="text-sm sm:text-base text-gray-700 mb-4 leading-relaxed">
                                    TikTok Live stream sales performance, analytics, and real-time reporting. Track campaign metrics, revenue, orders, and ROAS.
                                </p>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">Cost</span>
                                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">Orders</span>
                                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">Revenue</span>
                                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">ROAS</span>
                                </div>
                                <div className="inline-flex items-center gap-2 text-indigo-600 font-semibold text-sm sm:text-base">
                                    <span>View Dashboard</span>
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Product GMV Card */}
                    <Link
                        href="/sales-portal/tiktok/product-gmv"
                        className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-8 border-2 border-pink-100 hover:border-pink-300 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 mt-1">
                                <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Product GMV</h3>
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">SOON</span>
                                </div>
                                <p className="text-sm sm:text-base text-gray-700 mb-4 leading-relaxed">
                                    TikTok Product campaign sales data, performance metrics, and analytics. Track product-level performance and campaign effectiveness.
                                </p>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs font-medium rounded">Campaigns</span>
                                    <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs font-medium rounded">Products</span>
                                    <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs font-medium rounded">Analytics</span>
                                </div>
                                <div className="inline-flex items-center gap-2 text-pink-600 font-semibold text-sm sm:text-base">
                                    <span>View Dashboard</span>
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Link
                            href="/sales-portal/live-gmv/upload"
                            className="flex items-center gap-3 p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-100"
                        >
                            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700">Upload Live GMV Data</span>
                        </Link>
                        <Link
                            href="/sales-portal/live-gmv/records"
                            className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100"
                        >
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700">View Records</span>
                        </Link>
                        <Link
                            href="/sales-portal/live-gmv/manual-entry"
                            className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-100"
                        >
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700">Manual Entry</span>
                        </Link>
                    </div>
                </div>

                {/* Features List */}
                <div className="mt-8 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Available Features:</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 text-gray-700 bg-white p-4 rounded-lg border border-gray-100">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm">Live GMV Analytics & Dashboard</span>
                        </div>

                        <div className="flex items-center gap-3 text-gray-700 bg-white p-4 rounded-lg border border-gray-100">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm">Data Upload & File Management</span>
                        </div>

                        <div className="flex items-center gap-3 text-gray-700 bg-white p-4 rounded-lg border border-gray-100">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm">Manual Data Entry</span>
                        </div>

                        <div className="flex items-center gap-3 text-gray-700 bg-white p-4 rounded-lg border border-gray-100">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm">Operation Logs & Audit Trail</span>
                        </div>

                        <div className="flex items-center gap-3 text-gray-700 bg-white p-4 rounded-lg border border-gray-100">
                            <svg className="w-5 h-5 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm">Product GMV Dashboard (Coming Soon)</span>
                        </div>

                        <div className="flex items-center gap-3 text-gray-700 bg-white p-4 rounded-lg border border-gray-100">
                            <svg className="w-5 h-5 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm">Advanced Analytics (Coming Soon)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

