"use client";
import { useState, useEffect } from "react";
import TokenGate from "@/components/TokenGate";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Play, FileText, CheckCircle, Clock, BookOpen, Lock } from "lucide-react";
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

export default function H200Course() {
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
      id: "h200-m1",
      title: "The Real Estate Mindset",
      description: "Domains as land: location, uniqueness, scalability.",
      type: 'video',
      duration: "45 min",
      completed: false,
      content: `# The Real Estate Mindset

## Domains as Land: Location, Uniqueness, Scalability

Domains aren't just words—they're digital real estate assets with intrinsic value based on location, uniqueness, and scalability potential.

### Real Estate Principles Applied to Domains:

#### Location (Digital Positioning)
- **Market Position**: Where does your domain sit in the ecosystem?
- **Traffic Potential**: Can it attract organic visitors?
- **Network Effects**: Does it benefit from ecosystem growth?
- **Adjacency**: What's around your domain in the digital landscape?

#### Uniqueness (Scarcity Value)
- **One-of-a-Kind**: Truly unique names command premium prices
- **Cultural Significance**: Names with cultural relevance
- **Historical Value**: Names with proven track records
- **Brand Potential**: Names that can become household terms

#### Scalability (Growth Potential)
- **Expansion Room**: Can the domain grow with your needs?
- **Subdomain Potential**: How many subdomains can it support?
- **Cross-Chain Potential**: Can it expand to other ecosystems?
- **Revenue Potential**: Can it generate income streams?

### Valuation Framework:

#### Location Factors (30% of value):
- **Market relevance**: How relevant to current trends?
- **Competition**: How many similar domains exist?
- **Traffic potential**: Can it attract visitors?
- **Network effects**: Does ecosystem growth benefit it?

#### Uniqueness Factors (40% of value):
- **Length**: Shorter = more unique
- **Memorability**: How easy to remember?
- **Cultural relevance**: Does it resonate with communities?
- **Brand potential**: Can it become a brand?

#### Scalability Factors (30% of value):
- **Subdomain potential**: How many subdomains can it support?
- **Cross-chain potential**: Can it expand to other chains?
- **Revenue potential**: Can it generate income?
- **Growth potential**: Can it scale with demand?

### Tools for Analysis:

#### Market Analysis Tools:
- **SNS Marketplaces**: Track sales and trends
- **Social Media**: Monitor community sentiment
- **News Sources**: Stay updated on ecosystem developments
- **Analytics**: Track domain performance

#### Valuation Tools:
- **Comparable Sales**: Look at similar domain sales
- **Market Trends**: Understand current market conditions
- **Future Projections**: Estimate future value
- **Risk Assessment**: Evaluate potential downsides

### Exercise:
Analyze 5 domains using the real estate framework and assign location, uniqueness, and scalability scores.`
    },
    {
      id: "h200-m2",
      title: "Utility Walkthrough",
      description: "Delegation, redirect, subleasing, and SNS tools.",
      type: 'video',
      duration: "60 min",
      completed: false,
      content: `# Utility Walkthrough

## Delegation, Redirect, Subleasing, and SNS Tools

Learn how to maximize the utility of your domains through delegation, redirects, subleasing, and other SNS tools.

### Core Utility Functions:

#### Delegation
**What it is**: Transfer control of your domain to another wallet
**Use cases**:
- Team management
- Service providers
- Temporary access
- Security measures

**How to delegate**:
1. Access SNS manager
2. Select your domain
3. Choose delegation option
4. Enter recipient wallet
5. Set permissions and duration

#### Redirect
**What it is**: Point your domain to another URL or service
**Use cases**:
- Website hosting
- Social media links
- Service integration
- Brand consolidation

**How to redirect**:
1. Configure DNS settings
2. Set up CNAME records
3. Point to target URL
4. Test functionality
5. Monitor performance

#### Subleasing
**What it is**: Rent out subdomains to others
**Use cases**:
- Revenue generation
- Community building
- Service offerings
- Brand partnerships

**How to sublease**:
1. Create subdomain structure
2. Set pricing model
3. Market availability
4. Manage access
5. Monitor usage

### SNS Tools and Platforms:

#### Solana Name Registry
- **Registration**: Register new domains
- **Management**: Update domain settings
- **Transfer**: Move domains between wallets
- **Renewal**: Extend domain ownership

#### SNS Manager
- **Dashboard**: Overview of all domains
- **Settings**: Configure domain options
- **Analytics**: Track domain performance
- **Security**: Manage access controls

#### Third-Party Tools
- **Marketplaces**: Buy and sell domains
- **Analytics**: Track domain value
- **Services**: Professional domain management
- **Communities**: Connect with other domain owners

### Advanced Utility Strategies:

#### Multi-Use Domains
- **Primary Use**: Main functionality
- **Secondary Uses**: Additional features
- **Fallback Uses**: Backup options
- **Expansion Uses**: Future possibilities

#### Revenue Generation
- **Subdomain Sales**: Sell subdomain access
- **Service Provision**: Offer domain services
- **Content Monetization**: Generate content revenue
- **Partnership Revenue**: Collaborate with others

#### Community Building
- **Access Control**: Manage community access
- **Content Distribution**: Share community content
- **Event Hosting**: Host community events
- **Governance**: Community decision-making

### Exercise:
Set up delegation, redirect, and subleasing for a hypothetical domain.`
    },
    {
      id: "h200-m3",
      title: "Retailstar Case Study",
      description: "How vaultdegen.sol, kimono.sol, and xflow.sol work.",
      type: 'case-study',
      duration: "90 min",
      completed: false,
      content: `# Retailstar Case Study

## How vaultdegen.sol, kimono.sol, and xflow.sol Work

Analyze how successful domains create value through strategic positioning and utility development.

### Case Study 1: vaultdegen.sol

#### Domain Analysis:
- **Category**: Brand Anchor + Meme Domain
- **Length**: 10 characters (medium)
- **Memorability**: High (combines two strong concepts)
- **Cultural Relevance**: High (vault + degen culture)

#### Strategic Positioning:
- **Vault Concept**: Suggests security and protection
- **Degen Culture**: Appeals to risk-taking community
- **Combination**: Creates unique positioning
- **Target Audience**: Risk-takers who want protection

#### Utility Development:
- **Primary Use**: Community hub for degen traders
- **Secondary Use**: Educational content about risk management
- **Revenue Streams**: Premium content, trading signals
- **Community Building**: Degen trader community

#### Value Drivers:
- **Cultural Relevance**: Fits current market sentiment
- **Community Appeal**: Strong target audience
- **Utility Potential**: Multiple use cases
- **Brand Potential**: Can become a recognized brand

### Case Study 2: kimono.sol

#### Domain Analysis:
- **Category**: Brand Anchor
- **Length**: 6 characters (good)
- **Memorability**: High (distinctive and cultural)
- **Cultural Relevance**: High (Japanese culture)

#### Strategic Positioning:
- **Cultural Appeal**: Japanese aesthetic and culture
- **Premium Feel**: Suggests quality and craftsmanship
- **Brand Potential**: Can become lifestyle brand
- **Target Audience**: Culture enthusiasts, premium consumers

#### Utility Development:
- **Primary Use**: Lifestyle and culture brand
- **Secondary Use**: Content about Japanese culture
- **Revenue Streams**: Merchandise, content, events
- **Community Building**: Culture enthusiast community

#### Value Drivers:
- **Cultural Significance**: Strong cultural connection
- **Brand Potential**: Scalable brand concept
- **Memorability**: Easy to remember and recognize
- **Premium Positioning**: High-value brand potential

### Case Study 3: xflow.sol

#### Domain Analysis:
- **Category**: Bot Handle
- **Length**: 5 characters (good)
- **Memorability**: Medium (functional but not emotional)
- **Cultural Relevance**: Medium (tech-focused)

#### Strategic Positioning:
- **Tech Focus**: Suggests automation and efficiency
- **Flow Concept**: Implies smooth operation
- **Utility Focus**: Practical rather than emotional
- **Target Audience**: Developers, automation users

#### Utility Development:
- **Primary Use**: Automation and workflow tools
- **Secondary Use**: Developer tools and services
- **Revenue Streams**: SaaS subscriptions, consulting
- **Community Building**: Developer community

#### Value Drivers:
- **Utility Focus**: Practical value proposition
- **Tech Relevance**: Fits current tech trends
- **Scalability**: Can grow with tech ecosystem
- **Professional Appeal**: Appeals to business users

### Key Lessons:

#### Strategic Positioning
- **Cultural Relevance**: Domains that fit current culture perform better
- **Memorability**: Easy-to-remember names have higher value
- **Utility Potential**: Domains with multiple uses are more valuable
- **Brand Potential**: Names that can become brands have higher upside

#### Utility Development
- **Primary Use**: Clear main functionality
- **Secondary Uses**: Additional revenue streams
- **Community Building**: Engage target audience
- **Revenue Generation**: Multiple income sources

#### Value Maximization
- **Market Timing**: Launch when market is receptive
- **Community Engagement**: Build active user base
- **Content Creation**: Provide value to users
- **Partnership Development**: Collaborate with others

### Exercise:
Analyze three domains from your portfolio using the Retailstar framework.`
    },
    {
      id: "h200-m4",
      title: "Strategic Vaulting",
      description: "Build a vault plan for your domain stack.",
      type: 'assignment',
      duration: "120 min",
      completed: false,
      content: `# Strategic Vaulting

## Build a Vault Plan for Your Domain Stack

Learn how to create strategic vault plans that maximize the value of your domain portfolio.

### Vault Planning Framework:

#### Portfolio Analysis
**Current Holdings**:
- List all your domains
- Categorize by type and value
- Assess current utility
- Identify underutilized assets

**Market Position**:
- Evaluate market conditions
- Assess competition
- Identify opportunities
- Consider risks

**Growth Potential**:
- Estimate future value
- Identify expansion opportunities
- Assess scalability
- Consider market trends

#### Strategic Objectives
**Short-term Goals** (3-6 months):
- Immediate utility development
- Quick wins and improvements
- Market positioning
- Community building

**Medium-term Goals** (6-18 months):
- Revenue generation
- Brand development
- Partnership building
- Market expansion

**Long-term Goals** (18+ months):
- Portfolio optimization
- Strategic acquisitions
- Ecosystem dominance
- Legacy building

### Vault Strategy Components:

#### Primary Domains
**Flagship Domains**:
- Your best domains
- High-value assets
- Strong brand potential
- Multiple use cases

**Development Focus**:
- Maximize utility
- Build community
- Generate revenue
- Create partnerships

#### Secondary Domains
**Supporting Domains**:
- Complementary assets
- Niche positioning
- Specialized utility
- Backup options

**Optimization Focus**:
- Improve positioning
- Enhance utility
- Increase value
- Prepare for sale

#### Tertiary Domains
**Speculative Domains**:
- Future potential
- Emerging trends
- Long-term bets
- Diversification

**Management Focus**:
- Monitor performance
- Assess potential
- Decide on future
- Optimize holding

### Implementation Plan:

#### Phase 1: Assessment (Month 1)
- **Portfolio Audit**: Evaluate all domains
- **Market Analysis**: Understand current conditions
- **Goal Setting**: Define objectives
- **Resource Planning**: Allocate time and money

#### Phase 2: Development (Months 2-4)
- **Primary Development**: Focus on flagship domains
- **Utility Creation**: Build functionality
- **Community Building**: Engage users
- **Revenue Generation**: Create income streams

#### Phase 3: Optimization (Months 5-6)
- **Performance Review**: Assess progress
- **Strategy Adjustment**: Modify plans
- **Portfolio Rebalancing**: Buy/sell domains
- **Future Planning**: Plan next phase

### Assignment:
Design a vault strategy using 3-5 of your own or hypothetical domains. Include rationale.

**Submission Requirements:**
1. **Portfolio Overview**: List and categorize your domains
2. **Strategic Objectives**: Define short, medium, and long-term goals
3. **Development Plan**: How you'll maximize each domain's value
4. **Resource Allocation**: Time and money investment plan
5. **Success Metrics**: How you'll measure progress
6. **Risk Assessment**: Potential challenges and mitigation

**Example Submission:**
- **Primary Domain**: \`vaultdegen.sol\` - Community hub for degen traders
- **Secondary Domain**: \`kimono.sol\` - Lifestyle brand development
- **Tertiary Domain**: \`xflow.sol\` - Automation tools platform
- **Strategy**: Focus on community building, then revenue generation
- **Timeline**: 6-month development, 12-month optimization
- **Budget**: $10K development, $5K marketing, $5K partnerships`
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
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent glow-text">
              H200 🛠️ SNS Strategy: Domains as Digital Real Estate
            </h1>
            <p className="text-xl text-gray-300 mb-2">Domains aren't just words. They're assets.</p>
            <p className="text-yellow-300 text-lg">
              Current Time: <span className="text-yellow-400 font-mono">{currentTime}</span>
            </p>
          </div>

          {/* Progress Bar */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-yellow-400 font-semibold">Course Progress</span>
              <span className="text-gray-400">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-3 bg-slate-700" />
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Module List */}
            <div className="lg:col-span-1">
              <Card className="bg-slate-800/80 border-2 border-yellow-500/40 backdrop-blur-sm shadow-[0_0_30px_rgba(234,179,8,0.3)]">
                <CardHeader>
                  <CardTitle className="text-yellow-400">Course Modules</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {modules.map((module, index) => (
                      <div
                        key={module.id}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                          currentModule === index
                            ? 'border-yellow-500/60 bg-yellow-500/10 shadow-[0_0_20px_rgba(234,179,8,0.3)]'
                            : 'border-slate-600/40 bg-slate-700/40 hover:border-yellow-500/40 hover:bg-yellow-500/5'
                        }`}
                        onClick={() => setCurrentModule(index)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getModuleIcon(module.type)}
                            <span className="font-semibold text-gray-200">{module.title}</span>
                          </div>
                          {completedModules[module.id] && (
                            <CheckCircle className="w-5 h-5 text-yellow-400" />
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
              <Card className="bg-slate-800/80 border-2 border-yellow-500/40 backdrop-blur-sm shadow-[0_0_30px_rgba(234,179,8,0.3)]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-yellow-400">{modules[currentModule].title}</CardTitle>
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
                      className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white hover:from-yellow-500 hover:to-orange-500"
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
                        className="border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10"
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
          <div className="mt-12 text-cyan-400/70 text-sm text-center">#DigitalRealEstate #SNSStrategy #DomainAssets</div>
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