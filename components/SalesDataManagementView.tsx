'use client';

import React from 'react';
import Link from 'next/link';

interface SalesDataManagementViewProps {
    marketplace: 'tiktok' | 'shopee' | 'whatsapp' | 'lazada';
}

export default function SalesDataManagementView({ marketplace }: SalesDataManagementViewProps) {
    const marketplaceNames: Record<string, string> = {
        tiktok: 'TikTok',
        shopee: 'Shopee',
        whatsapp: 'WhatsApp',
        lazada: 'Lazada',
    };

    const marketplaceName = marketplaceNames[marketplace] || 'TikTok';
    const isTikTok = marketplace === 'tiktok';

    if (isTikTok) {
        // TikTok has specific pages - redirect to the TikTok sales portal page
        return (
            <div className="min-h-full flex items-center justify-center p-3 sm:p-6">
                <div className="max-w-4xl w-full bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 shadow-2xl border border-gray-100">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                            TikTok Data Management
                        </h1>
                        <p className="text-base sm:text-lg text-gray-600 mb-6">
                            Manage TikTok Shop data entry and management
                        </p>
                    </div>

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
                                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Live GMV</h3>
                                    <p className="text-sm sm:text-base text-gray-700 mb-4 leading-relaxed">
                                        Upload, manage, and view Live GMV data. Access upload, manual entry, and records management.
                                    </p>
                                    <div className="inline-flex items-center gap-2 text-indigo-600 font-semibold text-sm sm:text-base">
                                        <span>Manage Data</span>
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
                                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">LIVE</span>
                                    </div>
                                    <p className="text-sm sm:text-base text-gray-700 mb-4 leading-relaxed">
                                        Upload, manage, and view Product GMV data. Access upload, manual entry, and records management.
                                    </p>
                                    <div className="inline-flex items-center gap-2 text-pink-600 font-semibold text-sm sm:text-base">
                                        <span>Manage Data</span>
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Other marketplaces - coming soon placeholder
    return (
        <div className="min-h-full flex items-center justify-center p-3 sm:p-6">
            <div className="max-w-4xl w-full bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 shadow-2xl border border-gray-100">
                <div className="text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center shadow-lg mx-auto mb-6">
                        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                        {marketplaceName} Data Management
                    </h1>
                    <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-10">
                        Data management portal for {marketplaceName} is coming soon
                    </p>
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
                        <div className="flex items-start">
                            <svg className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <h3 className="text-lg font-bold text-blue-900 mb-2">Coming Soon</h3>
                                <p className="text-blue-800">
                                    The data management portal for {marketplaceName} is currently under development. 
                                    This will include data upload, manual entry, records management, and operation logs.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

