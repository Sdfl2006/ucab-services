import React from 'react';

export default function Badge({ label, status = 'default', size = 'md', className = '' }) {
  const statusStyles = {
    success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    error: 'bg-rose-100 text-rose-800 border-rose-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    ucab: 'bg-ucab-green/10 text-ucab-green border-ucab-green/20 font-semibold',
    default: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span className={`inline-flex items-center justify-center font-medium rounded-full border ${statusStyles[status] || statusStyles.default} ${sizes[size]} ${className}`}>
      {label}
    </span>
  );
}