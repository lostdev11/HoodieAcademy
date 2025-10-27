'use client';

import React from 'react';

interface LinkifyTextProps {
  text: string;
  className?: string;
}

// Utility function to convert URLs in text to clickable links
export function LinkifyText({ text, className = '' }: LinkifyTextProps) {
  if (!text) return null;

  // Regular expression to match URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  // Split the text by URLs
  const parts = text.split(urlRegex);
  
  return (
    <span className={className}>
      {parts.map((part, index) => {
        // Check if this part is a URL
        if (urlRegex.test(part)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 underline break-all"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }
        // Return the text part as-is
        return part;
      })}
    </span>
  );
}

