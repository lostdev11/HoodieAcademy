import React from 'react';

interface HoodieIconProps {
  // Define props here if needed, e.g., size, color
  size?: number;
  color?: string;
}

export const HoodieIcon: React.FC<HoodieIconProps> = ({ size = 24, color = 'currentColor' }) => {
  // This is a placeholder. You would replace the SVG path with your actual Hoodie icon SVG.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Replace with your Hoodie icon SVG path(s) */}
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}; 