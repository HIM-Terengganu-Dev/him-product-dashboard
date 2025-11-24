'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface UploadResult {
    success: boolean;
    message: string;
    recordsProcessed?: number;
    recordsInserted?: number;
    recordsUpdated?: number;
    errors?: string[];
}

function LiveGMVUploadContent() {
    const searchParams = useSearchParams();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<UploadResult | null>(null);
    const [dragActive, setDragActive] = useState(false);

    // Get date from URL query parameter if present (for update functionality)
    useEffect(() => {
        if (searchParams) {
            const dateParam = searchParams.get('date');
            if (dateParam) {
                setReportDate(dateParam);
            }
        }
    }, [searchParams]);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (file: File) => {
        // Validate file type
        const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
        if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            alert('Please select a valid Excel file (.xlsx or .xls)');
            return;
        }
        setSelectedFile(file);
        setResult(null);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            alert('Please select a file first');
            return;
        }

        if (!reportDate) {
            alert('Please select a report date');
            return;
        }

        setUploading(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('reportDate', reportDate);

            const response = await fetch('/api/tiktok/live-gmv/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            
            if (!response.ok) {
                const errorMessage = data.message || data.error || `Upload failed (${response.status})`;
                console.error('Upload API error:', {
                    status: response.status,
                    statusText: response.statusText,
                    data,
                });
                throw new Error(errorMessage);
            }

            setResult(data);
            
            // Clear file selection on success
            if (data.success) {
                setSelectedFile(null);
            }
        } catch (error) {
            console.error('Upload error:', error);
            const errorMessage = error instanceof Error 
                ? error.message 
                : 'Upload failed. Please check the console for details.';
            
            setResult({
                success: false,
                message: errorMessage,
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Upload Live GMV Data
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">Import TikTok Live GMV performance data</p>
                        </div>
                        <Link
                            href="/sales-portal/live-gmv"
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            ← Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
                {/* Instructions Card */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-blue-900 mb-2">How to Upload</h3>
                            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                                <li>Select the report date (the date this data represents)</li>
                                <li>Upload your Live GMV Excel file from TikTok Shop</li>
                                <li>The system will automatically process and update existing data for that date</li>
                                <li>Campaign names will be automatically grouped using [brackets], (parentheses), or {'{'}curly braces{'}'} notation</li>
                                <li>All data is validated before insertion</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Upload Form */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                    {/* Date Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Report Date <span className="text-red-500">*</span>
                            {searchParams?.get('date') && (
                                <span className="ml-2 px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-100 rounded">
                                    Update Mode
                                </span>
                            )}
                        </label>
                        <input
                            type="date"
                            value={reportDate}
                            onChange={(e) => setReportDate(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            disabled={uploading}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {searchParams?.get('date') 
                                ? `Updating records for ${searchParams.get('date')}. Uploading will replace all existing data for this date.`
                                : 'Select the date this data represents. Uploading data for an existing date will update all records for that date.'
                            }
                        </p>
                    </div>

                    {/* File Upload Area */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Excel File <span className="text-red-500">*</span>
                        </label>
                        
                        {/* Drag & Drop Area */}
                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                                dragActive
                                    ? 'border-indigo-500 bg-indigo-50'
                                    : 'border-gray-300 hover:border-indigo-400'
                            } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            {selectedFile ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-center gap-3">
                                        <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{selectedFile.name}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {(selectedFile.size / 1024).toFixed(2)} KB
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedFile(null)}
                                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                                        disabled={uploading}
                                    >
                                        Remove file
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-center gap-3 mb-4">
                                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-700 font-medium mb-2">
                                        Drag and drop your Excel file here
                                    </p>
                                    <p className="text-sm text-gray-500 mb-4">or</p>
                                    <label className="inline-block">
                                        <span className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all cursor-pointer shadow-md">
                                            Browse Files
                                        </span>
                                        <input
                                            type="file"
                                            accept=".xlsx,.xls"
                                            onChange={handleFileInputChange}
                                            className="hidden"
                                            disabled={uploading}
                                        />
                                    </label>
                                    <p className="text-xs text-gray-500 mt-4">
                                        Supported formats: .xlsx, .xls
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Upload Button */}
                    <button
                        onClick={handleUpload}
                        disabled={!selectedFile || !reportDate || uploading}
                        className={`w-full py-4 rounded-xl font-bold text-white transition-all duration-200 ${
                            !selectedFile || !reportDate || uploading
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                        }`}
                    >
                        {uploading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Uploading...
                            </span>
                        ) : (
                            '📤 Upload Data'
                        )}
                    </button>
                </div>

                {/* Result Display */}
                {result && (
                    <div className={`rounded-2xl p-6 border-2 ${
                        result.success 
                            ? 'bg-green-50 border-green-500' 
                            : 'bg-red-50 border-red-500'
                    }`}>
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 mt-1">
                                {result.success ? (
                                    <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className={`text-lg font-bold mb-2 ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                                    {result.success ? '✅ Upload Successful!' : '❌ Upload Failed'}
                                </h3>
                                <p className={`text-sm mb-3 ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                                    {result.message}
                                </p>
                                {result.success && (
                                    <div className="bg-white/50 rounded-lg p-4 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-700 font-medium">Records Processed:</span>
                                            <span className="text-gray-900 font-bold">{result.recordsProcessed}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-700 font-medium">New Records:</span>
                                            <span className="text-green-700 font-bold">{result.recordsInserted}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-700 font-medium">Updated Records:</span>
                                            <span className="text-blue-700 font-bold">{result.recordsUpdated}</span>
                                        </div>
                                    </div>
                                )}
                                {result.errors && result.errors.length > 0 && (
                                    <div className="mt-3 bg-white/50 rounded-lg p-4">
                                        <p className="text-sm font-semibold text-red-900 mb-2">Errors:</p>
                                        <ul className="text-xs text-red-800 space-y-1 list-disc list-inside">
                                            {result.errors.map((error, index) => (
                                                <li key={index}>{error}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {result.success && (
                                    <div className="mt-4">
                                        <Link
                                            href="/sales-portal/live-gmv"
                                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md text-sm"
                                        >
                                            <span>View Dashboard</span>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Expected Data Format */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Expected Excel Format</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Campaign ID</th>
                                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Campaign name</th>
                                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Cost</th>
                                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Net cost</th>
                                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Live views</th>
                                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Orders (SKU)</th>
                                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Gross Revenue</th>
                                    <th className="px-3 py-2 text-left font-semibold text-gray-700">ROI</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                <tr>
                                    <td className="px-3 py-2 text-gray-600">1234567890</td>
                                    <td className="px-3 py-2 text-gray-600">HIMCoffeedrsamhan</td>
                                    <td className="px-3 py-2 text-gray-600">RM 156.43</td>
                                    <td className="px-3 py-2 text-gray-600">RM 150.00</td>
                                    <td className="px-3 py-2 text-gray-600">2500</td>
                                    <td className="px-3 py-2 text-gray-600">8</td>
                                    <td className="px-3 py-2 text-gray-600">RM 1173.97</td>
                                    <td className="px-3 py-2 text-gray-600">6.5</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                        <strong>Campaign Group Detection:</strong> The system extracts the group name from text inside brackets, parentheses, or curly braces. 
                        For example, "[HIM Wellness]" extracts "HIM Wellness" as the group, "(Coffee)" extracts "Coffee", and {'{'}'Samhan'{'}'} extracts "Samhan". 
                        Only the text inside these symbols is used as the group name. If no brackets/parentheses/braces are found, the entire campaign name is used as the group.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function LiveGMVUploadPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        }>
            <LiveGMVUploadContent />
        </Suspense>
    );
}

