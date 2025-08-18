import type { LucideIcon } from "lucide-react";
import type { ElementType } from "react";
import { Button } from "@/components/ui/button"; // Import Button
import Link from "next/link"; // Import Link
import { ArrowRight, CheckCircle, BookOpen } from "lucide-react";
import { RiskArt } from "./RiskArt"; // Import RiskArt
import { Progress } from "@/components/ui/progress"; // Import Progress
import { getSquadForCourse } from "@/lib/squadData"; // Import squad data
import { Syllabus } from "@/components/Syllabus"; // Import Syllabus component
import { syllabusData } from "@/lib/syllabusData"; // Import syllabus data
import { useState } from "react"; // Import useState

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
  progress?: number; // New prop for progress percentage
  localStorageKey?: string; // To help identify in arrays
  totalLessons?: number; // To help verify completion
  isAdmin?: boolean; // New prop for admin mode
  onResetCourse?: (courseId: string) => void; // New prop for reset function
}

export function CourseCard({ id, title, description, badge, emoji, pathType, href, riskType, isCompleted, progress, isAdmin, onResetCourse }: CourseCardProps) {
  const [showSyllabus, setShowSyllabus] = useState(false);
  const squad = getSquadForCourse(id);
  
  const baseBorderClass = "border-2 rounded-xl p-4 sm:p-5 md:p-6 transition-all duration-300 w-full min-h-[280px] sm:min-h-[300px] md:min-h-[340px] flex flex-col"; // Adjusted min-height and padding for mobile
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
    <div className="space-y-4">
      {/* Squad Badge */}
      {squad && (
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${squad.bgColor} ${squad.borderColor} border`}>
          <span>{squad.icon}</span>
          <span className={squad.color}>{squad.name}</span>
        </div>
      )}
      
      <div className={`${baseBorderClass} ${pathClasses}`}>
        <div className="flex items-start gap-2 sm:gap-3 mb-3 md:mb-4"> {/* Adjusted gap for mobile */}
          {/* Use emoji span instead of Icon component */}
          <span className="text-2xl sm:text-3xl md:text-4xl mt-1 flex-shrink-0">{emoji}</span> {/* Adjusted text size for mobile */}
          <div className="flex-grow"> {/* Added flex-grow wrapper */}
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground flex items-center leading-tight"> {/* Adjusted text size and added leading-tight */}
              {title}
              {isCompleted && <CheckCircle size={20} className="ml-2 text-green-500 flex-shrink-0" />} {/* Adjusted icon size */}
            </h3>
             <p className="text-xs sm:text-sm md:text-md text-muted-foreground mt-1 leading-relaxed">{description}</p> {/* Adjusted text size and added leading-relaxed */}
          </div>
        </div>
        <p className="flex-grow text-sm md:text-md text-muted-foreground"></p> {/* Spacer */}
        {/* Progress Bar */}
        <div className="mt-auto pt-3 sm:pt-4">
          <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-muted-foreground">PROGRESS</span>
              <span className="text-xs font-bold text-primary">{progress ?? 0}%</span>
          </div>
          <Progress value={progress} className={`h-2 sm:h-2 [&>div]:${progressClass}`} />
        </div>
         <div className="mt-4 pt-3 border-t border-border/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
           <p className="text-xs md:text-sm font-semibold text-primary">REWARD: {badge} NFT</p>
           <div className="flex flex-wrap gap-2 w-full sm:w-auto">
             {/* Syllabus Button */}
             <Button
               variant="outline"
               size="sm"
               onClick={() => setShowSyllabus(!showSyllabus)}
               className="text-cyan-400 hover:text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/10 flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9"
             >
               <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
               Syllabus
             </Button>
             {/* Admin Reset Button */}
             {isAdmin && onResetCourse && (
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => onResetCourse(id)}
                 className="text-orange-400 hover:text-orange-300 border-orange-500/30 hover:bg-orange-500/10 flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9"
               >
                 Reset
               </Button>
             )}
             {/* Begin Button */}
             <Button 
                asChild={true} 
                size="sm" 
                className={`${buttonClass} text-white flex-1 sm:flex-none text-xs sm:text-sm h-8 sm:h-9`}
              >
                <Link href={href} className="flex items-center justify-center space-x-1">
                  <span>Begin</span>
                  <ArrowRight size={12} className="sm:w-3 sm:h-3" />
                </Link>
             </Button>
           </div>
        </div>
        {/* Conditionally render RiskArt inside the card */}
        {riskType && (
          <div className="mt-3">
              <RiskArt type={riskType} />
          </div>
         )}
      </div>
      
      {/* Syllabus Modal */}
      {showSyllabus && syllabusData[id] && (
        <div className="mt-4">
          <Syllabus data={syllabusData[id]} courseTitle={title} />
        </div>
      )}
    </div>
  );
}

    
