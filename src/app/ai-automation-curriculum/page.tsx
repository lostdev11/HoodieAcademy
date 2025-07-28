'use client'

import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { ArrowLeft, CheckCircle, XCircle, Lock, Unlock, Bot, AlertTriangle, Wallet, Cpu, Zap } from 'lucide-react';
import { updateScoreForQuizCompletion } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

interface QuizOption {
  id: string;
  text: string;
}

interface QuizQuestion {
  id: string;
  text: string;
  options: QuizOption[];
  correctAnswerId: string;
  explanation?: string;
}

interface Lesson {
  id: string;
  title: string;
  content: React.ReactNode;
  quiz: QuizQuestion[];
  level: 'hoodie' | 'dao';
  requiresHoodie?: boolean;
  requiresDao?: boolean;
}

const lessonsData: Lesson[] = [
  {
    id: 'a100',
    title: 'A100: What is an LLM? Understanding AI in Plain English',
    level: 'hoodie',
    requiresHoodie: true,
    content: (
      <>
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-blue-500">🤖 Hoodie-Gated Course - Requires WifHoodie</h3>
          <p className="mb-4">Strip away the hype and understand what LLMs really are and how they work.</p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📚 Modules:</h4>
            <ul className="space-y-2">
              <li>• <strong>What is a Token?:</strong> How LLMs read, predict, and complete</li>
              <li>• <strong>Models Overview:</strong> ChatGPT, Claude, Gemini, Mistral, local models</li>
              <li>• <strong>Comparison Activity:</strong> Run 1 prompt across 3 models and compare outputs</li>
              <li>• <strong>Visual Demo:</strong> Prompt → Token Stream → Output Breakdown</li>
            </ul>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🎥 Video Placeholder:</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">"LLMs for Degens: Plain English + Real Tests"</p>
          </div>
        </div>
      </>
    ),
    quiz: [
      { 
        id: 'q1a100', 
        text: 'What is a token in the context of LLMs?', 
        options: [
          {id: 'o1', text: 'A cryptocurrency token'},
          {id: 'o2', text: 'A unit of text that the model processes'},
          {id: 'o3', text: 'A security token'},
          {id: 'o4', text: 'A blockchain token'}
        ], 
        correctAnswerId: 'o2', 
        explanation: "A token is a unit of text (word, part of word, or punctuation) that the LLM processes to understand and generate language."
      },
      { 
        id: 'q2a100', 
        text: 'What does LLM stand for?', 
        options: [
          {id: 'o1', text: 'Large Language Model'},
          {id: 'o2', text: 'Long Learning Machine'},
          {id: 'o3', text: 'Linguistic Logic Module'},
          {id: 'o4', text: 'Language Learning Method'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "LLM stands for Large Language Model, which are AI systems trained on vast amounts of text data."
      },
      { 
        id: 'q3a100', 
        text: 'What is the primary function of an LLM?', 
        options: [
          {id: 'o1', text: 'To mine cryptocurrency'},
          {id: 'o2', text: 'To predict and generate text based on patterns'},
          {id: 'o3', text: 'To create blockchain transactions'},
          {id: 'o4', text: 'To store data securely'}
        ], 
        correctAnswerId: 'o2', 
        explanation: "LLMs predict and generate text based on patterns they learned from training data."
      },
    ],
  },
  {
    id: 'a120',
    title: 'A120: Key Vocab: RAG, One-Shot, Prompt Types',
    level: 'hoodie',
    requiresHoodie: true,
    content: (
      <>
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-blue-500">📚 Hoodie-Gated Course - Requires WifHoodie</h3>
          <p className="mb-4">Decode the hidden language of AI prompts and architecture.</p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📚 Modules:</h4>
            <ul className="space-y-2">
              <li>• <strong>RAG = Retrieval-Augmented Generation:</strong> External data + AI</li>
              <li>• <strong>Shot Types:</strong> One-shot, few-shot, zero-shot</li>
              <li>• <strong>Prompt Settings:</strong> Temp, top_p, max_tokens</li>
              <li>• <strong>Quiz:</strong> Match term to use case (visual, Discord-ready)</li>
            </ul>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🎥 Video Placeholder:</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">"Prompt Lingo 101: Don't Sound Like a Normie"</p>
          </div>
        </div>
      </>
    ),
    quiz: [
      { 
        id: 'q1a120', 
        text: 'What does RAG stand for in AI?', 
        options: [
          {id: 'o1', text: 'Retrieval-Augmented Generation'},
          {id: 'o2', text: 'Random Access Generation'},
          {id: 'o3', text: 'Rapid AI Growth'},
          {id: 'o4', text: 'Real-time Analysis Group'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "RAG (Retrieval-Augmented Generation) combines external data retrieval with AI generation for more accurate responses."
      },
      { 
        id: 'q2a120', 
        text: 'What is a "one-shot" prompt?', 
        options: [
          {id: 'o1', text: 'A prompt that only works once'},
          {id: 'o2', text: 'A prompt that includes one example'},
          {id: 'o3', text: 'A prompt that takes one second to process'},
          {id: 'o4', text: 'A prompt that costs one token'}
        ], 
        correctAnswerId: 'o2', 
        explanation: "A one-shot prompt includes one example to help the model understand the desired output format."
      },
      { 
        id: 'q3a120', 
        text: 'What does "temperature" control in AI models?', 
        options: [
          {id: 'o1', text: 'The speed of response'},
          {id: 'o2', text: 'The randomness/creativity of outputs'},
          {id: 'o3', text: 'The cost of the API call'},
          {id: 'o4', text: 'The size of the model'}
        ], 
        correctAnswerId: 'o2', 
        explanation: "Temperature controls the randomness/creativity of AI outputs - higher values make responses more creative and unpredictable."
      },
    ],
  },
  {
    id: 'a150',
    title: 'A150: Intro to Prompt Engineering',
    level: 'hoodie',
    requiresHoodie: true,
    content: (
      <>
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-blue-500">🧠 Hoodie-Gated Course - Requires WifHoodie</h3>
          <p className="mb-4">Learn the building blocks of reusable, modular prompts.</p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📚 Modules:</h4>
            <ul className="space-y-2">
              <li>• <strong>Frameworks:</strong> Chain of Thought, Roleplay, Format Lock</li>
              <li>• <strong>Reusability:</strong> Prompt templates for squad use</li>
              <li>• <strong>Assignment:</strong> Build a squad-specific prompt (Creator, Decoder, etc.)</li>
              <li>• <strong>Bonus:</strong> GPT as a tool, not a brain</li>
            </ul>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🎥 Video Placeholder:</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">"Prompt Engineering: Build, Don't Beg"</p>
          </div>
        </div>
      </>
    ),
    quiz: [
      { 
        id: 'q1a150', 
        text: 'What is "Chain of Thought" prompting?', 
        options: [
          {id: 'o1', text: 'A method that makes the AI show its reasoning process'},
          {id: 'o2', text: 'A way to chain multiple AI models together'},
          {id: 'o3', text: 'A technique for faster responses'},
          {id: 'o4', text: 'A method to reduce API costs'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "Chain of Thought prompting asks the AI to show its step-by-step reasoning process, leading to better results."
      },
      { 
        id: 'q2a150', 
        text: 'What is "roleplay" prompting?', 
        options: [
          {id: 'o1', text: 'Making the AI pretend to be a character'},
          {id: 'o2', text: 'Playing games with the AI'},
          {id: 'o3', text: 'Making the AI act like a human'},
          {id: 'o4', text: 'All of the above'}
        ], 
        correctAnswerId: 'o4', 
        explanation: "Roleplay prompting involves asking the AI to adopt a specific character or persona to improve responses."
      },
      { 
        id: 'q3a150', 
        text: 'What is the main benefit of reusable prompt templates?', 
        options: [
          {id: 'o1', text: 'They save money on API calls'},
          {id: 'o2', text: 'They ensure consistent, high-quality outputs'},
          {id: 'o3', text: 'They make responses faster'},
          {id: 'o4', text: 'They reduce the model size'}
        ], 
        correctAnswerId: 'o2', 
        explanation: "Reusable prompt templates ensure consistent, high-quality outputs across different use cases."
      },
    ],
  },
  {
    id: 'a180',
    title: 'A180: AI Safety & Ethics in Web3',
    level: 'hoodie',
    requiresHoodie: true,
    content: (
      <>
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-blue-500">🛡️ Hoodie-Gated Course - Requires WifHoodie</h3>
          <p className="mb-4">Understand the real risks behind intelligent agents and data misuse.</p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📚 Modules:</h4>
            <ul className="space-y-2">
              <li>• <strong>Prompt Injection:</strong> Examples of agent hijacking</li>
              <li>• <strong>Private Data Risks:</strong> Wallets, IP leaks, and security gaps</li>
              <li>• <strong>Alignment Goals:</strong> OpenAI vs Anthropic</li>
              <li>• <strong>Discussion Prompt:</strong> Should agents trade on your behalf?</li>
            </ul>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🎥 Video Placeholder:</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">"Agents Can Lie: Safety in the Age of LLMs"</p>
          </div>
        </div>
      </>
    ),
    quiz: [
      { 
        id: 'q1a180', 
        text: 'What is prompt injection?', 
        options: [
          {id: 'o1', text: 'Injecting code into prompts'},
          {id: 'o2', text: 'Manipulating AI responses through carefully crafted inputs'},
          {id: 'o3', text: 'Adding drugs to AI systems'},
          {id: 'o4', text: 'Hacking into AI databases'}
        ], 
        correctAnswerId: 'o2', 
        explanation: "Prompt injection is manipulating AI responses through carefully crafted inputs that override the intended behavior."
      },
      { 
        id: 'q2a180', 
        text: 'What is a major privacy risk when using AI with crypto?', 
        options: [
          {id: 'o1', text: 'Sharing wallet addresses in prompts'},
          {id: 'o2', text: 'Using AI to analyze transactions'},
          {id: 'o3', text: 'Both of the above'},
          {id: 'o4', text: 'Neither of the above'}
        ], 
        correctAnswerId: 'o3', 
        explanation: "Both sharing wallet addresses and using AI to analyze transactions can expose private financial information."
      },
      { 
        id: 'q3a180', 
        text: 'Why should you be careful about AI agents trading on your behalf?', 
        options: [
          {id: 'o1', text: 'They might lose money'},
          {id: 'o2', text: 'They could be manipulated or hacked'},
          {id: 'o3', text: 'They might not understand market conditions'},
          {id: 'o4', text: 'All of the above'}
        ], 
        correctAnswerId: 'o4', 
        explanation: "AI trading agents face multiple risks including financial losses, manipulation, and lack of market understanding."
      },
    ],
  },
  {
    id: 'a200',
    title: 'A200: Intermediate Prompting & LLM Customization',
    level: 'hoodie',
    requiresHoodie: true,
    content: (
      <>
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-blue-500">🛠️ Hoodie-Gated Course - Requires WifHoodie</h3>
          <p className="mb-4">Go deeper — learn how to shape personalities and parse structured content.</p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📚 Modules:</h4>
            <ul className="space-y-2">
              <li>• <strong>System Messages vs User Prompts:</strong> Instruction layering</li>
              <li>• <strong>API Playground:</strong> Custom instructions, parameter tuning</li>
              <li>• <strong>Personality Design:</strong> Create your own Hoodie Agent character</li>
              <li>• <strong>Assignment:</strong> Design an agent spec + role instructions</li>
            </ul>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🎥 Video Placeholder:</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">"How to Design a Hoodie Agent"</p>
          </div>
        </div>
      </>
    ),
    quiz: [
      { 
        id: 'q1a200', 
        text: 'What is the difference between system messages and user prompts?', 
        options: [
          {id: 'o1', text: 'System messages set the AI\'s behavior, user prompts are specific requests'},
          {id: 'o2', text: 'System messages are free, user prompts cost money'},
          {id: 'o3', text: 'System messages are faster, user prompts are slower'},
          {id: 'o4', text: 'There is no difference'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "System messages define the AI's role and behavior, while user prompts are specific requests or questions."
      },
      { 
        id: 'q2a200', 
        text: 'What is parameter tuning in AI?', 
        options: [
          {id: 'o1', text: 'Adjusting settings like temperature and top_p'},
          {id: 'o2', text: 'Changing the model size'},
          {id: 'o3', text: 'Modifying the API endpoint'},
          {id: 'o4', text: 'Updating the AI\'s training data'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "Parameter tuning involves adjusting settings like temperature and top_p to control AI behavior and output quality."
      },
      { 
        id: 'q3a200', 
        text: 'What is personality design in AI?', 
        options: [
          {id: 'o1', text: 'Creating consistent character traits for AI responses'},
          {id: 'o2', text: 'Making the AI look more human'},
          {id: 'o3', text: 'Adding emotions to AI responses'},
          {id: 'o4', text: 'Making the AI speak in different languages'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "Personality design involves creating consistent character traits that shape how the AI responds to prompts."
      },
    ],
  },
  {
    id: 'au100',
    title: 'AU100: What Is Automation? Understanding the Stack',
    level: 'hoodie',
    requiresHoodie: true,
    content: (
      <>
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-blue-500">🔗 Hoodie-Gated Course - Requires WifHoodie</h3>
          <p className="mb-4">Build your mental model of automation tools in Web3.</p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📚 Modules:</h4>
            <ul className="space-y-2">
              <li>• <strong>Logic Blocks:</strong> "If this, then that" explained</li>
              <li>• <strong>Stack Breakdown:</strong> Make.com, Zapier, Airtable, Notion, Dify</li>
              <li>• <strong>Example Use Cases:</strong> Tweet scheduling, content flows, AI response handling</li>
              <li>• <strong>Assignment:</strong> Diagram an automation you'd like to build</li>
            </ul>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🎥 Video Placeholder:</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">"What the Hell Does Make.com Actually Do?"</p>
          </div>
        </div>
      </>
    ),
    quiz: [
      { 
        id: 'q1au100', 
        text: 'What is the basic principle of automation?', 
        options: [
          {id: 'o1', text: 'If this happens, then do that'},
          {id: 'o2', text: 'Always use AI'},
          {id: 'o3', text: 'Make everything faster'},
          {id: 'o4', text: 'Reduce human work'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "Automation follows the principle of 'if this happens, then do that' - creating triggers and actions."
      },
      { 
        id: 'q2au100', 
        text: 'What is Make.com used for?', 
        options: [
          {id: 'o1', text: 'Creating visual automation workflows'},
          {id: 'o2', text: 'Making websites'},
          {id: 'o3', text: 'Creating AI models'},
          {id: 'o4', text: 'Building databases'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "Make.com is used for creating visual automation workflows that connect different apps and services."
      },
      { 
        id: 'q3au100', 
        text: 'What is a common automation use case in Web3?', 
        options: [
          {id: 'o1', text: 'Scheduling social media posts'},
          {id: 'o2', text: 'Automating trading'},
          {id: 'o3', text: 'Both of the above'},
          {id: 'o4', text: 'Neither of the above'}
        ], 
        correctAnswerId: 'o3', 
        explanation: "Both scheduling social media posts and automating trading are common automation use cases in Web3."
      },
    ],
  },
  {
    id: 'au150',
    title: 'AU150: Beginner\'s Guide to Airtable + Notion as Databases',
    level: 'hoodie',
    requiresHoodie: true,
    content: (
      <>
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-blue-500">📊 Hoodie-Gated Course - Requires WifHoodie</h3>
          <p className="mb-4">Databases make your automations work. Learn to structure them.</p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📚 Modules:</h4>
            <ul className="space-y-2">
              <li>• <strong>Relational Thinking:</strong> Tags, filters, status views</li>
              <li>• <strong>Content Boards:</strong> Build a dynamic Notion + Airtable base</li>
              <li>• <strong>Assignment:</strong> Create a "Hoodie Content Tracker" linked board</li>
              <li>• <strong>Bonus:</strong> Label rows by squad (Creator, Decoder, etc.)</li>
            </ul>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🎥 Video Placeholder:</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">"From Chaos to Control: Airtable 101"</p>
          </div>
        </div>
      </>
    ),
    quiz: [
      { 
        id: 'q1au150', 
        text: 'What is relational thinking in databases?', 
        options: [
          {id: 'o1', text: 'Connecting different data tables through relationships'},
          {id: 'o2', text: 'Thinking about family relationships'},
          {id: 'o3', text: 'Making databases faster'},
          {id: 'o4', text: 'Creating visual charts'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "Relational thinking involves connecting different data tables through relationships to organize information efficiently."
      },
      { 
        id: 'q2au150', 
        text: 'What is a content board?', 
        options: [
          {id: 'o1', text: 'A visual way to organize and track content'},
          {id: 'o2', text: 'A physical board for posting content'},
          {id: 'o3', text: 'A social media platform'},
          {id: 'o4', text: 'A type of database'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "A content board is a visual way to organize and track content, often using tools like Notion or Airtable."
      },
      { 
        id: 'q3au150', 
        text: 'Why use tags in databases?', 
        options: [
          {id: 'o1', text: 'To categorize and filter information'},
          {id: 'o2', text: 'To make databases look pretty'},
          {id: 'o3', text: 'To reduce storage space'},
          {id: 'o4', text: 'To speed up searches'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "Tags help categorize and filter information, making it easier to find and organize data in databases."
      },
    ],
  },
  {
    id: 'au199',
    title: 'AU199: Agent Demos (Read-Only)',
    level: 'dao',
    requiresDao: true,
    content: (
      <>
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-purple-500">🧪 DAO-Gated Course - Advanced Level</h3>
          <p className="mb-4">See Hoodie Agents in action — observe, but don't touch.</p>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">📚 Modules:</h4>
            <ul className="space-y-2">
              <li>• <strong>Agent Flow Breakdown:</strong> Input → Parse → Trigger → Output</li>
              <li>• <strong>Demo Agents:</strong> Discord Notifier, Form Parser, Blog Generator</li>
              <li>• <strong>Reflection:</strong> What would you build if you had access?</li>
              <li>• <strong>DAO Invite Prompt:</strong> Request access for build-level training</li>
            </ul>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">🎥 Video Placeholder:</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">"Agents in the Wild: What's Actually Possible"</p>
          </div>
        </div>
      </>
    ),
    quiz: [
      { 
        id: 'q1au199', 
        text: 'What is an AI agent?', 
        options: [
          {id: 'o1', text: 'An AI system that can perform tasks autonomously'},
          {id: 'o2', text: 'A human working for an AI company'},
          {id: 'o3', text: 'A type of cryptocurrency'},
          {id: 'o4', text: 'A software bug'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "An AI agent is an AI system that can perform tasks autonomously, often using tools and making decisions."
      },
      { 
        id: 'q2au199', 
        text: 'What is the typical flow of an AI agent?', 
        options: [
          {id: 'o1', text: 'Input → Parse → Trigger → Output'},
          {id: 'o2', text: 'Start → Stop'},
          {id: 'o3', text: 'Think → Act'},
          {id: 'o4', text: 'Learn → Remember'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "The typical flow is Input → Parse → Trigger → Output, where the agent processes input and produces results."
      },
      { 
        id: 'q3au199', 
        text: 'What is a Discord Notifier agent?', 
        options: [
          {id: 'o1', text: 'An agent that sends automated messages to Discord'},
          {id: 'o2', text: 'A Discord bot'},
          {id: 'o3', text: 'A human moderator'},
          {id: 'o4', text: 'A type of notification'}
        ], 
        correctAnswerId: 'o1', 
        explanation: "A Discord Notifier agent automatically sends messages to Discord channels based on triggers or events."
      },
    ],
  },
];

export default function AiAutomationCurriculumPage() {
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [lessonStatus, setLessonStatus] = useState<Array<'locked' | 'unlocked' | 'completed'>>(
    new Array(lessonsData.length).fill('locked')
  );
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [quizResults, setQuizResults] = useState<Record<string, boolean>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [hasHoodie, setHasHoodie] = useState(false);
  const [hasDao, setHasDao] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [progress, setProgress] = useState(0);

  const localStorageKey = 'aiAutomationCurriculumProgress';

  const saveProgress = (newStatus: Array<'locked' | 'unlocked' | 'completed'>) => {
    localStorage.setItem(localStorageKey, JSON.stringify(newStatus));
    setLessonStatus(newStatus);
  };

  const handleWalletConnection = async () => {
    try {
      if (typeof window !== 'undefined' && window.solana) {
        const provider = window.solana;
        
        if (!provider.isConnected) {
          await provider.connect();
        }
        
        setWalletConnected(true);
        setWalletAddress(provider.publicKey.toString());
        
        // Check for WifHoodie and DAO tokens
        const connection = new Connection('https://api.mainnet-beta.solana.com');
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          new PublicKey(provider.publicKey.toString()),
          { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
        );
        
        // Check for tokens (replace with actual token mint addresses)
        const hoodieTokenMint = 'YOUR_WIFHOODIE_TOKEN_MINT_ADDRESS';
        const daoTokenMint = 'YOUR_DAO_TOKEN_MINT_ADDRESS';
        
        const hasHoodieToken = tokenAccounts.value.some(account => 
          account.account.data.parsed.info.mint === hoodieTokenMint
        );
        const hasDaoToken = tokenAccounts.value.some(account => 
          account.account.data.parsed.info.mint === daoTokenMint
        );
        
        setHasHoodie(hasHoodieToken);
        setHasDao(hasDaoToken);
        
        // Unlock first lesson for hoodie holders
        const newStatus = [...lessonStatus];
        if (hasHoodieToken) {
          newStatus[0] = 'unlocked';
        }
        saveProgress(newStatus);
        
      } else {
        console.error('Solana wallet not found');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const handleOptionChange = (questionId: string, optionId: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleQuizSubmit = () => {
    const currentLesson = lessonsData[currentLessonIndex];
    const results: Record<string, boolean> = {};
    let correctCount = 0;
    
    currentLesson.quiz.forEach(question => {
      const userAnswer = selectedAnswers[question.id];
      const isCorrect = userAnswer === question.correctAnswerId;
      results[question.id] = isCorrect;
      if (isCorrect) correctCount++;
    });
    
    setQuizResults(results);
    setShowQuizResults(true);
    
    const passRate = (correctCount / currentLesson.quiz.length) * 100;
    
    if (passRate >= 75) {
      const newStatus = [...lessonStatus];
      newStatus[currentLessonIndex] = 'completed';
      
      if (currentLessonIndex < lessonsData.length - 1) {
        newStatus[currentLessonIndex + 1] = 'unlocked';
      }
      
      saveProgress(newStatus);
      updateScoreForQuizCompletion(walletAddress, 'ai-automation-curriculum', passRate, currentLesson.quiz.length, currentLessonIndex + 1, lessonsData.length);
    }
  };

  const handleNextLesson = () => {
    if (currentLessonIndex < lessonsData.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
      setSelectedAnswers({});
      setQuizResults({});
      setShowQuizResults(false);
    }
  };

  const handlePreviousLesson = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
      setSelectedAnswers({});
      setQuizResults({});
      setShowQuizResults(false);
    }
  };

  const resetAllProgress = () => {
    const newStatus = new Array(lessonsData.length).fill('locked');
    if (hasHoodie) {
      newStatus[0] = 'unlocked';
    }
    saveProgress(newStatus);
    setCurrentLessonIndex(0);
    setSelectedAnswers({});
    setQuizResults({});
    setShowQuizResults(false);
  };

  useEffect(() => {
    const savedProgress = localStorage.getItem(localStorageKey);
    if (savedProgress) {
      const parsedProgress = JSON.parse(savedProgress);
      setLessonStatus(parsedProgress);
    } else {
      const initialStatus = new Array(lessonsData.length).fill('locked');
      if (hasHoodie) {
        initialStatus[0] = 'unlocked';
      }
      saveProgress(initialStatus);
    }
  }, [hasHoodie]);

  useEffect(() => {
    const completedCount = lessonStatus.filter(status => status === 'completed').length;
    const totalLessons = lessonsData.length;
    setProgress((completedCount / totalLessons) * 100);
  }, [lessonStatus]);

  const currentLesson = lessonsData[currentLessonIndex];
  const canAccessLesson = currentLesson.level === 'hoodie' && hasHoodie || 
                         currentLesson.level === 'dao' && hasDao;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/courses">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Courses
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Bot className="w-8 h-8 text-blue-400" />
              <h1 className="text-3xl font-bold">AI + Automation Curriculum</h1>
            </div>
          </div>
          
          {isAdmin && (
            <Button onClick={resetAllProgress} variant="outline" className="text-white border-white hover:bg-white/10">
              Reset Progress
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Course Progress</span>
            <span className="text-sm text-gray-300">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Wallet Connection */}
        {!walletConnected && (
          <Card className="mb-8 bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6">
              <div className="text-center">
                <Wallet className="w-12 h-12 mx-auto mb-4 text-blue-400" />
                <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
                <p className="text-gray-300 mb-4">Connect your Solana wallet to access this sacred knowledge.</p>
                <Button onClick={handleWalletConnection} className="bg-blue-600 hover:bg-blue-700">
                  Connect Phantom Wallet
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Course Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Lesson Navigation */}
          <div className="lg:col-span-1">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Course Modules</h3>
                <div className="space-y-2">
                  {lessonsData.map((lesson, index) => {
                    const isLocked = lessonStatus[index] === 'locked';
                    const isCompleted = lessonStatus[index] === 'completed';
                    const isCurrent = index === currentLessonIndex;
                    const canAccess = (lesson.level === 'hoodie' && hasHoodie) ||
                                    (lesson.level === 'dao' && hasDao);

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => {
                          if (!isLocked) {
                            setCurrentLessonIndex(index);
                            setSelectedAnswers({});
                            setQuizResults({});
                            setShowQuizResults(false);
                          }
                        }}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          isCurrent 
                            ? 'bg-blue-600 text-white' 
                            : isCompleted 
                              ? 'bg-blue-600/20 text-blue-300' 
                              : isLocked 
                                ? 'bg-gray-600/20 text-gray-400 cursor-not-allowed' 
                                : 'bg-white/5 hover:bg-white/10 text-white'
                        }`}
                        disabled={isLocked}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {isCompleted ? (
                              <CheckCircle className="w-4 h-4 text-blue-400" />
                            ) : isLocked ? (
                              <Lock className="w-4 h-4" />
                            ) : (
                              <Unlock className="w-4 h-4" />
                            )}
                            <span className="text-sm font-medium">{lesson.title}</span>
                          </div>
                          <div className={`text-xs px-2 py-1 rounded ${
                            lesson.level === 'hoodie' ? 'bg-blue-600/20 text-blue-300' :
                            'bg-purple-600/20 text-purple-300'
                          }`}>
                            {lesson.level.toUpperCase()}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-6">
                {!canAccessLesson ? (
                  <div className="text-center py-12">
                    <Lock className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
                    <h3 className="text-xl font-semibold mb-2">Course Locked</h3>
                    <p className="text-gray-300 mb-4">
                      {currentLesson.level === 'hoodie' 
                        ? 'This course requires a WifHoodie NFT to access.'
                        : 'This course requires DAO membership to access.'
                      }
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Lesson Content */}
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold mb-4">{currentLesson.title}</h2>
                      <div className="prose prose-invert max-w-none">
                        {currentLesson.content}
                      </div>
                    </div>

                    {/* Quiz */}
                    {!showQuizResults && (
                      <div className="space-y-6">
                        <h3 className="text-xl font-semibold">Quiz</h3>
                        {currentLesson.quiz.map((question) => (
                          <div key={question.id} className="space-y-3">
                            <p className="font-medium">{question.text}</p>
                            <RadioGroup
                              value={selectedAnswers[question.id] || ''}
                              onValueChange={(value) => handleOptionChange(question.id, value)}
                            >
                              {question.options.map((option) => (
                                <div key={option.id} className="flex items-center space-x-2">
                                  <RadioGroupItem value={option.id} id={option.id} />
                                  <Label htmlFor={option.id} className="cursor-pointer">
                                    {option.text}
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>
                        ))}
                        <Button 
                          onClick={handleQuizSubmit}
                          disabled={Object.keys(selectedAnswers).length < currentLesson.quiz.length}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Submit Quiz
                        </Button>
                      </div>
                    )}

                    {/* Quiz Results */}
                    {showQuizResults && (
                      <div className="space-y-6">
                        <h3 className="text-xl font-semibold">Quiz Results</h3>
                        {currentLesson.quiz.map((question) => {
                          const userAnswer = selectedAnswers[question.id];
                          const isCorrect = userAnswer === question.correctAnswerId;
                          
                          return (
                            <div key={question.id} className="space-y-3">
                              <div className="flex items-center space-x-2">
                                {isCorrect ? (
                                  <CheckCircle className="w-5 h-5 text-green-400" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-red-400" />
                                )}
                                <p className="font-medium">{question.text}</p>
                              </div>
                              {question.explanation && (
                                <p className="text-sm text-gray-300 ml-7">
                                  {question.explanation}
                                </p>
                              )}
                            </div>
                          );
                        })}
                        
                        <div className="flex space-x-4">
                          {currentLessonIndex > 0 && (
                            <Button onClick={handlePreviousLesson} variant="outline">
                              Previous Lesson
                            </Button>
                          )}
                          {currentLessonIndex < lessonsData.length - 1 && (
                            <Button onClick={handleNextLesson} className="bg-blue-600 hover:bg-blue-700">
                              Next Lesson
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 