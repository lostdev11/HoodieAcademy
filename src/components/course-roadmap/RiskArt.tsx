
interface RiskArtProps {
  type: "phishing" | "fomo";
  className?: string;
}

export function RiskArt({ type, className }: RiskArtProps) {
  const content = {
    phishing: {
      emoji: "🎣",
      label: "Phishing Trap!",
      color: "text-red-400",
      bgColor: "bg-red-900/30",
      borderColor: "border-red-500/50"
    },
    fomo: {
      emoji: "🎢",
      label: "FOMO Cliff!",
      color: "text-orange-400",
      bgColor: "bg-orange-900/30",
      borderColor: "border-orange-500/50"
    },
  };

  const current = content[type];

  return (
    <div className={`p-3 rounded-lg border ${current.borderColor} ${current.bgColor} flex items-center space-x-2 shadow-md ${className}`}>
      <span className="text-2xl md:text-3xl">{current.emoji}</span>
      <span className={`text-xs md:text-sm font-medium ${current.color}`}>{current.label}</span>
    </div>
  );
}
