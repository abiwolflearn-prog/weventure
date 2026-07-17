import React from 'react';

export interface IInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, IInputProps>(
  ({ className = '', label, error, helperText, type = 'text', id, ...props }, ref) => {
    const uniqueId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="w-full flex flex-col space-y-2">
        {label && (
          <label 
            htmlFor={uniqueId} 
            className="text-xs font-bold uppercase tracking-wider text-[#111111] select-none"
          >
            {label}
          </label>
        )}
        <input
          id={uniqueId}
          ref={ref}
          type={type}
          aria-invalid={!!error}
          aria-describedby={error ? `${uniqueId}-error` : helperText ? `${uniqueId}-helper` : undefined}
          className={`w-full h-12 px-4 rounded-[14px] border text-sm transition-all duration-200 outline-none bg-white text-[#111111]
            ${
              error 
                ? 'border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/10' 
                : 'border-neutral-200 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10'
            }
            disabled:opacity-50 disabled:bg-neutral-50
            ${className}`}
          {...props}
        />
        {error ? (
          <span id={`${uniqueId}-error`} className="text-xs font-bold text-[#EF4444] select-none">
            {error}
          </span>
        ) : helperText ? (
          <span id={`${uniqueId}-helper`} className="text-xs text-[#6B7280] select-none font-medium">
            {helperText}
          </span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

