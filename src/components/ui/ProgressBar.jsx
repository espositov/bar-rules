import React from 'react';

function ProgressBar({ 
  progress = 0, 
  variant = 'default',
  size = 'default',
  showPercentage = false,
  className = '',
  ...props 
}) {
  const variants = {
    default: {
      bg: 'bg-gray-200',
      fill: 'bg-emerald-500'
    },
    primary: {
      bg: 'bg-blue-200',
      fill: 'bg-blue-500'
    },
    success: {
      bg: 'bg-emerald-200',
      fill: 'bg-emerald-500'
    },
    warning: {
      bg: 'bg-yellow-200',
      fill: 'bg-yellow-500'
    }
  };
  
  const sizes = {
    sm: 'h-1',
    default: 'h-2',
    lg: 'h-3'
  };
  
  const { bg, fill } = variants[variant];
  const height = sizes[size];
  
  return (
    <div className={`flex items-center gap-2 ${className}`} {...props}>
      <div className={`flex-1 ${bg} rounded-full overflow-hidden ${height}`}>
        <div 
          className={`${fill} ${height} transition-all duration-500 rounded-full`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {showPercentage && (
        <span className="text-xs font-medium text-gray-600 min-w-[3rem] text-right">
          {Math.round(progress)}%
        </span>
      )}
    </div>
  );
}

export default ProgressBar;