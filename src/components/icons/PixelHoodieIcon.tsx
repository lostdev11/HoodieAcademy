
import type { SVGProps } from "react";

export function PixelHoodieIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      {/* Hood part */}
      <rect x="8" y="4" width="8" height="2" />
      <rect x="7" y="6" width="2" height="2" />
      <rect x="15" y="6" width="2" height="2" />
      <rect x="6" y="8" width="2" height="2" />
      <rect x="16" y="8" width="2" height="2" />
      {/* Body part */}
      <rect x="6" y="10" width="12" height="2" />
      <rect x="5" y="12" width="14" height="2" />
      <rect x="5" y="14" width="14" height="2" />
      <rect x="6" y="16" width="12" height="2" />
      {/* Pocket */}
      <rect x="8" y="14" width="8" height="1" fillOpacity="0.5"/>
       {/* Sleeves (simplified) */}
      <rect x="3" y="12" width="2" height="3" />
      <rect x="19" y="12" width="2" height="3" />
    </svg>
  );
}
