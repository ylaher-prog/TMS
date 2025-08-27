import React from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: 'good' | 'bad' | 'neutral';
  iconBgColor?: string;
  iconTextColor?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon, trend = 'neutral', iconBgColor = 'bg-gray-100', iconTextColor = 'text-gray-600' }) => {
    
  const trendColor = (() => {
    if (trend === 'bad' && typeof value === 'number' && value > 0) {
      return 'text-red-500 dark:text-red-400';
    }
    if (trend === 'good' && typeof value === 'number' && value > 0) {
      return 'text-brand-accent';
    }
    return 'text-brand-text-dark dark:text-white';
  })();

  return (
    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-brand-text-light dark:text-gray-400">{title}</p>
        <p className={`text-3xl font-bold mt-1 ${trendColor}`}>{value}</p>
      </div>
      <div className={`p-3 rounded-full ${iconBgColor}`}>
        <div className={`h-6 w-6 ${iconTextColor}`}>{icon}</div>
      </div>
    </div>
  );
};

export default KpiCard;