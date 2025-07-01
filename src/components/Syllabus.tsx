'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp, BookOpen, Target, Clock, FileText, Video, Link as LinkIcon } from 'lucide-react';

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

interface SyllabusProps {
  data: SyllabusData;
  courseTitle: string;
}

export function Syllabus({ data, courseTitle }: SyllabusProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'pdf': return <FileText className="w-4 h-4" />;
      case 'tweet': return <LinkIcon className="w-4 h-4" />;
      default: return <LinkIcon className="w-4 h-4" />;
    }
  };

  return (
    <Card className="bg-slate-800/50 border-2 border-cyan-500/30 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            📘 Syllabus
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0 space-y-6">
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
        </CardContent>
      )}
    </Card>
  );
} 