'use client';

import React from 'react';
import Markdown from '@/components/Markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const sampleBountyDescriptions = [
  {
    title: "Simple Text Description",
    content: "This is a simple bounty description with plain text. No special formatting needed."
  },
  {
    title: "Markdown Description",
    content: `# Bounty: Create a React Component

This bounty requires you to create a **React component** that displays user data.

## Requirements

- Use TypeScript
- Include proper error handling
- Add unit tests
- Follow accessibility guidelines

## Submission Guidelines

1. Fork the repository
2. Create your component
3. Add tests
4. Submit a pull request

> **Note**: Make sure to follow the coding standards outlined in our style guide.`
  },
  {
    title: "Complex Markdown Description",
    content: `# 🎯 Advanced Bounty: Full-Stack Dashboard

Create a comprehensive dashboard application with the following features:

## 🚀 Core Features

### Frontend Requirements
- **React 18+** with TypeScript
- **Tailwind CSS** for styling
- **Responsive design** for mobile/desktop
- **Dark/Light theme** support

### Backend Requirements
- **Node.js** with Express
- **PostgreSQL** database
- **JWT authentication**
- **RESTful API** design

## 📋 Technical Specifications

| Feature | Priority | Estimated Time |
|---------|----------|----------------|
| User Authentication | High | 2-3 days |
| Dashboard Layout | High | 1-2 days |
| Data Visualization | Medium | 3-4 days |
| Mobile Responsiveness | Medium | 1-2 days |

## 🎨 Design Requirements

- Follow [Material Design](https://material.io) principles
- Use consistent color scheme
- Implement smooth animations
- Ensure accessibility compliance

## 📝 Submission Process

1. **Fork** the repository
2. **Create** a feature branch
3. **Implement** all requirements
4. **Write** comprehensive tests
5. **Document** your code
6. **Submit** a pull request

## 🔍 Evaluation Criteria

- ✅ Code quality and organization
- ✅ Test coverage (minimum 80%)
- ✅ Performance optimization
- ✅ Security best practices
- ✅ Documentation completeness

> **Bonus Points**: Include Docker configuration and CI/CD pipeline setup.

**Deadline**: 2 weeks from acceptance
**Reward**: 500 XP + Special NFT Badge`
  }
];

export default function MarkdownUsageExample() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cyan-400 mb-4">
            Markdown Component Usage
          </h1>
          <p className="text-slate-300 text-lg">
            Examples of how the Markdown component renders different content types
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sampleBountyDescriptions.map((example, index) => (
            <Card key={index} className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-cyan-400">{example.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-slate-900 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Raw Content:</h4>
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap overflow-x-auto">
                      {example.content}
                    </pre>
                  </div>
                  
                  <div className="bg-slate-700 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Rendered Output:</h4>
                    <Markdown content={example.content} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Usage Examples */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-purple-400">Usage Examples</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-cyan-400 font-semibold mb-2">Basic Usage</h4>
                <pre className="bg-slate-900 p-3 rounded text-sm text-slate-300 overflow-x-auto">
{`import Markdown from '@/components/Markdown';

<Markdown content={bounty.short_desc} />`}
                </pre>
              </div>
              
              <div>
                <h4 className="text-cyan-400 font-semibold mb-2">With Custom Styling</h4>
                <pre className="bg-slate-900 p-3 rounded text-sm text-slate-300 overflow-x-auto">
{`import Markdown from '@/components/Markdown';

<Markdown 
  content={bounty.short_desc}
  className="custom-prose-styles"
/>`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-green-400">Markdown Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-cyan-400 font-semibold mb-2">✅ Supported Features</h4>
                <ul className="text-slate-300 space-y-1 text-sm">
                  <li>• Headers (H1-H6)</li>
                  <li>• Bold and italic text</li>
                  <li>• Code blocks and inline code</li>
                  <li>• Tables with responsive design</li>
                  <li>• Lists (ordered and unordered)</li>
                  <li>• Blockquotes</li>
                  <li>• Links with security</li>
                  <li>• Strikethrough text</li>
                  <li>• Task lists</li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-cyan-400 font-semibold mb-2">🔒 Security Features</h4>
                <ul className="text-slate-300 space-y-1 text-sm">
                  <li>• XSS protection with DOMPurify</li>
                  <li>• HTML sanitization</li>
                  <li>• Safe link handling</li>
                  <li>• Content validation</li>
                  <li>• Automatic heading IDs</li>
                  <li>• Clickable heading links</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
