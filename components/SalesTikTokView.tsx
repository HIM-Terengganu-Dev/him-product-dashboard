'use client';

import React from 'react';
import Link from 'next/link';

export default function SalesTikTokView() {
    return (
        <div className="min-h-full flex items-center justify-center p-3 sm:p-6">
            <div className="max-w-4xl w-full bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 shadow-2xl border border-gray-100">
                {/* Icon */}
                <div className="flex justify-center mb-4 sm:mb-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-pink-400 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                        </svg>
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 text-center mb-3 sm:mb-4">
                    TikTok Sales Management
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-lg text-gray-600 text-center mb-6 sm:mb-10">
                    Manage TikTok Shop analytics and performance data
                </p>

                {/* Dashboard Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
                    {/* Live GMV Card */}
                    <Link
                        href="/sales-portal/tiktok/live-gmv"
                        className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl sm:rounded-2xl p-6 sm:p-8 border-2 border-indigo-100 hover:border-indigo-300 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 mt-1">
                                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Live GMV</h3>
                                <p className="text-sm sm:text-base text-gray-700 mb-4 leading-relaxed">
                                    TikTok Live stream sales performance, analytics, and real-time reporting.
                                </p>
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
                        className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl sm:rounded-2xl p-6 sm:p-8 border-2 border-pink-100 hover:border-pink-300 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 mt-1">
                                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Product GMV</h3>
                                <p className="text-sm sm:text-base text-gray-700 mb-4 leading-relaxed">
                                    TikTok Product campaign sales data, performance metrics, and analytics.
                                </p>
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

                {/* Features List */}
                <div className="space-y-3 pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Available Features:</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-3 text-gray-700">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm">Live GMV Analytics</span>
                        </div>

                        <div className="flex items-center gap-3 text-gray-700">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm">Product GMV Tracking</span>
                        </div>

                        <div className="flex items-center gap-3 text-gray-700">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm">Cost Analysis & ROAS</span>
                        </div>

                        <div className="flex items-center gap-3 text-gray-700">
                            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm">Data Upload & Management</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

