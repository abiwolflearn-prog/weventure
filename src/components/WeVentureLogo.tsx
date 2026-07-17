import React from 'react';

interface WeVentureLogoProps {
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
  mode?: 'light' | 'dark';
}

/**
 * WeVentureLogo - Pixel-perfect, custom-crafted SVG representation
 * of the official WeVenture organic nodes "V" logo.
 */
export default function WeVentureLogo({ size = '24', className = '', style, mode = 'light' }: WeVentureLogoProps) {
  const isDark = mode === 'dark';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block ${className}`}
      style={style}
    >
      {/* 1. Deep Slate Navy or White Node (Top Left + Left Neck) */}
      <path
        d="M 7,28 
           A 15,15 0 1 1 37,28 
           C 37,40 43,53 50,53 
           C 44.5,59 38.5,69 35,76 
           C 30,68 7,48 7,28 
           Z"
        fill={isDark ? '#FFFFFF' : '#0B0E2A'}
        className="transition-colors duration-300"
      />

      {/* 2. Vibrant Lime Green Nodes (Bottom Center + Right Node & Necks) */}
      <path
        d="M 35,76 
           C 38.5,69 44.5,59 50,53 
           C 57,53 63,40 63,28 
           A 15,15 0 1 1 93,28 
           C 93,48 68,83 50,83 
           C 42,83 36.5,79.5 35,76 
           Z"
        fill="#A3E635"
        className="fill-brand-accent transition-colors duration-300"
      />
    </svg>
  );
}
