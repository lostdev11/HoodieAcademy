import React from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export interface CourseCardProps {
  title: string;
  description: string;
  href: string;
  isLocked?: boolean;
  isCompleted?: boolean;
  completionPercentage: number;
}

export const CourseCard: React.FC<CourseCardProps> = ({ title, description, href, isLocked, isCompleted, completionPercentage }) => {
  return (
    <div className={
      `border rounded-lg p-4 shadow-md flex flex-col justify-between h-full
       ${isLocked
         ? 'border-gray-700 text-gray-500 bg-gray-800 cursor-not-allowed'
         : 'border-cyan-600 text-white bg-gray-800 hover:shadow-[0_0_25px_rgba(56,189,248,0.5)] transition-shadow duration-300'
       }`
    }>
      <div>
        <h3 className={`text-xl font-semibold ${isLocked ? 'text-gray-500' : 'text-cyan-400'}`}>{title}</h3>
        <p className={`mt-2 ${isLocked ? 'text-gray-600' : 'text-gray-400'}`}>{description}</p>
      </div>
      
      <div className="w-full mt-4">
        <Progress value={completionPercentage} className="w-full h-2 bg-gray-700 rounded-full" />
        <p className="text-sm text-center mt-1">{completionPercentage.toFixed(0)}% Completed</p>
      </div>

      <div className="mt-4">
        <Button 
          asChild
          className={
            `w-full text-white
             ${isLocked
               ? 'bg-gray-600 cursor-not-allowed'
               : isCompleted
                 ? 'bg-green-600 hover:bg-green-700'
                 : 'bg-purple-600 hover:bg-purple-700'
             }`
          }
          disabled={isLocked}
        >
          <Link href={isLocked ? '#' : href}>
            {isLocked ? 'Locked' : isCompleted ? 'View Course' : 'Begin Course'}
          </Link>
        </Button>
      </div>
    </div>
  );
}; 