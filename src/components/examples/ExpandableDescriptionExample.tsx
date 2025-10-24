'use client';

import React, { useState } from 'react';
import { ExpandableDescription, ExpandableDescriptionLines, ExpandableText } from '@/components/ui/ExpandableDescription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const sampleDescriptions = [
  {
    title: "Short Description",
    content: "This is a short bounty description that doesn't need truncation."
  },
  {
    title: "Medium Description", 
    content: "This is a medium-length bounty description that might need some truncation depending on the settings. It contains enough text to demonstrate the expandable functionality but isn't extremely long."
  },
  {
    title: "Long Description",
    content: "This is a very long bounty description that will definitely need truncation. It contains multiple sentences and paragraphs of text to demonstrate how the expandable description component works. The description includes detailed information about what the bounty requires, what the reward is, and how to submit. It also includes additional context about the project, the community, and any special requirements or considerations that participants should be aware of. This type of long description is common in real-world bounties where detailed instructions and context are important for successful completion."
  },
  {
    title: "Very Long Description",
    content: "This is an extremely long bounty description that will definitely need truncation and demonstrates the full functionality of the expandable description component. It contains multiple paragraphs of detailed information about the bounty requirements, submission guidelines, evaluation criteria, and additional context. The description includes step-by-step instructions, examples, and references to external resources. It also provides background information about the project, the community goals, and how this specific bounty fits into the larger ecosystem. This type of comprehensive description is often necessary for complex bounties that require significant effort and understanding to complete successfully. The expandable functionality ensures that users can read the full description when needed while keeping the initial view clean and manageable."
  }
];

export default function ExpandableDescriptionExample() {
  const [activeExample, setActiveExample] = useState<'character' | 'lines' | 'height'>('character');

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cyan-400 mb-4">
            Expandable Description Demo
          </h1>
          <p className="text-slate-300 text-lg">
            Test different expandable description components
          </p>
        </div>

        {/* Example Type Selector */}
        <div className="flex justify-center space-x-4 mb-6">
          <Button
            onClick={() => setActiveExample('character')}
            variant={activeExample === 'character' ? 'default' : 'outline'}
            className={activeExample === 'character' ? 'bg-cyan-600' : 'border-slate-600'}
          >
            Character-based Truncation
          </Button>
          <Button
            onClick={() => setActiveExample('lines')}
            variant={activeExample === 'lines' ? 'default' : 'outline'}
            className={activeExample === 'lines' ? 'bg-cyan-600' : 'border-slate-600'}
          >
            Line-based Truncation
          </Button>
          <Button
            onClick={() => setActiveExample('height')}
            variant={activeExample === 'height' ? 'default' : 'outline'}
            className={activeExample === 'height' ? 'bg-cyan-600' : 'border-slate-600'}
          >
            Height-based Truncation
          </Button>
        </div>

        {/* Examples Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sampleDescriptions.map((example, index) => (
            <Card key={index} className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-cyan-400">{example.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {activeExample === 'character' && (
                  <ExpandableDescription 
                    content={example.content}
                    maxLength={150}
                    className="text-gray-300"
                  />
                )}
                
                {activeExample === 'lines' && (
                  <ExpandableDescriptionLines 
                    content={example.content}
                    maxLines={3}
                    className="text-gray-300"
                  />
                )}
                
                {activeExample === 'height' && (
                  <ExpandableText 
                    maxHeight="6rem"
                    className="text-gray-300"
                  >
                    <p className="whitespace-pre-wrap">{example.content}</p>
                  </ExpandableText>
                )}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="text-cyan-400 font-semibold mb-2">Character-based</h4>
                <pre className="bg-slate-900 p-3 rounded text-sm text-slate-300 overflow-x-auto">
{`<ExpandableDescription 
  content={description}
  maxLength={200}
  className="text-gray-300"
/>`}
                </pre>
              </div>
              
              <div>
                <h4 className="text-cyan-400 font-semibold mb-2">Line-based</h4>
                <pre className="bg-slate-900 p-3 rounded text-sm text-slate-300 overflow-x-auto">
{`<ExpandableDescriptionLines 
  content={description}
  maxLines={3}
  className="text-gray-300"
/>`}
                </pre>
              </div>
              
              <div>
                <h4 className="text-cyan-400 font-semibold mb-2">Height-based</h4>
                <pre className="bg-slate-900 p-3 rounded text-sm text-slate-300 overflow-x-auto">
{`<ExpandableText 
  maxHeight="6rem"
  className="text-gray-300"
>
  <p>{description}</p>
</ExpandableText>`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
