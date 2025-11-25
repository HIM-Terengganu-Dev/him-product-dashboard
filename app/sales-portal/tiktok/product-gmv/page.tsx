'use client';

import React from 'react';
import Link from 'next/link';

export default function ProductGMVDataManagementPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
                                TikTok Product GMV - Data Management
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">Upload, manage, and view Product GMV data</p>
                        </div>
                        <Link
                            href="/?view=Sales Data TikTok"
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            ← Back to Data Management
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Main Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Upload Data */}
                    <Link
                        href="/sales-portal/tiktok/product-gmv/upload"
                        className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border-2 border-indigo-100 hover:border-indigo-300 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg mb-4">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Data</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Upload Product GMV Excel files with automatic date detection
                            </p>
                            <span className="text-indigo-600 font-semibold text-sm inline-flex items-center gap-1">
                                Upload Files →
                            </span>
                        </div>
                    </Link>

                    {/* Manual Entry */}
                    <Link
                        href="/sales-portal/tiktok/product-gmv/manual-entry"
                        className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border-2 border-amber-100 hover:border-amber-300 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg mb-4">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Manual Entry</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Manually enter Product GMV campaign data
                            </p>
                            <span className="text-amber-600 font-semibold text-sm inline-flex items-center gap-1">
                                Enter Data →
                            </span>
                        </div>
                    </Link>

                    {/* View Records */}
                    <Link
                        href="/sales-portal/tiktok/product-gmv/records"
                        className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-100 hover:border-green-300 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg mb-4">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">View Records</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                View historical Product GMV data and operation logs
                            </p>
                            <span className="text-green-600 font-semibold text-sm inline-flex items-center gap-1">
                                View Records →
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Info Section */}
                <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">About Product GMV</h2>
                    <div className="space-y-3 text-sm text-gray-700">
                        <p>
                            <strong>Product GMV</strong> tracks product-level campaign performance from TikTok Shop. 
                            Unlike Live GMV, Product GMV campaigns do not require bracket notation for grouping.
                        </p>
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                            <p className="font-semibold text-blue-900 mb-1">Note:</p>
                            <p className="text-blue-800">
                                Campaign names are used directly as group names. No bracket detection is performed.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

