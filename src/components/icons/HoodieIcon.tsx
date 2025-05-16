
import type { SVGProps } from "react";

export function HoodieIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      {/* Hood */}
      <path d="M12,2A6,6,0,0,0,6,8H4a2,2,0,0,0-2,2v8a2,2,0,0,0,2,2H20a2,2,0,0,0,2-2V10a2,2,0,0,0-2-2H18A6,6,0,0,0,12,2Zm0,2a4,4,0,0,1,4,4H8A4,4,0,0,1,12,4Z" />
      {/* Body */}
      <rect x="4" y="10" width="16" height="10" rx="1" />
      {/* Pocket */}
      <path d="M8,15h8v2H8Z" opacity="0.7" />
    </svg>
  );
}
