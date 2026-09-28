import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
}) => {
  const variantClasses = {
    text: 'rounded h-4 w-full',
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
  }[variant];

  const style: React.CSSProperties = {
    width: width !== undefined ? width : undefined,
    height: height !== undefined ? height : undefined,
  };

  return (
    <div
      style={style}
      className={`animate-pulse bg-gray-200 dark:bg-gray-700/60 ${variantClasses} ${className}`}
    />
  );
};

export const MetricCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <Skeleton width="45%" height={16} />
        <Skeleton variant="circular" width={36} height={36} />
      </div>
      <div>
        <Skeleton width="70%" height={28} className="mb-2" />
        <Skeleton width="40%" height={14} />
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number; cols?: number }> = ({
  rows = 5,
  columns,
  cols,
}) => {
  const columnCount = columns ?? cols ?? 5;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center gap-4">
        <Skeleton width={200} height={36} />
        <div className="flex gap-2">
          <Skeleton width={100} height={36} />
          <Skeleton width={120} height={36} />
        </div>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center justify-between gap-4">
            {Array.from({ length: columnCount }).map((_, j) => (
              <Skeleton
                key={j}
                height={16}
                width={j === 0 ? '25%' : j === columnCount - 1 ? '15%' : '18%'}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const ChartSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <Skeleton width={180} height={20} />
        <Skeleton width={80} height={16} />
      </div>
      <div className="h-56 flex items-end justify-between gap-4 pt-8">
        {[40, 65, 30, 85, 55, 95, 70, 45, 60, 80, 50, 90].map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <Skeleton
              className="w-full"
              height={`${h}%`}
            />
            <Skeleton width={24} height={12} />
          </div>
        ))}
      </div>
    </div>
  );
};
