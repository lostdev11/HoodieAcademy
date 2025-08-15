import type { LucideIcon } from "lucide-react";
import type { ElementType } from "react";
import { Button } from "@/components/ui/button";
import { Lock, Clock, Users } from "lucide-react";
import { getSquadForCourse } from "@/lib/squadData";

export interface GatedCourseCardProps {
  id: string;
  title: string;
  description: string;
  badge: string;
  emoji: string;
  pathType: "tech" | "social" | "converged";
  squad?: string;
  level?: string;
  access?: string;
}

export function GatedCourseCard({ id, title, description, badge, emoji, pathType, squad, level, access }: GatedCourseCardProps) {
  const squadData = getSquadForCourse(id);
  
  const baseBorderClass = "border-2 rounded-xl p-5 md:p-6 transition-all duration-300 w-full min-h-[300px] md:min-h-[340px] flex flex-col opacity-60";
  const techClass = "border-purple-500/30 bg-slate-800/30";
  const socialClass = "border-blue-500/30 bg-slate-800/30";
  const convergedClass = "border-cyan-500/30 bg-slate-800/30";

  let pathClasses = "";
  switch (pathType) {
    case "tech":
      pathClasses = techClass;
      break;
    case "social":
      pathClasses = socialClass;
      break;
    case "converged":
      pathClasses = convergedClass;
      break;
  }

  const getAccessBadge = () => {
    if (access === "Hoodie-Gated") {
      return {
        text: "Hoodie Gated",
        color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
        icon: <Users className="w-3 h-3" />
      };
    }
    return {
      text: "Coming Soon",
      color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      icon: <Clock className="w-3 h-3" />
    };
  };

  const accessBadge = getAccessBadge();

  return (
    <div className="space-y-4">
      {/* Squad Badge */}
      {squadData && (
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${squadData.bgColor} ${squadData.borderColor} border`}>
          <span>{squadData.icon}</span>
          <span className={squadData.color}>{squadData.name}</span>
        </div>
      )}
      
      <div className={`${baseBorderClass} ${pathClasses} relative overflow-hidden`}>
        {/* Blur overlay */}
        <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"></div>
        
        {/* Lock icon overlay */}
        <div className="absolute top-4 right-4">
          <Lock className="w-6 h-6 text-gray-400" />
        </div>

        <div className="relative z-10">
          <div className="flex items-start gap-3 mb-3 md:mb-4">
            <span className="text-3xl md:text-4xl mt-1 flex-shrink-0 opacity-50">{emoji}</span>
            <div className="flex-grow">
              <h3 className="text-xl md:text-2xl font-bold text-gray-400 flex items-center">
                {title}
              </h3>
              <p className="text-sm md:text-md text-gray-500 mt-1">{description}</p>
            </div>
          </div>
          
          <div className="flex-grow"></div>
          
          {/* Access Badge */}
          <div className="mt-auto pt-4">
            <div className="flex items-center gap-2 mb-3">
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${accessBadge.color}`}>
                {accessBadge.icon}
                <span>{accessBadge.text}</span>
              </div>
              {level && (
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-slate-700/50 text-gray-400 border border-slate-600/30">
                  <span>{level}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-600/30 flex justify-between items-center">
            <p className="text-xs md:text-sm font-semibold text-gray-500">REWARD: {badge} NFT</p>
            <Button 
              disabled
              size="sm" 
              className="bg-gray-600 text-gray-400 cursor-not-allowed"
            >
              <Lock className="w-4 h-4 mr-1" />
              Locked
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 