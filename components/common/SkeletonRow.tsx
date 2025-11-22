import React from 'react';

interface SkeletonRowProps {
  columns: number;
}

export const SkeletonRow: React.FC<SkeletonRowProps> = ({ columns }) => (
  <tr className="animate-pulse">
    {Array.from({ length: columns }).map((_, index) => (
      <td key={index} className="px-6 py-4 whitespace-nowrap">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          {index === 0 && <div className="h-3 bg-gray-200 rounded w-32"></div>}
        </div>
      </td>
    ))}
  </tr>
);

