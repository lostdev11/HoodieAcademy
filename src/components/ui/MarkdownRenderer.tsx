'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import DOMPurify from 'isomorphic-dompurify';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  allowHtml?: boolean;
  sanitize?: boolean;
}

export function MarkdownRenderer({ 
  content, 
  className = '', 
  allowHtml = false,
  sanitize = true 
}: MarkdownRendererProps) {
  // Sanitize content if needed
  const processedContent = sanitize && allowHtml 
    ? DOMPurify.sanitize(content)
    : content;

  return (
    <div className={`prose prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: 'wrap' }]
        ]}
        components={{
          // Custom styling for different elements
          h1: ({ children, ...props }) => (
            <h1 className="text-3xl font-bold text-cyan-400 mb-4 border-b border-cyan-500/30 pb-2" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-2xl font-bold text-purple-400 mb-3 mt-6" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-xl font-semibold text-green-400 mb-2 mt-4" {...props}>
              {children}
            </h3>
          ),
          p: ({ children, ...props }) => (
            <p className="text-slate-300 mb-4 leading-relaxed" {...props}>
              {children}
            </p>
          ),
          code: ({ children, className, ...props }) => {
            const isInline = !className;
            return isInline ? (
              <code className="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            ) : (
              <code className="block bg-slate-900 text-slate-300 p-4 rounded-lg overflow-x-auto text-sm font-mono border border-slate-700" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children, ...props }) => (
            <pre className="bg-slate-900 border border-slate-700 rounded-lg p-4 overflow-x-auto mb-4" {...props}>
              {children}
            </pre>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote className="border-l-4 border-purple-500 pl-4 py-2 bg-purple-900/20 rounded-r-lg mb-4 italic text-purple-200" {...props}>
              {children}
            </blockquote>
          ),
          ul: ({ children, ...props }) => (
            <ul className="list-disc list-inside text-slate-300 mb-4 space-y-1" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal list-inside text-slate-300 mb-4 space-y-1" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="text-slate-300" {...props}>
              {children}
            </li>
          ),
          a: ({ children, href, ...props }) => (
            <a 
              href={href} 
              className="text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/50 hover:decoration-cyan-400 transition-colors" 
              target="_blank" 
              rel="noopener noreferrer"
              {...props}
            >
              {children}
            </a>
          ),
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-slate-700 rounded-lg" {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead className="bg-slate-800" {...props}>
              {children}
            </thead>
          ),
          th: ({ children, ...props }) => (
            <th className="px-4 py-2 text-left text-cyan-400 font-semibold border-b border-slate-700" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="px-4 py-2 text-slate-300 border-b border-slate-700/50" {...props}>
              {children}
            </td>
          ),
          hr: ({ ...props }) => (
            <hr className="border-slate-700 my-6" {...props} />
          ),
          strong: ({ children, ...props }) => (
            <strong className="font-bold text-white" {...props}>
              {children}
            </strong>
          ),
          em: ({ children, ...props }) => (
            <em className="italic text-slate-200" {...props}>
              {children}
            </em>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}

// Simple markdown renderer for basic content
export function SimpleMarkdown({ content, className = '' }: { content: string; className?: string }) {
  return (
    <MarkdownRenderer 
      content={content} 
      className={className}
      allowHtml={false}
      sanitize={true}
    />
  );
}

// Rich markdown renderer with HTML support
export function RichMarkdown({ content, className = '' }: { content: string; className?: string }) {
  return (
    <MarkdownRenderer 
      content={content} 
      className={className}
      allowHtml={true}
      sanitize={true}
    />
  );
}