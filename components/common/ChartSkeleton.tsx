import React from 'react';

export const ChartSkeleton: React.FC = () => (
  <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 animate-pulse w-full">
    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
    <div className="h-64 flex items-center justify-center">
      <div className="w-48 h-48 bg-gray-200 rounded-full"></div>
    </div>
  </div>
);

