'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Markdown from '@/components/Markdown';

interface ExpandableMarkdownProps {
  content: string;
  maxLength?: number;
  className?: string;
  showToggle?: boolean;
}

export function ExpandableMarkdown({ 
  content, 
  maxLength = 200, 
  className = '',
  showToggle = true 
}: ExpandableMarkdownProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Check if content needs truncation
  const needsTruncation = content.length > maxLength;
  const displayContent = isExpanded || !needsTruncation 
    ? content 
    : content.substring(0, maxLength) + '...';

  if (!content) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="text-gray-300">
        <Markdown content={displayContent} />
      </div>
      
      {needsTruncation && showToggle && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 p-1 h-auto text-xs"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3 h-3 mr-1" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3 mr-1" />
              Show More
            </>
          )}
        </Button>
      )}
    </div>
  );
}

// Alternative component with line-based truncation
interface ExpandableMarkdownLinesProps {
  content: string;
  maxLines?: number;
  className?: string;
  showToggle?: boolean;
}

export function ExpandableMarkdownLines({ 
  content, 
  maxLines = 3, 
  className = '',
  showToggle = true 
}: ExpandableMarkdownLinesProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!content) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div 
        className={`text-gray-300 ${
          !isExpanded ? `line-clamp-${maxLines}` : ''
        }`}
      >
        <Markdown content={content} />
      </div>
      
      {showToggle && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 p-1 h-auto text-xs"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3 h-3 mr-1" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3 mr-1" />
              Show More
            </>
          )}
        </Button>
      )}
    </div>
  );
}
