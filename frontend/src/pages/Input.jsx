import React from 'react';

export default function Input({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  helperText,
  error,
  className = '',
  ...props
}) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wide">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg transition-all
          focus:outline-none focus:ring-2 focus:ring-ucab-green/20 focus:border-ucab-green
          disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
          ${error ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : 'border-gray-300'}`}
        {...props}
      />
      {error ? (
        <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>
      ) : (
        helperText && <p className="mt-1 text-xs text-gray-400">{helperText}</p>
      )}
    </div>
  );
}