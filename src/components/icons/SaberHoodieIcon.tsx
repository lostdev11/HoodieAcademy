
import type { SVGProps } from "react";

export function SaberHoodieIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      {/* Hoodie Shape */}
      <path d="M12 2C8.69 2 6 4.69 6 8H4c-1.11 0-2 .89-2 2v8c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2v-8c0-1.11-.89-2-2-2h-2c0-3.31-2.69-6-6-6zm0 2c2.21 0 4 1.79 4 4H8c0-2.21 1.79-4 4-4z" />
      {/* Pocket */}
      <path d="M8 15h8v2H8z" opacity="0.7" />
      {/* "Saber" Element - a glowing vertical bar */}
      <rect x="11" y="12" width="2" height="6" fill="cyan" />
      <rect x="11" y="12" width="2" height="6" fill="white" opacity="0.5" style={{filter: "blur(1px)"}}/>
    </svg>
  );
}
