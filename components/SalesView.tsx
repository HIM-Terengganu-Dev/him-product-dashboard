'use client';

import React from 'react';
import Link from 'next/link';

export default function SalesView() {
    return (
        <div className="min-h-full flex items-center justify-center p-3 sm:p-6">
            <div className="max-w-2xl w-full bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 shadow-2xl border border-gray-100">
                {/* Icon */}
                <div className="flex justify-center mb-4 sm:mb-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 text-center mb-3 sm:mb-4">
                    Sales Management
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-lg text-gray-600 text-center mb-6 sm:mb-10">
                    Access sales portals by marketplace
                </p>

                {/* Marketplace Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
                    {/* TikTok */}
                    <button
                        onClick={() => window.location.href = '/?view=Sales TikTok'}
                        className="bg-gradient-to-br from-pink-50 to-red-50 rounded-xl sm:rounded-2xl p-6 sm:p-8 border-2 border-pink-100 hover:border-pink-300 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-left"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-red-500 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                                </svg>
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900">TikTok</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">Live GMV & Product GMV analytics</p>
                        <span className="text-pink-600 font-semibold text-sm">View →</span>
                    </button>

                    {/* Shopee */}
                    <button
                        onClick={() => window.location.href = '/?view=Sales Shopee'}
                        className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl sm:rounded-2xl p-6 sm:p-8 border-2 border-orange-100 hover:border-orange-300 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-left"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-lg">S</span>
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Shopee</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">Coming soon</p>
                        <span className="text-orange-600 font-semibold text-sm">View →</span>
                    </button>

                    {/* WhatsApp */}
                    <button
                        onClick={() => window.location.href = '/?view=Sales WhatsApp'}
                        className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl sm:rounded-2xl p-6 sm:p-8 border-2 border-green-100 hover:border-green-300 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-left"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                </svg>
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900">WhatsApp</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">Coming soon</p>
                        <span className="text-green-600 font-semibold text-sm">View →</span>
                    </button>

                    {/* Lazada */}
                    <button
                        onClick={() => window.location.href = '/?view=Sales Lazada'}
                        className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl sm:rounded-2xl p-6 sm:p-8 border-2 border-blue-100 hover:border-blue-300 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-left"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold text-lg">L</span>
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Lazada</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">Coming soon</p>
                        <span className="text-blue-600 font-semibold text-sm">View →</span>
                    </button>
                </div>

                {/* Features List */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Available Features:</h3>
                    
                </div>
            </div>
        </div>
    );
}

