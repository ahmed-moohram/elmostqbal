'use client';

import React, { ReactNode } from 'react';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

interface RevenueWidgetProps {
  title: string;
  value: number;
  trend?: number;
  trendLabel?: string;
  icon: ReactNode;
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red';
  footerLabel: string;
  isCurrency?: boolean;
}

const RevenueWidget: React.FC<RevenueWidgetProps> = ({
  title,
  value,
  trend = 0,
  trendLabel = '',
  icon,
  color,
  footerLabel,
  isCurrency = false
}) => {
  const getColorClass = (colorName: string) => {
    const colorMap = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      purple: 'bg-purple-100 text-purple-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      red: 'bg-red-100 text-red-800'
    };
    return colorMap[colorName as keyof typeof colorMap] || colorMap.blue;
  };

  const formatNumber = (num: number) => {
    return isCurrency 
      ? `${num.toLocaleString('ar-EG')} ج.م` 
      : num.toLocaleString('ar-EG');
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          {icon}
          {title}
        </h3>
      </div>
      
      <div className="mb-4">
        <div className="text-3xl font-bold text-gray-900">{formatNumber(value)}</div>
        {trend > 0 && (
          <div className="flex items-center mt-1">
            <div className="flex items-center text-green-600">
              <FaArrowUp className="mr-1" />
              <span className="text-sm font-medium">{trend}</span>
            </div>
            {trendLabel && (
              <span className="text-xs text-gray-500 mr-2">{trendLabel}</span>
            )}
          </div>
        )}
      </div>
      
      <div className="border-t pt-4">
        <div className="text-xs text-gray-500">{footerLabel}</div>
        <div className={`inline-flex px-2 py-1 rounded-full text-xs mt-2 ${getColorClass(color)}`}>
          {title}
        </div>
      </div>
    </div>
  );
};

export default RevenueWidget;
