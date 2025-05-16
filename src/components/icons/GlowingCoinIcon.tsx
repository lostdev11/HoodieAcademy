
import type { SVGProps } from "react";

export function GlowingCoinIcon(props: SVGProps<SVGSVGElement>) {
  // Simple circle with a slight glow effect placeholder
  // Replace with a more detailed SVG or icon library component if available
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <circle cx="12" cy="12" r="8" fill="currentColor" filter="url(#glow)" />
      {/* Optional: Add a symbol inside like '$' or a doge head if needed */}
       <text x="50%" y="50%" dy=".3em" textAnchor="middle" fontSize="8" fill="black">$</text>
    </svg>
  );
}
