"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import DOMPurify from "isomorphic-dompurify";

type Props = {
  content: string;          // raw markdown from DB
  className?: string;       // optional extra classes
};

export default function Markdown({ content, className }: Props) {
  // Sanitize to prevent XSS (especially if content is user-generated)
  const safe = React.useMemo(() => DOMPurify.sanitize(content), [content]);

  return (
    <div className={`prose dark:prose-invert max-w-none ${className ?? ""}`}>
      <ReactMarkdown
        // remark adds Markdown features (tables, strikethrough, autolinks)
        remarkPlugins={[remarkGfm]}
        // rehype for heading ids + clickable anchors
        rehypePlugins={[
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "append" }],
        ]}
      >
        {safe}
      </ReactMarkdown>
    </div>
  );
}
