'use client';

import React from 'react';

interface SalesBIDashboardViewProps {
    marketplace: 'all' | 'tiktok' | 'shopee' | 'whatsapp' | 'lazada';
}

export default function SalesBIDashboardView({ marketplace }: SalesBIDashboardViewProps) {
    const marketplaceNames: Record<string, string> = {
        all: 'All Marketplaces',
        tiktok: 'TikTok',
        shopee: 'Shopee',
        whatsapp: 'WhatsApp',
        lazada: 'Lazada',
    };

    const marketplaceName = marketplaceNames[marketplace] || 'All Marketplaces';

    return (
        <div className="min-h-full flex items-center justify-center p-3 sm:p-6">
            <div className="max-w-4xl w-full bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 shadow-2xl border border-gray-100">
                {/* Icon */}
                <div className="flex justify-center mb-4 sm:mb-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 text-center mb-3 sm:mb-4">
                    {marketplaceName} BI Dashboard
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-lg text-gray-600 text-center mb-6 sm:mb-10">
                    Business Intelligence data dashboard for {marketplace === 'all' ? 'all marketplaces' : marketplaceName.toLowerCase()}
                </p>

                {/* Coming Soon Message */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mb-6">
                    <div className="flex items-start">
                        <svg className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <h3 className="text-lg font-bold text-blue-900 mb-2">Coming Soon</h3>
                            <p className="text-blue-800">
                                The BI dashboard for {marketplace === 'all' ? 'all marketplaces' : marketplaceName} is currently under development. 
                                This will display comprehensive analytics, performance metrics, and insights.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Placeholder for Future Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h4 className="font-semibold text-gray-700 mb-2">Revenue Analytics</h4>
                        <p className="text-sm text-gray-500">Coming soon</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h4 className="font-semibold text-gray-700 mb-2">Performance Metrics</h4>
                        <p className="text-sm text-gray-500">Coming soon</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h4 className="font-semibold text-gray-700 mb-2">Cost Analysis</h4>
                        <p className="text-sm text-gray-500">Coming soon</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h4 className="font-semibold text-gray-700 mb-2">Trend Reports</h4>
                        <p className="text-sm text-gray-500">Coming soon</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

