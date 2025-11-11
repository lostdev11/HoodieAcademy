'use client';

import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

interface BlogPostContentProps {
  content: string;
}

export default function BlogPostContent({ content }: BlogPostContentProps) {
  return (
    <div className="prose prose-invert prose-lg max-w-none">
      <MarkdownRenderer content={content} />
    </div>
  );
}

