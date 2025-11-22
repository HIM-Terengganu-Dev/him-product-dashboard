import React from 'react';

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  iconColor: string;
  onClick?: () => void;
  isActive?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor,
  onClick,
  isActive,
}) => (
  <div
    className={`bg-white p-6 rounded-xl shadow-md border flex items-center space-x-4 transition-all duration-200 ${
      onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1' : ''
    } ${isActive ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-100'}`}
    onClick={onClick}
  >
    <div className={`p-3 rounded-full ${iconColor}`}>
      <Icon className="h-6 w-6 text-white" />
    </div>
    <div>
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="text-2xl font-bold mt-1 text-gray-800">{value}</p>
    </div>
  </div>
);

export const KpiCardSkeleton: React.FC = () => (
  <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex items-center space-x-4 animate-pulse">
    <div className="p-3 rounded-full bg-gray-200 w-12 h-12"></div>
    <div className="flex-1">
      <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
    </div>
  </div>
);

