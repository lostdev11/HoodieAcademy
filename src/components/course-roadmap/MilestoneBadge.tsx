
interface MilestoneBadgeProps {
  text: string;
  className?: string;
}

export function MilestoneBadge({ text, className }: MilestoneBadgeProps) {
  return (
    <div className={`px-4 py-2 rounded-full text-sm md:text-md font-semibold shadow-lg neon-border-green text-background bg-green-500 ${className}`}>
      {text}
    </div>
  );
}
