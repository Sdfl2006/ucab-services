import React from 'react';

export default function Card({ children, title, subtitle, footer, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden ${className}`}>
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          {title && <h3 className="text-lg font-bold text-ucab-green">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
          {footer}
        </div>
      )}
    </div>
  );
}