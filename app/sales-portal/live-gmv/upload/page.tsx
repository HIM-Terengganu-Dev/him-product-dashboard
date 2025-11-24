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
    warnings?: string[];
}

interface FileWithDate {
    file: File;
    detectedDate: string | null;
    status: 'pending' | 'uploading' | 'success' | 'error';
    result?: UploadResult;
}

function LiveGMVUploadContent() {
    const searchParams = useSearchParams();
    const [selectedFiles, setSelectedFiles] = useState<FileWithDate[]>([]);
    const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
    const [dragActive, setDragActive] = useState(false);

    // Extract date from filename: "Live campaign data (2025-11-21 - 2025-11-21).xlsx"
    const extractDateFromFilename = (filename: string): string | null => {
        // Pattern: "Live campaign data (YYYY-MM-DD - YYYY-MM-DD).xlsx"
        const match = filename.match(/\((\d{4}-\d{2}-\d{2})\s*-\s*(\d{4}-\d{2}-\d{2})\)/);
        if (match) {
            // Use the first date (both should be the same, but use first one)
            return match[1];
        }
        return null;
    };

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
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFilesSelect(Array.from(e.dataTransfer.files));
        }
    };

    const handleFilesSelect = (files: File[]) => {
        const validFiles: FileWithDate[] = [];
        const invalidFiles: string[] = [];

        files.forEach((file) => {
            // Validate file type
            const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
            if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
                invalidFiles.push(file.name);
                return;
            }

            // Auto-detect date from filename
            const detectedDate = extractDateFromFilename(file.name);
            
            validFiles.push({
                file,
                detectedDate,
                status: 'pending',
            });
        });

        if (invalidFiles.length > 0) {
            alert(`The following files are not valid Excel files and were skipped:\n${invalidFiles.join('\n')}`);
        }

        if (validFiles.length > 0) {
            setSelectedFiles((prev) => [...prev, ...validFiles]);
            // Auto-fill date with first file's detected date if available
            if (validFiles[0].detectedDate) {
                setReportDate(validFiles[0].detectedDate);
            }
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFilesSelect(Array.from(e.target.files));
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            alert('Please select at least one file first');
            return;
        }

        // Check for files without detected dates
        const filesWithoutDates = selectedFiles.filter(f => !f.detectedDate);
        if (filesWithoutDates.length > 0) {
            const fileNames = filesWithoutDates.map(f => f.file.name).join('\n');
            if (!confirm(`The following files don't have dates in their filenames:\n${fileNames}\n\nDo you want to use the selected date "${reportDate}" for all files?`)) {
                return;
            }
        }

        setUploading(true);
        setUploadProgress({});

        // Upload each file with its detected date (or fallback to selected date)
        const uploadPromises = selectedFiles.map(async (fileWithDate, index) => {
            const dateToUse = fileWithDate.detectedDate || reportDate;
            const fileKey = `${fileWithDate.file.name}-${index}`;

            // Update status to uploading
            setSelectedFiles((prev) => 
                prev.map((f, i) => 
                    i === index ? { ...f, status: 'uploading' } : f
                )
            );

            try {
                const formData = new FormData();
                formData.append('file', fileWithDate.file);
                formData.append('reportDate', dateToUse);

                const response = await fetch('/api/tiktok/live-gmv/upload', {
                    method: 'POST',
                    body: formData,
                });

                const data = await response.json();
                
                if (!response.ok) {
                    const errorMessage = data.message || data.error || `Upload failed (${response.status})`;
                    throw new Error(errorMessage);
                }

                // Update status to success
                setSelectedFiles((prev) => 
                    prev.map((f, i) => 
                        i === index ? { ...f, status: 'success', result: data } : f
                    )
                );

                return { success: true, file: fileWithDate.file.name, data };
            } catch (error) {
                const errorMessage = error instanceof Error 
                    ? error.message 
                    : 'Upload failed. Please check the console for details.';
                
                const errorResult: UploadResult = {
                    success: false,
                    message: errorMessage,
                };

                // Update status to error
                setSelectedFiles((prev) => 
                    prev.map((f, i) => 
                        i === index ? { ...f, status: 'error', result: errorResult } : f
                    )
                );

                return { success: false, file: fileWithDate.file.name, error: errorMessage };
            }
        });

        // Wait for all uploads to complete
        const results = await Promise.all(uploadPromises);
        
        // Count successes and failures
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;

        if (successCount > 0 && failureCount === 0) {
            // All successful - clear files
            setTimeout(() => {
                setSelectedFiles([]);
            }, 3000);
        }

        setUploading(false);
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
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-bold text-blue-900">How to Upload</h3>
                                <Link
                                    href="/sales-portal/live-gmv/manual-entry"
                                    className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-lg hover:bg-blue-200 transition-colors"
                                >
                                    ✏️ Manual Entry (Alternative)
                                </Link>
                            </div>
                            <p className="text-xs text-blue-700 mb-2 italic">
                                Can't access TikTok files? Use Manual Entry as an alternative method.
                            </p>
                            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                                <li>You can upload one or multiple Excel files at once</li>
                                <li>Date will be auto-detected from each filename (format: "Live campaign data (YYYY-MM-DD - YYYY-MM-DD).xlsx")</li>
                                <li>If a filename doesn't contain a date, the selected date above will be used</li>
                                <li>The system will automatically process and update existing data for each date</li>
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
                                : 'Date will be auto-detected from each filename (format: "Live campaign data (YYYY-MM-DD - YYYY-MM-DD).xlsx"). If filename has no date, the selected date above will be used.'
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
                            {selectedFiles.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-center gap-3">
                                        <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                                    </p>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {selectedFiles.map((fileWithDate, index) => (
                                            <div key={index} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold text-gray-900 truncate">{fileWithDate.file.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <p className="text-xs text-gray-500">
                                                            {(fileWithDate.file.size / 1024).toFixed(2)} KB
                                                        </p>
                                                        {fileWithDate.detectedDate && (
                                                            <span className="text-xs text-green-600 font-medium">
                                                                📅 {fileWithDate.detectedDate}
                                                            </span>
                                                        )}
                                                        {!fileWithDate.detectedDate && (
                                                            <span className="text-xs text-yellow-600 font-medium">
                                                                ⚠️ No date in filename
                                                            </span>
                                                        )}
                                                        {fileWithDate.status === 'uploading' && (
                                                            <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                                                                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                                </svg>
                                                                Uploading...
                                                            </span>
                                                        )}
                                                        {fileWithDate.status === 'success' && (
                                                            <span className="text-xs text-green-600 font-medium">✅ Success</span>
                                                        )}
                                                        {fileWithDate.status === 'error' && (
                                                            <span className="text-xs text-red-600 font-medium">❌ Failed</span>
                                                        )}
                                                    </div>
                                                </div>
                                                {fileWithDate.status === 'pending' && (
                                                    <button
                                                        onClick={() => removeFile(index)}
                                                        className="ml-2 text-sm text-red-600 hover:text-red-700 font-medium"
                                                        disabled={uploading}
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {selectedFiles.length > 0 && (
                                        <button
                                            onClick={() => setSelectedFiles([])}
                                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                                            disabled={uploading}
                                        >
                                            Clear all files
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-center gap-3 mb-4">
                                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-700 font-medium mb-2">
                                        Drag and drop your Excel files here
                                    </p>
                                    <p className="text-sm text-gray-500 mb-4">or</p>
                                    <label className="inline-block">
                                        <span className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all cursor-pointer shadow-md">
                                            Browse Files
                                        </span>
                                        <input
                                            type="file"
                                            accept=".xlsx,.xls"
                                            multiple
                                            onChange={handleFileInputChange}
                                            className="hidden"
                                            disabled={uploading}
                                        />
                                    </label>
                                    <p className="text-xs text-gray-500 mt-4">
                                        Supported formats: .xlsx, .xls (Multiple files supported)
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Upload Button */}
                    <button
                        onClick={handleUpload}
                        disabled={selectedFiles.length === 0 || !reportDate || uploading}
                        className={`w-full py-4 rounded-xl font-bold text-white transition-all duration-200 ${
                            selectedFiles.length === 0 || !reportDate || uploading
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
                                Uploading {selectedFiles.filter(f => f.status === 'uploading').length} of {selectedFiles.length}...
                            </span>
                        ) : (
                            `📤 Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`
                        )}
                    </button>
                </div>

                {/* Results Display for Multiple Files */}
                {selectedFiles.some(f => f.status === 'success' || f.status === 'error') && (
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Upload Results</h3>
                        <div className="space-y-3">
                            {selectedFiles.map((fileWithDate, index) => {
                                if (fileWithDate.status === 'pending') return null;
                                
                                const result = fileWithDate.result;
                                if (!result) return null;

                                return (
                                    <div key={index} className={`rounded-lg p-4 border-2 ${
                                        result.success 
                                            ? 'bg-green-50 border-green-200' 
                                            : 'bg-red-50 border-red-200'
                                    }`}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className={`text-sm font-semibold mb-1 ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                                                    {fileWithDate.file.name}
                                                </p>
                                                <p className={`text-xs mb-2 ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                                                    {result.message}
                                                </p>
                                                {result.success && (
                                                    <div className="text-xs text-green-700 space-y-1">
                                                        {result.recordsProcessed !== undefined && (
                                                            <p>Records: {result.recordsProcessed} processed, {result.recordsInserted} inserted, {result.recordsUpdated} updated</p>
                                                        )}
                                                    </div>
                                                )}
                                                {result.warnings && result.warnings.length > 0 && (
                                                    <div className="mt-2 text-xs text-yellow-800">
                                                        <p className="font-semibold">Warnings:</p>
                                                        <ul className="list-disc list-inside">
                                                            {result.warnings.slice(0, 3).map((w, i) => (
                                                                <li key={i}>{w}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {result.errors && result.errors.length > 0 && (
                                                    <div className="mt-2 text-xs text-red-800">
                                                        <p className="font-semibold">Errors:</p>
                                                        <ul className="list-disc list-inside">
                                                            {result.errors.slice(0, 3).map((e, i) => (
                                                                <li key={i}>{e}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
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
                        <strong>If multiple markers exist (e.g., "(amma) rocky [balboa]"), precedence is: brackets [] {'>'} parentheses () {'>'} curly braces {'{'} {'}'}.</strong>
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

