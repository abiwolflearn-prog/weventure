import React from 'react';

export interface ICardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  hoverable?: boolean;
  paddingClassName?: string;
  children?: React.ReactNode;
  className?: string;
}

export function Card({
  title,
  subtitle,
  icon,
  action,
  hoverable = true,
  paddingClassName = 'p-6', // equivalent to 24px
  children,
  className = '',
  ...props
}: ICardProps) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-2xl shadow-sm text-gray-600 transition-all duration-200
        ${hoverable ? 'hover:shadow-md' : ''}
        ${paddingClassName}
        ${className}`}
      {...props}
    >
      {(title || subtitle || icon || action) && (
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-start space-x-3.5">
            {icon && (
              <div className="text-blue-600 mt-0.5 shrink-0">
                {icon}
              </div>
            )}
            <div>
              {title && (
                <h3 className="text-lg font-bold text-gray-900 leading-snug tracking-tight">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs font-semibold text-gray-600 mt-1 uppercase tracking-wider">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && <div className="shrink-0 ml-4">{action}</div>}
        </div>
      )}
      <div className="text-sm md:text-base text-gray-600">{children}</div>
    </div>
  );
}
