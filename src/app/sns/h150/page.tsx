"use client";
import { useState, useEffect } from "react";
import TokenGate from "@/components/TokenGate";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Play, FileText, CheckCircle, Clock, BookOpen, Users } from "lucide-react";
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

export default function H150Course() {
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
      id: "h150-m1",
      title: "Subdomain Theory",
      description: "Subdomains as narrative and utility layers.",
      type: 'video',
      duration: "30 min",
      completed: false,
      content: `# Subdomain Theory

## Subdomains as Narrative and Utility Layers

Subdomains are powerful tools for creating layered, interconnected digital identities. Learn how to use them to build worlds.

### Technical Overview:

#### What is a Subdomain?
A subdomain is a prefix to your main domain that creates a separate but connected identity:
- \`ops.kongx.sui\` - Operations layer
- \`vip.retailstar.sol\` - VIP access gating
- \`echo.hoodieverse.sol\` - Echo chamber concept

#### How Subdomains Work:
1. **Hierarchical Structure**: Main domain owns all subdomains
2. **Independent Identity**: Each subdomain can have its own purpose
3. **Shared Branding**: All subdomains inherit main domain's authority
4. **Flexible Delegation**: Can delegate to different wallets/contracts

### Narrative Function:

#### Worldbuilding Tools:
- **Role Assignment**: \`scout.hoodieverse.sol\` for scouts
- **Access Control**: \`vip.retailstar.sol\` for exclusive content
- **Content Portals**: \`blog.hoodieacademy.sol\` for articles
- **Community Layers**: \`dao.hoodieverse.sol\` for governance

### Utility Layers:

#### Functional Subdomains:
- **Operations**: \`ops.kongx.sui\` - Team operations
- **Development**: \`dev.kongx.sui\` - Development tools
- **Testing**: \`test.kongx.sui\` - Testing environments
- **Staging**: \`staging.kongx.sui\` - Pre-production

#### Access Control:
- **VIP Access**: \`vip.retailstar.sol\` - Exclusive content
- **Alpha Access**: \`alpha.retailstar.sol\` - Early access
- **Public Access**: \`public.retailstar.sol\` - Open content

### Examples to Study:
- \`ops.kongx.sui\` - Team bot operations
- \`vip.retailstar.sol\` - Access gating system
- \`echo.hoodieverse.sol\` - Echo chamber concept

### Exercise:
Map out a subdomain structure for your own domain or a hypothetical project.`
    },
    {
      id: "h150-m2",
      title: "Network Structures",
      description: "Create and analyze layered domain hierarchies.",
      type: 'case-study',
      duration: "45 min",
      completed: false,
      content: `# Network Structures

## Create and Analyze Layered Domain Hierarchies

Learn how to create cohesive naming schemas that tell stories and build communities.

### Example Frameworks:

#### 1. Team Operations Framework
**Structure**: \`[role].[main].sol\`
**Examples**:
- \`ops.kongx.sui\` - Operations
- \`dev.kongx.sui\` - Development
- \`scout.kongx.sui\` - Scouting
- \`mage.kongx.sui\` - Strategy

#### 2. Access Control Framework
**Structure**: \`[tier].[main].sol\`
**Examples**:
- \`vip.retailstar.sol\` - VIP access
- \`alpha.retailstar.sol\` - Alpha access
- \`public.retailstar.sol\` - Public content

#### 3. Content Portal Framework
**Structure**: \`[content-type].[main].sol\`
**Examples**:
- \`blog.hoodieacademy.sol\` - Articles
- \`video.hoodieacademy.sol\` - Video content
- \`podcast.hoodieacademy.sol\` - Audio content

#### 4. Community Layer Framework
**Structure**: \`[community].[main].sol\`
**Examples**:
- \`dao.hoodieverse.sol\` - Governance
- \`chat.hoodieverse.sol\` - Communication
- \`events.hoodieverse.sol\` - Event management

### Design Principles:

#### Consistency
- Use consistent prefixes across all subdomains
- Maintain naming conventions
- Create predictable patterns

#### Scalability
- Plan for future expansion
- Leave room for new subdomains
- Consider automation potential

#### Branding
- Reinforce main domain authority
- Create cohesive visual identity
- Build brand recognition

### Hierarchy Analysis:

#### Depth Levels:
- **Level 1**: Main domain (e.g., \`hoodieacademy.sol\`)
- **Level 2**: Primary subdomains (e.g., \`blog.hoodieacademy.sol\`)
- **Level 3**: Secondary subdomains (e.g., \`tech.blog.hoodieacademy.sol\`)

#### Complexity Management:
- Keep hierarchies shallow (max 3 levels)
- Use clear, descriptive prefixes
- Avoid overly complex structures

### Assignment:
Design a subdomain network for a DAO with at least 5 functional layers.`
    },
    {
      id: "h150-m3",
      title: "Squad & Worldbuilding",
      description: "Design team lore with structured subdomains.",
      type: 'exercise',
      duration: "60 min",
      completed: false,
      content: `# Squad & Worldbuilding

## Design Team Lore with Structured Subdomains

Learn how to design naming systems that bring communities together and create shared identity.

### Role-Based Naming:

#### Scout Roles:
- \`scout.alpha.sol\` - Alpha scout
- \`scout.beta.sol\` - Beta scout
- \`scout.gamma.sol\` - Gamma scout

#### Mage Roles:
- \`mage.strategy.sol\` - Strategy mage
- \`mage.analysis.sol\` - Analysis mage
- \`mage.research.sol\` - Research mage

#### Vault Roles:
- \`vault.treasury.sol\` - Treasury vault
- \`vault.security.sol\` - Security vault
- \`vault.backup.sol\` - Backup vault

#### Tracker Roles:
- \`tracker.market.sol\` - Market tracker
- \`tracker.social.sol\` - Social tracker
- \`tracker.news.sol\` - News tracker

### Worldbuilding Elements:

#### Geographic Structure:
- \`district.alpha.sol\` - Alpha district
- \`district.beta.sol\` - Beta district
- \`district.gamma.sol\` - Gamma district

#### Temporal Structure:
- \`era.genesis.sol\` - Genesis era
- \`era.expansion.sol\` - Expansion era
- \`era.consolidation.sol\` - Consolidation era

#### Functional Structure:
- \`guild.traders.sol\` - Traders guild
- \`guild.builders.sol\` - Builders guild
- \`guild.artists.sol\` - Artists guild

### Lore Integration:

#### Character Development:
- **Origin Stories**: How each subdomain came to exist
- **Personalities**: Traits that define each subdomain
- **Relationships**: How subdomains interact
- **Goals**: What each subdomain wants to achieve

#### World Context:
- **Setting**: Where subdomains exist in the ecosystem
- **History**: Events that shaped the world
- **Culture**: Values that define the community
- **Future**: Where the world is headed

### Design Exercise:
Create a squad with 10 members using a shared naming schema. Include:
1. Main domain concept
2. Role-based subdomains
3. Hierarchy structure
4. Branding elements
5. Expansion potential
6. Lore elements

**Submission Requirements:**
- 10 subdomain names with roles
- Hierarchy structure diagram
- Brief lore for each subdomain
- Expansion plan for future growth`
    },
    {
      id: "h150-m4",
      title: "Fictional Expansion",
      description: "Write lore for `x.hoodieacademy.sol`.",
      type: 'assignment',
      duration: "90 min",
      completed: false,
      content: `# Fictional Expansion

## Write Lore for \`x.hoodieacademy.sol\`

Turn your subdomains into living stories that engage communities and create value.

### Lore Writing Framework:

#### Character Development:
- **Backstory**: How did this subdomain come to exist?
- **Personality**: What traits define this subdomain?
- **Relationships**: How does it interact with other subdomains?
- **Goals**: What does this subdomain want to achieve?

#### World Context:
- **Setting**: Where does this subdomain exist in your world?
- **History**: What events shaped this subdomain?
- **Culture**: What values does this subdomain represent?
- **Future**: Where is this subdomain headed?

#### Narrative Elements:
- **Conflict**: What challenges does this subdomain face?
- **Allies**: Who supports this subdomain?
- **Enemies**: Who opposes this subdomain?
- **Secrets**: What hidden knowledge does it hold?

### Example Lore Piece:

**\`x.hoodieacademy.sol\` - The Echo Chamber**

In the depths of the Hoodie Academy, there exists a mysterious subdomain known only as "x." This is no ordinary classroom—it's an echo chamber where ideas bounce between walls of pure thought, amplifying the voices of those brave enough to enter.

The x subdomain serves as a testing ground for radical concepts, a place where theories echo until they either shatter or solidify into truth. Only the most dedicated students gain access, and those who do often emerge changed, their minds expanded by the endless reverberations of possibility.

### Alternative Lore Concepts:

#### The Experiment Lab
A place where students conduct digital experiments, testing theories and pushing boundaries in the crypto space.

#### The Crossroads
A meeting point where different paths converge, where students from various disciplines come together to share knowledge.

#### The Unknown Variable
A mysterious domain that represents the unpredictable element in every equation, the X factor that can change everything.

### Assignment:
Write a 3-5 sentence lore piece for \`x.hoodieacademy.sol\` and submit to forum or Discord for votes.

**Requirements:**
- 3-5 sentences minimum
- Include character/world elements
- Suggest functionality or purpose
- Create emotional connection
- Leave room for expansion

**Submission Format:**
1. Subdomain name
2. Lore piece (3-5 sentences)
3. Intended functionality
4. Target audience
5. Expansion potential

**Voting Criteria:**
- Creativity and originality
- Emotional resonance
- Functional potential
- Community appeal
- Expansion possibilities`
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
              H150 🔀 LoreCrafting with Subdomains
            </h1>
            <p className="text-xl text-gray-300 mb-2">Turn any name into a living world</p>
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
          <div className="mt-12 text-cyan-400/70 text-sm text-center">#LoreCrafting #Subdomains #Worldbuilding</div>
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