'use client';

import React from 'react';
import Link from 'next/link';

export default function SalesPortalPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-3xl w-full bg-white/10 backdrop-blur-lg rounded-3xl p-12 shadow-2xl border border-white/20">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-5xl font-bold text-white text-center mb-4">
                    HIM Product Sales Portal
                </h1>

                {/* Subtitle */}
                <p className="text-xl text-purple-200 text-center mb-8">
                    Sales Performance & BI Dashboard
                </p>

                {/* Development Notice */}
                <div className="bg-yellow-500/20 border-2 border-yellow-500/50 rounded-2xl p-6 mb-8">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                            <svg className="w-8 h-8 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-yellow-300 mb-2">Under Development</h3>
                            <p className="text-yellow-100">
                                This portal is currently being built based on the MOU requirements. It will feature 11 key metrics for sales performance, costs, and marketing analytics.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Active Dashboards */}
                <div className="space-y-4 mb-8">
                    <h3 className="text-xl font-semibold text-white mb-4">📊 Active Dashboards</h3>

                    {/* Live GMV Dashboard Card */}
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-white mb-2">TikTok Live GMV</h3>
                                <p className="text-indigo-100 mb-4 text-sm leading-relaxed">
                                    Real-time campaign performance with 6 key metrics: Cost, Orders, Revenue, Cost per Purchase, ROAS, and % Change tracking.
                                </p>
                                <Link
                                    href="/sales-portal/live-gmv"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-600 font-bold rounded-lg hover:bg-indigo-50 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
                                >
                                    <span>Open Dashboard</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </Link>
                            </div>
                            <div className="flex-shrink-0">
                                <span className="px-3 py-1 bg-green-400 text-green-900 text-xs font-bold rounded-full">LIVE</span>
                            </div>
                        </div>
                    </div>

                    {/* Coming Soon Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border-2 border-white/20">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                </div>
                                <h4 className="font-bold text-white">Product GMV</h4>
                                <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full ml-auto">SOON</span>
                            </div>
                            <p className="text-purple-200 text-sm">Product-level performance tracking</p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border-2 border-white/20">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <h4 className="font-bold text-white">TTAM Analytics</h4>
                                <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full ml-auto">SOON</span>
                            </div>
                            <p className="text-purple-200 text-sm">TikTok Ads Manager detailed reports</p>
                        </div>
                    </div>
                </div>

                {/* Prototype Link Card */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border-2 border-white/20">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                            <svg className="w-10 h-10 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-2">Original Prototype</h3>
                            <p className="text-purple-200 mb-4 text-sm leading-relaxed">
                                View the original MOU prototype with all 11 metrics visualization.
                            </p>
                            <Link
                                href="/sales-portal/prototype"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 transition-all duration-200 text-sm"
                            >
                                <span>View Prototype</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Features List */}
                <div className="space-y-3 mb-8">
                    <h3 className="text-lg font-semibold text-white mb-4">Planned Features:</h3>

                    <div className="flex items-center gap-3 text-purple-100">
                        <svg className="w-6 h-6 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Daily sales data entry interface</span>
                    </div>

                    <div className="flex items-center gap-3 text-purple-100">
                        <svg className="w-6 h-6 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Duplicate data detection & prevention</span>
                    </div>

                    <div className="flex items-center gap-3 text-purple-100">
                        <svg className="w-6 h-6 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Data validation & error handling</span>
                    </div>

                    <div className="flex items-center gap-3 text-purple-100">
                        <svg className="w-6 h-6 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Upload history & audit trail</span>
                    </div>

                    <div className="flex items-center gap-3 text-purple-100">
                        <svg className="w-6 h-6 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Bulk data import/export</span>
                    </div>
                </div>

                {/* Back Button */}
                <div className="flex justify-center">
                    <Link
                        href="/"
                        className="px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
