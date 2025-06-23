import type { LucideIcon } from "lucide-react";
import type { ElementType } from "react";
import { Button } from "@/components/ui/button"; // Import Button
import Link from "next/link"; // Import Link
import { ArrowRight, CheckCircle, LockKeyhole } from "lucide-react";
import { RiskArt } from "./RiskArt"; // Import RiskArt
import { Progress } from "@/components/ui/progress"; // Import Progress

export interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  badge: string;
  emoji: string; // Changed from icon to emoji
  pathType: "tech" | "social" | "converged";
  href: string; // Add href for the link
  riskType?: "phishing" | "fomo"; // Optional risk type
  isCompleted?: boolean; // New prop for completion status
  isLocked?: boolean; // New prop for locked status
  progress?: number; // New prop for progress percentage
  localStorageKey?: string; // To help identify in arrays
  totalLessons?: number; // To help verify completion
}

export function CourseCard({ title, description, badge, emoji, pathType, href, riskType, isCompleted, isLocked, progress }: CourseCardProps) {
  const baseBorderClass = "border-2 rounded-xl p-5 md:p-6 transition-all duration-300 w-full min-h-[300px] md:min-h-[340px] flex flex-col"; // Adjusted min-height
  const techClass = "neon-border-purple hover:shadow-[0_0_25px_rgba(168,85,247,1)] bg-card";
  const socialClass = "neon-border-blue hover:shadow-[0_0_25px_rgba(59,130,246,1)] bg-card";
  const convergedClass = "neon-border-cyan hover:shadow-[0_0_25px_rgba(6,182,212,1)] bg-card"; // Cyan for converged

  let pathClasses = "";
  let buttonClass = "";
  let progressClass = "";
  switch (pathType) {
    case "tech":
      pathClasses = techClass;
      buttonClass = "bg-purple-600 hover:bg-purple-700";
      progressClass = "bg-purple-500";
      break;
    case "social":
      pathClasses = socialClass;
       buttonClass = "bg-blue-600 hover:bg-blue-700";
       progressClass = "bg-blue-500";
      break;
    case "converged":
      pathClasses = convergedClass;
       buttonClass = "bg-cyan-600 hover:bg-cyan-700";
       progressClass = "bg-cyan-500";
      break;
  }

  return (
    <div className={`${baseBorderClass} ${pathClasses}`}>
      <div className="flex items-start gap-3 mb-3 md:mb-4"> {/* Changed to items-start and gap-3 */}
        {/* Use emoji span instead of Icon component */}
        <span className="text-3xl md:text-4xl mt-1 flex-shrink-0">{emoji}</span> {/* Added mt-1 and flex-shrink-0 */}
        <div className="flex-grow"> {/* Added flex-grow wrapper */}
          <h3 className="text-xl md:text-2xl font-bold text-foreground flex items-center">
            {title}
            {isCompleted && <CheckCircle size={22} className="ml-2 text-green-500 flex-shrink-0" />}
          </h3>
           <p className="text-sm md:text-md text-muted-foreground mt-1">{description}</p> {/* Moved description here */}
        </div>
      </div>
      <p className="flex-grow text-sm md:text-md text-muted-foreground"></p> {/* Spacer */}
      {/* Progress Bar */}
      <div className="mt-auto pt-4">
        <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-muted-foreground">PROGRESS</span>
            <span className="text-xs font-bold text-primary">{progress ?? 0}%</span>
        </div>
        <Progress value={progress} className={`h-2 [&>div]:${progressClass}`} />
      </div>
       <div className="mt-4 pt-3 border-t border-border/50 flex justify-between items-center">
         <p className="text-xs md:text-sm font-semibold text-primary">REWARD: {badge} NFT</p>
         <Button 
            asChild={!isLocked} 
            size="sm" 
            className={`${buttonClass} text-white ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isLocked}
          >
           {isLocked ? (
            <div className="flex items-center space-x-1">
              <LockKeyhole size={14} />
              <span>Locked</span>
            </div>
          ) : (
            <Link href={href} className="flex items-center space-x-1">
              <span>Begin</span>
              <ArrowRight size={14} />
            </Link>
          )}
         </Button>
      </div>
      {/* Conditionally render RiskArt inside the card */}
      {riskType && (
        <div className="mt-3">
            <RiskArt type={riskType} />
        </div>
       )}
    </div>
  );
}

    
