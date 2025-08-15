"use client";
import { useState, useEffect } from "react";
import TokenGate from "@/components/TokenGate";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Play, FileText, CheckCircle, Clock, BookOpen, Star } from "lucide-react";
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

export default function H120Course() {
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
      id: "h120-m1",
      title: "The 6 Archetypes",
      description: "Grail, Meme, Bot, Brand, Alpha Drop, Lore.",
      type: 'video',
      duration: "45 min",
      completed: false,
      content: `# The 6 Archetypes

## Understanding Domain Categories

Every successful domain fits into one of these six archetypes. Understanding these categories helps you identify value and potential.

### 1. Grail Names
**Characteristics**: High prestige, low availability, often short
**Examples**: \`sol.sol\`, \`eth.sol\`, \`btc.sol\`
**Value Driver**: Scarcity and recognition
**Market Position**: Ultra-premium, often held long-term

### 2. Meme Domains
**Characteristics**: Viral potential, emotion-driven, cultural relevance
**Examples**: \`cope.sol\`, \`wagmi.sol\`, \`gm.sol\`
**Value Driver**: Social momentum and community adoption
**Market Position**: High volatility, trend-dependent

### 3. Bot Handles
**Characteristics**: Utility-based, short and clean, functional
**Examples**: \`bot.sol\`, \`ai.sol\`, \`ops.sol\`
**Value Driver**: Practical utility and automation potential
**Market Position**: Steady demand, utility-focused

### 4. Brand Anchors
**Characteristics**: Sound like a company, professional feel
**Examples**: \`retailstar.sol\`, \`hoodieacademy.sol\`
**Value Driver**: Brand building potential and credibility
**Market Position**: Long-term value, brand development

### 5. Alpha Drops
**Characteristics**: Drip with exclusivity or intel, insider knowledge
**Examples**: \`alpha.sol\`, \`insider.sol\`, \`whale.sol\`
**Value Driver**: Perceived access to valuable information
**Market Position**: Niche demand, insider appeal

### 6. Lore Domains
**Characteristics**: Designed to tell a story or worldbuild
**Examples**: \`hoodieverse.sol\`, \`cryptopunk.sol\`
**Value Driver**: Narrative potential and community building
**Market Position**: Community-driven, story-focused

### Exercise:
Classify 20 domains from your favorite marketplace into these 6 categories.`
    },
    {
      id: "h120-m2",
      title: "Trait Dissection",
      description: "How to identify categories by domain traits.",
      type: 'exercise',
      duration: "60 min",
      completed: false,
      content: `# Trait Dissection

## How to Identify Categories by Domain Traits

Learn to break down domains into their component traits to understand their value drivers and category placement.

### Trait Categories:

#### Length Analysis
- **1-3 characters**: Ultra-premium, often grails
- **4-6 characters**: Sweet spot for memorability
- **7-10 characters**: Brand territory
- **10+ characters**: Niche or descriptive

#### Word Type Classification
- **Nouns**: Concrete, memorable (e.g., \`hoodie.sol\`)
- **Verbs**: Action-oriented (e.g., \`build.sol\`)
- **Adjectives**: Descriptive (e.g., \`epic.sol\`)
- **Compound**: Multi-word (e.g., \`cryptopunk.sol\`)

#### Cultural Reference Strength
- **High**: Direct cultural touchstone
- **Medium**: Indirect reference
- **Low**: Generic or abstract

#### Rhythm Analysis
- **Syllable count**: 1-2 syllables ideal
- **Phonetic flow**: Easy to pronounce
- **Memorability**: Sticks in mind

### Category Identification Framework:

#### Grail Indicators
- Ultra-short length (1-3 characters)
- High cultural recognition
- Limited availability
- Premium positioning

#### Meme Indicators
- Cultural relevance
- Emotional resonance
- Viral potential
- Community adoption

#### Bot Handle Indicators
- Functional purpose
- Short and clean
- Automation-related
- Utility-focused

#### Brand Anchor Indicators
- Professional sound
- Scalable concept
- Industry relevance
- Credibility signals

#### Alpha Drop Indicators
- Insider terminology
- Exclusivity signals
- Information access
- Niche appeal

#### Lore Domain Indicators
- Story potential
- Worldbuilding elements
- Community focus
- Narrative depth

### Assignment:
Dissect 10 real domains from Retailstar and assign them trait scores:
- Length score (1-10)
- Cultural relevance (1-10)
- Rhythm quality (1-10)
- Category confidence (1-10)
- Overall potential (1-10)`
    },
    {
      id: "h120-m3",
      title: "Flip Mechanics",
      description: "Recognizing flip-ready opportunities.",
      type: 'case-study',
      duration: "90 min",
      completed: false,
      content: `# Flip Mechanics

## Recognizing Flip-Ready Opportunities

Understanding the timing of domain sales is crucial for maximizing profits. Learn to identify when domains are ready to flip.

### Signs a Domain is Flip-Ready:

#### Market Conditions
- **Trending narrative**: Domain aligns with current market sentiment
- **Volume spike**: Increased trading activity in similar domains
- **News catalyst**: Relevant news or announcements
- **Community buzz**: Social media attention

#### Domain-Specific Signals
- **Price appreciation**: 50%+ increase in short time
- **Competition**: Multiple similar domains listed
- **Utility discovery**: New use case emerges
- **Brand adoption**: Major brand uses similar name

### Hold vs Flip Logic:

#### Hold When:
- **Long-term narrative**: Domain fits emerging trend
- **Low competition**: Unique positioning
- **Strong fundamentals**: Good traits regardless of market
- **Personal use**: Plans for own projects

#### Flip When:
- **Peak hype**: Maximum market attention
- **Better opportunity**: Higher-potential domain available
- **Market correction**: Risk of downturn
- **Profit target**: Reached desired return

### Case Study: \`cope.sol\` and \`wagmi.sol\`

#### \`cope.sol\` Analysis:
- **Entry**: Early meme adoption
- **Growth**: Copium meme explosion
- **Peak**: Maximum cultural relevance
- **Exit**: Before meme fatigue

#### \`wagmi.sol\` Analysis:
- **Entry**: Community sentiment high
- **Growth**: Bull market optimism
- **Peak**: Maximum hope and optimism
- **Exit**: Before market correction

### Flip Timing Framework:

#### Early Stage
- **Signals**: Emerging trend, low competition
- **Action**: Acquire and hold
- **Risk**: Trend may not materialize

#### Growth Stage
- **Signals**: Increasing volume, price appreciation
- **Action**: Hold and monitor
- **Risk**: Missing peak opportunity

#### Peak Stage
- **Signals**: Maximum hype, high prices
- **Action**: Consider flipping
- **Risk**: Selling too early

#### Decline Stage
- **Signals**: Decreasing volume, price correction
- **Action**: Flip or hold long-term
- **Risk**: Selling at bottom

### Exercise:
Analyze the flip history of \`cope.sol\` and \`wagmi.sol\` to understand timing patterns.`
    },
    {
      id: "h120-m4",
      title: "Hold / Flip / Forget Matrix",
      description: "Hands-on classification exercise.",
      type: 'assignment',
      duration: "120 min",
      completed: false,
      content: `# Hold / Flip / Forget Matrix

## Hands-On Classification Exercise

Learn to categorize your domains into three strategic buckets for optimal portfolio management.

### Matrix Framework:

#### HOLD Criteria:
- **Strong fundamentals**: Good length, memorable, cultural relevance
- **Long-term potential**: Fits emerging narratives
- **Personal utility**: Plans for own use
- **Low competition**: Unique positioning
- **Strong community**: Active, engaged user base

#### FLIP Criteria:
- **Peak valuation**: Maximum market price reached
- **Better opportunity**: Higher-potential domain available
- **Market timing**: Optimal selling conditions
- **Profit target**: Desired return achieved
- **Risk management**: Protect against downside

#### FORGET Criteria:
- **Poor fundamentals**: Bad length, forgettable, no cultural hook
- **Dead narrative**: Trend has passed
- **High competition**: Many similar domains
- **No utility**: No clear use case
- **Weak community**: No engaged users

### Classification Exercise:

#### Step 1: Domain Analysis
For each domain, evaluate:
- **Fundamentals**: Length, memorability, cultural relevance
- **Market position**: Competition, demand, pricing
- **Personal fit**: Utility, plans, emotional connection
- **Timeline**: Short-term vs long-term potential

#### Step 2: Matrix Placement
- **HOLD**: Strong fundamentals + personal utility + long-term potential
- **FLIP**: Peak valuation + better opportunities available
- **FORGET**: Poor fundamentals + no utility + weak market position

#### Step 3: Action Planning
- **HOLD**: Develop utility, build community, wait for growth
- **FLIP**: Set price targets, identify buyers, execute sale
- **FORGET**: List for sale, accept low offers, move on

### Assignment:
Sort a provided list of 20 domains into H/F/F buckets and explain your logic for each classification.

**Submission Format:**
1. Domain name
2. Classification (H/F/F)
3. Primary reason
4. Secondary factors
5. Timeline recommendation
6. Action plan

**Example Submission:**
- Domain: \`cope.sol\`
- Classification: FLIP
- Primary reason: Peak meme hype reached
- Secondary factors: High competition, declining trend
- Timeline: 1-3 months
- Action plan: List at 2x current price, accept 1.5x offers`
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
              H120 🗾️ Domain Archetypes & Use Cases
            </h1>
            <p className="text-xl text-gray-300 mb-2">Learn to recognize the core use cases behind successful domains</p>
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
          <div className="mt-12 text-cyan-400/70 text-sm text-center">#DomainArchetypes #UseCases #Web3Education</div>
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