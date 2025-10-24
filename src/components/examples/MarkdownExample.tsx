'use client';

import React, { useState } from 'react';
import { MarkdownRenderer, SimpleMarkdown, RichMarkdown } from '@/components/ui/MarkdownRenderer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

const sampleMarkdown = `# Welcome to Markdown Rendering

This is a **demonstration** of the markdown renderer with GitHub Flavored Markdown support.

## Features

- **Bold text** and *italic text*
- \`inline code\` and code blocks
- [Links](https://example.com) with automatic target="_blank"
- Tables with proper styling
- Blockquotes for emphasis

### Code Example

\`\`\`javascript
function greetUser(name) {
  return \`Hello, \${name}!\`;
}

console.log(greetUser('World'));
\`\`\`

### Table Example

| Feature | Status | Description |
|---------|--------|-------------|
| Headers | ✅ | Automatic slug generation |
| Links | ✅ | Auto-linking with security |
| Tables | ✅ | Responsive design |
| Code | ✅ | Syntax highlighting ready |

### Blockquote

> This is a blockquote that demonstrates the styling.
> It can span multiple lines and provides emphasis.

### Lists

1. **Ordered lists** work perfectly
2. With proper numbering
3. And nested items

- **Unordered lists** also work
- With bullet points
- And proper spacing

---

## Security Features

The renderer includes:
- **DOMPurify** for HTML sanitization
- **XSS protection** built-in
- **Safe link handling** with rel="noopener noreferrer"

### Advanced Features

- **Automatic heading links** (hover over headings)
- **GitHub Flavored Markdown** support
- **Responsive design** for all screen sizes
- **Dark theme** optimized styling
`;

export default function MarkdownExample() {
  const [customMarkdown, setCustomMarkdown] = useState('');
  const [activeTab, setActiveTab] = useState<'simple' | 'rich' | 'custom'>('simple');

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cyan-400 mb-4">
            Markdown Renderer Demo
          </h1>
          <p className="text-slate-300 text-lg">
            Rich markdown rendering with GitHub Flavored Markdown support
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-6">
          <Button
            onClick={() => setActiveTab('simple')}
            variant={activeTab === 'simple' ? 'default' : 'outline'}
            className={activeTab === 'simple' ? 'bg-cyan-600' : 'border-slate-600'}
          >
            Simple Markdown
          </Button>
          <Button
            onClick={() => setActiveTab('rich')}
            variant={activeTab === 'rich' ? 'default' : 'outline'}
            className={activeTab === 'rich' ? 'bg-cyan-600' : 'border-slate-600'}
          >
            Rich Markdown
          </Button>
          <Button
            onClick={() => setActiveTab('custom')}
            variant={activeTab === 'custom' ? 'default' : 'outline'}
            className={activeTab === 'custom' ? 'bg-cyan-600' : 'border-slate-600'}
          >
            Custom Input
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Side */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-cyan-400">
                {activeTab === 'custom' ? 'Custom Markdown Input' : 'Sample Markdown'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeTab === 'custom' ? (
                <Textarea
                  value={customMarkdown}
                  onChange={(e) => setCustomMarkdown(e.target.value)}
                  placeholder="Enter your markdown here..."
                  className="min-h-[400px] bg-slate-700 border-slate-600 text-white"
                />
              ) : (
                <pre className="bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-slate-300 whitespace-pre-wrap">
                  {sampleMarkdown}
                </pre>
              )}
            </CardContent>
          </Card>

          {/* Output Side */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-green-400">
                Rendered Output
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[500px] overflow-y-auto">
                {activeTab === 'simple' && (
                  <SimpleMarkdown content={sampleMarkdown} />
                )}
                {activeTab === 'rich' && (
                  <RichMarkdown content={sampleMarkdown} />
                )}
                {activeTab === 'custom' && (
                  <MarkdownRenderer 
                    content={customMarkdown || 'Enter some markdown to see it rendered here...'} 
                    className="min-h-[200px]"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Usage Examples */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-purple-400">Usage Examples</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="text-cyan-400 font-semibold mb-2">Simple Markdown</h4>
                <pre className="bg-slate-900 p-3 rounded text-sm text-slate-300 overflow-x-auto">
{`import { SimpleMarkdown } from '@/components/ui/MarkdownRenderer';

<SimpleMarkdown content={markdownText} />`}
                </pre>
              </div>
              
              <div>
                <h4 className="text-cyan-400 font-semibold mb-2">Rich Markdown</h4>
                <pre className="bg-slate-900 p-3 rounded text-sm text-slate-300 overflow-x-auto">
{`import { RichMarkdown } from '@/components/ui/MarkdownRenderer';

<RichMarkdown content={markdownText} />`}
                </pre>
              </div>
              
              <div>
                <h4 className="text-cyan-400 font-semibold mb-2">Custom Renderer</h4>
                <pre className="bg-slate-900 p-3 rounded text-sm text-slate-300 overflow-x-auto">
{`import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

<MarkdownRenderer 
  content={markdownText}
  className="custom-styles"
  allowHtml={true}
  sanitize={true}
/>`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
