"use client";
import { useState, useEffect } from "react";
import TokenGate from "@/components/TokenGate";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Play, FileText, CheckCircle, Clock, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Module {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'exercise' | 'assignment' | 'case-study';
  duration: string;
  content: string;
  completed: boolean;
}

export default function H100Course() {
  const [currentModule, setCurrentModule] = useState<number>(0);
  const [completedModules, setCompletedModules] = useState<Record<string, boolean>>({});
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
    const timerId = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  const modules: Module[] = [
    {
      id: "h100-m1",
      title: "The Power of a Name",
      description: "How names influence memory, emotion, and perception.",
      type: 'video',
      duration: "30 min",
      completed: false,
      content: `# The Power of a Name

## How Names Influence Memory, Emotion, and Perception

Names are more than just identifiers—they're psychological triggers that can make or break a domain's value. In this module, we'll explore the fundamental psychology behind successful domain names.

### Key Concepts:

#### Memory Influence
- **Primacy Effect**: First impressions matter most
- **Recency Effect**: Recent exposure increases recall
- **Distinctiveness**: Unique names stand out in memory
- **Associations**: Names trigger mental connections

#### Emotional Resonance
- **Positive Associations**: Names that evoke good feelings
- **Cultural Relevance**: Names that resonate with communities
- **Aspirational Value**: Names that suggest growth or success
- **Identity Alignment**: Names that match user self-image

#### Perceptual Framing
- **Brand Perception**: How names influence brand image
- **Quality Signals**: Names that suggest premium value
- **Trust Indicators**: Names that build credibility
- **Innovation Cues**: Names that suggest cutting-edge status

### Examples to Study:

**Successful Names:**
- \`unrelenting.sol\` - Suggests determination and persistence
- \`drainerhunter.sol\` - Implies protection and vigilance
- \`copevendor.sol\` - Captures a specific market niche

**Failed Names:**
- Generic combinations without personality
- Names that don't evoke any emotional response
- Overly complex or hard-to-remember names

### Exercise:
Analyze 10 domain names from your favorite collections and identify what makes them psychologically compelling.`
    },
    {
      id: "h100-m2",
      title: "What Makes a Name Pop",
      description: "Length, rhythm, contrast, and emotional resonance.",
      type: 'exercise',
      duration: "45 min",
      completed: false,
      content: `# What Makes a Name Pop

## Length, Rhythm, Contrast, and Emotional Resonance

Not all names are created equal. Some stick in our minds instantly, while others fade away. Let's break down the factors that make domain names memorable.

### Core Pop Factors:

#### Length Analysis
- **1-3 characters**: Ultra-premium, often grails
- **4-6 characters**: Sweet spot for memorability
- **7-10 characters**: Brand territory
- **10+ characters**: Niche or descriptive

#### Rhythm and Flow
- **Syllable count**: 1-2 syllables ideal
- **Phonetic flow**: Easy to pronounce
- **Rhythm patterns**: Names with musical quality
- **Stress patterns**: Natural emphasis points

#### Contrast and Uniqueness
- **Standing out**: Different from similar names
- **Visual contrast**: Distinctive letter combinations
- **Cultural contrast**: Breaking from conventions
- **Market contrast**: Different from competitors

#### Emotional Resonance
- **Positive emotions**: Joy, excitement, confidence
- **Aspirational feelings**: Growth, success, achievement
- **Community connection**: Belonging, identity, pride
- **Nostalgic triggers**: Familiar, comforting associations

### Practical Framework:

**The 3-Second Test**: If someone hears your domain name once, can they remember it 3 seconds later?

**The Typing Test**: How easy is it to type without errors?

**The Story Test**: Does the name suggest a story or identity?

**The Feel Test**: What emotion does the name evoke?

### Assignment:
Create a list of 20 domain names and score each one on:
- Length (1-10)
- Rhythm (1-10)
- Contrast (1-10)
- Emotional resonance (1-10)

Submit your analysis to the community forum.`
    },
    {
      id: "h100-m3",
      title: "Category Framing",
      description: "Framing names to dominate niches like bot handles or brands.",
      type: 'case-study',
      duration: "60 min",
      completed: false,
      content: `# Category Framing

## Framing Names to Dominate Niches

Learn how to position your domain names to dominate specific categories and niches in the SNS ecosystem.

### Category Domination Strategies:

#### Bot Handle Framing
**Characteristics:**
- Short and functional (1-4 characters)
- Easy to type and remember
- Suggest automation or utility
- Often end in common suffixes

**Examples:**
- \`bot.sol\` - Generic bot handle
- \`ai.sol\` - AI/automation focus
- \`ops.sol\` - Operations focus
- \`auto.sol\` - Automation focus

**Framing Techniques:**
- Use action-oriented prefixes
- Include tech-related terms
- Keep it simple and functional
- Suggest efficiency or speed

#### Brand Framing
**Characteristics:**
- Professional and credible
- Suggest company or organization
- Memorable and distinctive
- Scalable for growth

**Examples:**
- \`retailstar.sol\` - Retail focus
- \`hoodieacademy.sol\` - Education focus
- \`cryptopunk.sol\` - NFT focus
- \`solana.sol\` - Blockchain focus

**Framing Techniques:**
- Use industry-specific terms
- Include aspirational words
- Suggest authority or expertise
- Create memorable combinations

#### Meme Domain Framing
**Characteristics:**
- Viral potential
- Cultural relevance
- Emotional impact
- Community resonance

**Examples:**
- \`cope.sol\` - Copium meme
- \`wagmi.sol\` - We're all gonna make it
- \`gm.sol\` - Good morning
- \`ser.sol\` - Sir/madam

**Framing Techniques:**
- Capture trending phrases
- Use community slang
- Create emotional hooks
- Build on existing memes

### Exercise:
Choose a category (bot handles, brands, or memes) and frame 5 domain names to dominate that niche.`
    },
    {
      id: "h100-m4",
      title: "The Fake Bio Exercise",
      description: "Write a fictional backstory for your domain.",
      type: 'assignment',
      duration: "90 min",
      completed: false,
      content: `# The Fake Bio Exercise

## Write a Fictional Backstory for Your Domain

Turn your domain name into a character with a compelling story. This exercise helps you understand the narrative potential of your domain.

### Bio Writing Framework:

#### Character Development
- **Origin Story**: How did this domain come to exist?
- **Personality**: What traits define this domain?
- **Goals**: What does this domain want to achieve?
- **Relationships**: How does it interact with other domains?

#### World Context
- **Setting**: Where does this domain exist in the ecosystem?
- **History**: What events shaped this domain?
- **Culture**: What values does this domain represent?
- **Future**: Where is this domain headed?

#### Narrative Elements
- **Conflict**: What challenges does this domain face?
- **Allies**: Who supports this domain?
- **Enemies**: Who opposes this domain?
- **Secrets**: What hidden knowledge does it hold?

### Example Bio:

**\`drainerhunter.sol\` - The Guardian**

Born in the depths of the Solana ecosystem, drainerhunter.sol emerged as a protector of the innocent. This domain represents the eternal struggle between good and evil in the crypto world, standing as a beacon of hope against the shadowy forces that seek to exploit unsuspecting users.

The hunter is relentless, tracking down threats with precision and determination. Its presence alone serves as a warning to would-be attackers, while offering comfort to those who value security and protection.

### Assignment:
Write a 3-5 sentence fictional bio for your domain name. Include:
1. Character development
2. World context
3. Narrative elements
4. Emotional connection
5. Future potential

Submit your bio to the community forum for feedback.`
    },
    {
      id: "h100-m5",
      title: "Application",
      description: "Break down Retailstar names and find unlisted gems.",
      type: 'assignment',
      duration: "120 min",
      completed: false,
      content: `# Application

## Break Down Retailstar Names and Find Unlisted Gems

Apply everything you've learned to analyze real domains and discover hidden opportunities.

### Retailstar Analysis Framework:

#### Domain Breakdown
For each domain, analyze:
- **Category**: Which archetype does it fit?
- **Psychology**: What emotions does it evoke?
- **Memorability**: How easy is it to remember?
- **Potential**: What's the upside potential?

#### Example Analysis:

**\`vaultdegen.sol\`**
- **Category**: Brand Anchor (vault) + Meme (degen)
- **Psychology**: Suggests risk-taking with protection
- **Memorability**: High - combines two strong concepts
- **Potential**: High - appeals to both safety and risk crowds

**\`kimono.sol\`**
- **Category**: Brand Anchor
- **Psychology**: Exotic, premium, cultural
- **Memorability**: High - distinctive and memorable
- **Potential**: High - strong brand potential

**\`xflow.sol\`**
- **Category**: Bot Handle
- **Psychology**: Suggests smooth automation
- **Memorability**: Medium - functional but not emotional
- **Potential**: Medium - utility-focused

### Gem Hunting Exercise:

#### Step 1: Market Analysis
- Browse current SNS listings
- Identify undervalued categories
- Look for naming patterns
- Spot emerging trends

#### Step 2: Opportunity Identification
- Find domains with strong psychology
- Identify names with narrative potential
- Look for category gaps
- Spot cultural relevance

#### Step 3: Valuation Assessment
- Compare to similar domains
- Assess market timing
- Evaluate competition
- Consider future potential

### Assignment:
1. Analyze 10 domains from Retailstar or similar marketplaces
2. Identify 3 "gems" that are undervalued
3. Explain your reasoning for each pick
4. Provide a price target and timeline
5. Submit your analysis to the community forum

**Submission Format:**
- Domain name
- Category classification
- Psychological analysis
- Valuation reasoning
- Price target and timeline`
    }
  ];

  const getModuleIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="w-4 h-4" />;
      case 'exercise':
        return <FileText className="w-4 h-4" />;
      case 'assignment':
        return <CheckCircle className="w-4 h-4" />;
      case 'case-study':
        return <BookOpen className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      video: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      exercise: 'bg-green-500/20 text-green-400 border-green-500/30',
      assignment: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'case-study': 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    };
    return colors[type as keyof typeof colors] || colors.exercise;
  };

  const progress = (Object.keys(completedModules).length / modules.length) * 100;

  return (
    <TokenGate>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Animated background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900 to-slate-900"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        <div className="relative z-10 p-8">
          {/* Back Button */}
          <div className="mb-6">
            <Button
              asChild
              variant="outline"
              className="bg-slate-800/50 hover:bg-slate-700/50 text-cyan-400 hover:text-cyan-300 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all duration-300"
            >
              <Link href="/sns">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to SNS Curriculum
              </Link>
            </Button>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent glow-text">
              H100 🧠 Domain Psychology 101
            </h1>
            <p className="text-xl text-gray-300 mb-2">Why Names Matter</p>
            <p className="text-green-300 text-lg">
              Current Time: <span className="text-green-400 font-mono">{currentTime}</span>
            </p>
          </div>

          {/* Progress Bar */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-400 font-semibold">Course Progress</span>
              <span className="text-gray-400">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-3 bg-slate-700" />
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Module List */}
            <div className="lg:col-span-1">
              <Card className="bg-slate-800/80 border-2 border-green-500/40 backdrop-blur-sm shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                <CardHeader>
                  <CardTitle className="text-green-400">Course Modules</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {modules.map((module, index) => (
                      <div
                        key={module.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                          currentModule === index
                            ? 'border-green-500/60 bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                            : 'border-slate-600/40 bg-slate-700/40 hover:border-green-500/40 hover:bg-green-500/5'
                        }`}
                        onClick={() => setCurrentModule(index)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getModuleIcon(module.type)}
                            <span className="font-semibold text-gray-200">{module.title}</span>
                          </div>
                          {completedModules[module.id] && (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{module.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge className={getTypeBadge(module.type)}>
                            {module.type.charAt(0).toUpperCase() + module.type.slice(1)}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            {module.duration}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Module Content */}
            <div className="lg:col-span-2">
              <Card className="bg-slate-800/80 border-2 border-green-500/40 backdrop-blur-sm shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-green-400">{modules[currentModule].title}</CardTitle>
                    <Badge className={getTypeBadge(modules[currentModule].type)}>
                      {modules[currentModule].type.charAt(0).toUpperCase() + modules[currentModule].type.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-gray-300 leading-relaxed">
                      {modules[currentModule].content}
                    </div>
                  </div>
                  
                  <div className="mt-8 flex gap-4">
                    <Button
                      className="bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-500 hover:to-emerald-500"
                      onClick={() => {
                        setCompletedModules(prev => ({
                          ...prev,
                          [modules[currentModule].id]: true
                        }));
                      }}
                    >
                      {completedModules[modules[currentModule].id] ? 'Completed' : 'Mark as Complete'}
                    </Button>
                    
                    {currentModule < modules.length - 1 && (
                      <Button
                        variant="outline"
                        className="border-green-500/40 text-green-400 hover:bg-green-500/10"
                        onClick={() => setCurrentModule(currentModule + 1)}
                      >
                        Next Module
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer hashtags */}
          <div className="mt-12 text-cyan-400/70 text-sm text-center">#DomainPsychology #NamingMastery #Web3Education</div>
        </div>
        
        <style jsx global>{`
          .glow-text {
            text-shadow: 0 0 10px currentColor;
          }
        `}</style>
      </div>
    </TokenGate>
  );
} 