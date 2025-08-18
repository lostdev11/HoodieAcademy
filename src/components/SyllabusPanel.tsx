'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp, BookOpen, Target, Clock, FileText, Video, Link as LinkIcon, X } from 'lucide-react';

export interface SyllabusData {
  overview: string;
  objectives: string[];
  materials: {
    type: 'video' | 'pdf' | 'link' | 'tweet';
    title: string;
    url?: string;
    description?: string;
  }[];
  estimatedTime: string;
  quizOverview?: {
    totalQuestions: number;
    passingScore: number;
    topics: string[];
  };
}

interface SyllabusPanelProps {
  data: SyllabusData | null;
  courseTitle: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SyllabusPanel({ data, courseTitle, isOpen, onClose }: SyllabusPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'pdf': return <FileText className="w-4 h-4" />;
      case 'tweet': return <LinkIcon className="w-4 h-4" />;
      default: return <LinkIcon className="w-4 h-4" />;
    }
  };

  if (!isOpen || !data || !courseTitle) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-96 lg:w-[450px] bg-slate-900/95 backdrop-blur-md border-l border-cyan-500/30 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-cyan-500/30 bg-slate-800/50">
            <CardTitle className="text-cyan-400 flex items-center gap-2 text-lg">
              <BookOpen className="w-5 h-5" />
              Syllabus
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-300 hover:bg-gray-500/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Course Title */}
          <div className="p-4 border-b border-cyan-500/20 bg-slate-800/30">
            <h2 className="text-xl font-bold text-white">{courseTitle}</h2>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {isExpanded && (
              <>
                {/* Course Overview */}
                <div>
                  <h4 className="text-lg font-semibold text-cyan-400 mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Course Overview
                  </h4>
                  <p className="text-gray-300 leading-relaxed">{data.overview}</p>
                </div>

                {/* Learning Objectives */}
                <div>
                  <h4 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Learning Objectives
                  </h4>
                  <ul className="space-y-2">
                    {data.objectives.map((objective, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-300">
                        <span className="text-cyan-400 mt-1">•</span>
                        <span>{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Materials & Links */}
                {data.materials.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Materials & Resources
                    </h4>
                    <div className="space-y-3">
                      {data.materials.map((material, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
                          <div className="text-cyan-400">
                            {getMaterialIcon(material.type)}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-200">{material.title}</div>
                            {material.description && (
                              <div className="text-sm text-gray-400">{material.description}</div>
                            )}
                          </div>
                          {material.url && (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="text-cyan-400 hover:text-cyan-300 border-cyan-500/30"
                            >
                              <a href={material.url} target="_blank" rel="noopener noreferrer">
                                Open
                              </a>
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Estimated Time */}
                <div>
                  <h4 className="text-lg font-semibold text-cyan-400 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Estimated Completion Time
                  </h4>
                  <p className="text-gray-300">{data.estimatedTime}</p>
                </div>

                {/* Quiz Overview */}
                {data.quizOverview && (
                  <div>
                    <h4 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Quiz Overview
                    </h4>
                    <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-600/30">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-400">Total Questions</div>
                          <div className="text-lg font-semibold text-cyan-400">{data.quizOverview.totalQuestions}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400">Passing Score</div>
                          <div className="text-lg font-semibold text-green-400">{data.quizOverview.passingScore}%</div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="text-sm text-gray-400 mb-2">Topics Covered:</div>
                        <div className="flex flex-wrap gap-2">
                          {data.quizOverview.topics.map((topic, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded border border-cyan-500/30"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 