'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Markdown from '@/components/Markdown';

interface ExpandableDescriptionProps {
  content: string;
  maxLength?: number;
  className?: string;
  showToggle?: boolean;
  isMarkdown?: boolean;
}

export function ExpandableDescription({ 
  content, 
  maxLength = 150, 
  className = '',
  showToggle = true 
}: ExpandableDescriptionProps) {
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
      <p className="text-gray-300 break-words leading-relaxed whitespace-pre-wrap">
        {displayContent}
      </p>
      
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
interface ExpandableDescriptionLinesProps {
  content: string;
  maxLines?: number;
  className?: string;
  showToggle?: boolean;
}

export function ExpandableDescriptionLines({ 
  content, 
  maxLines = 3, 
  className = '',
  showToggle = true 
}: ExpandableDescriptionLinesProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!content) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div 
        className={`text-gray-300 break-words leading-relaxed whitespace-pre-wrap ${
          !isExpanded ? `line-clamp-${maxLines}` : ''
        }`}
      >
        {content}
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

// Simple expandable text component
interface ExpandableTextProps {
  children: React.ReactNode;
  maxHeight?: string;
  className?: string;
}

export function ExpandableText({ 
  children, 
  maxHeight = '6rem', 
  className = '' 
}: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className={`space-y-2 ${className}`}>
      <div 
        className={`overflow-hidden transition-all duration-300 ${
          isExpanded ? '' : `max-h-[${maxHeight}]`
        }`}
        style={{ maxHeight: isExpanded ? 'none' : maxHeight }}
      >
        {children}
      </div>
      
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
    </div>
  );
}
