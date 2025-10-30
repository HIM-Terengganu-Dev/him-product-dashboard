import React from 'react';

interface PlaceholderViewProps {
  title: string;
}

const PlaceholderView: React.FC<PlaceholderViewProps> = ({ title }) => {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="text-center p-8 bg-white rounded-lg shadow-md border border-gray-100">
        <h2 className="text-4xl font-bold text-indigo-500 mb-4">{title}</h2>
        <p className="text-gray-500">This feature is currently under construction.</p>
        <p className="text-gray-500">Check back soon for updates!</p>
      </div>
    </div>
  );
};

export default PlaceholderView;