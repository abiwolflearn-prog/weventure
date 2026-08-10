import React from 'react';

interface WeVentureLogoProps {
  size?: number | string;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
  mode?: 'light' | 'dark';
  showText?: boolean;
}

/**
 * WeVentureLogo - Authentic representation of the official WeVenture
 * organic 3-node "V" logo symbol, with optional bold "WEVENTURE" text.
 */
export default function WeVentureLogo({
  size,
  width,
  height,
  className = '',
  style,
  mode = 'light',
  showText = false,
}: WeVentureLogoProps) {
  const isDark = mode === 'dark';
  const navyColor = isDark ? '#FFFFFF' : '#0B0E2A';
  const greenColor = '#84CC16';

  const numericSize = typeof size === 'number' ? size : size ? parseFloat(String(size)) : null;
  const logoWidth = numericSize || width || 64;
  const logoHeight = numericSize ? Math.round(numericSize * 0.78) : height || 50;

  return (
    <div className={`inline-flex items-center gap-3.5 ${className}`} style={style}>
      <svg
        width={logoWidth}
        height={logoHeight}
        viewBox="0 0 140 110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Left Navy Node & Organic Arm */}
        <path
          d="M 30 5
             C 18.95 5 10 13.95 10 25
             C 10 36.05 18.95 45 30 45
             C 40.5 45 49 54 58 68
             C 65 78 70 85 70 85
             C 70 85 58 68 50 52
             C 42 36 50 25 50 25
             C 50 13.95 41.05 5 30 5 Z"
          fill={navyColor}
        />
        <circle cx="30" cy="25" r="20" fill={navyColor} />

        {/* Crotch Fill Navy */}
        <path
          d="M 30 45
             C 45 45 58 58 66 72
             C 56 62 45 52 30 45 Z"
          fill={navyColor}
        />

        {/* Right Lime Green Node & Organic Arm */}
        <path
          d="M 110 5
             C 121.05 5 130 13.95 130 25
             C 130 36.05 121.05 45 110 45
             C 99.5 45 91 54 82 68
             C 75 78 70 85 70 85
             C 70 85 82 68 90 52
             C 98 36 90 25 90 25
             C 90 13.95 98.95 5 110 5 Z"
          fill={greenColor}
        />

        {/* Bottom Lime Green Node & Arm */}
        <path
          d="M 70 65
             C 58.95 65 50 73.95 50 85
             C 50 96.05 58.95 105 70 105
             C 81.05 105 90 96.05 90 85
             C 90 73.95 81.05 65 70 65 Z"
          fill={greenColor}
        />

        <circle cx="110" cy="25" r="20" fill={greenColor} />
        <circle cx="70" cy="85" r="20" fill={greenColor} />

        {/* Crotch Fill Green */}
        <path
          d="M 110 45
             C 95 45 82 58 74 72
             C 84 62 95 52 110 45 Z"
          fill={greenColor}
        />
      </svg>

      {showText && (
        <div className="flex flex-col text-left">
          <span className={`font-display font-black tracking-tight leading-none text-3xl md:text-4xl ${isDark ? 'text-white' : 'text-neutral-900'}`}>
            WEVENTURE
          </span>
          <span className="text-xs font-extrabold text-[#84CC16] tracking-widest uppercase mt-1">
            EVENT & WORKSPACE PLATFORM
          </span>
        </div>
      )}
    </div>
  );
}

