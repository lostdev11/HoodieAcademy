import { NextResponse } from 'next/server';

interface Message {
  id: string;
  title: string;
  body: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  author?: string;
  squad?: string;
}

interface BulletinData {
  global: Message[];
  squads: Record<string, Message[]>;
}

// Mock data simulating Notion/Airtable integration
const mockBulletinData: BulletinData = {
  global: [
    {
      id: '1',
      title: '🚨 Class Is In Session Campaign Launch',
      body: `# 🎓 Welcome to Hoodie Academy!

**Campaign Overview:**
- Each squad must drop a demo item by **Friday**
- Focus on the "Class Is In Session" theme
- All submissions will be reviewed by the community

**Important Dates:**
- **Submission Deadline:** Friday, 11:59 PM UTC
- **Community Review:** Saturday-Sunday
- **Winners Announced:** Monday

**Rewards:**
- Top 3 submissions get exclusive hoodie NFTs
- Featured placement on the main dashboard
- Recognition in the Great Hoodie Hall

*Good luck to all squads!* 🧢✨`,
      priority: 'high',
      createdAt: '2024-01-15T10:00:00Z',
      author: 'Hoodie Academy Admin'
    },
    {
      id: '2',
      title: '📢 New Discord Server Structure',
      body: `We've reorganized our Discord server to better support squad collaboration:

## 🏗️ New Channel Structure
- **#general** - Global announcements and discussions
- **#squad-chat** - Cross-squad collaboration
- **#resources** - Shared learning materials
- **#showcase** - Member submissions and highlights

## 🎯 Squad-Specific Channels
Each squad now has their own dedicated space:
- **#creators-workshop** - Meme and graphic creation
- **#decoders-library** - Educational content and TLDRs
- **#speakers-stage** - Community engagement and events
- **#raiders-hq** - Discord management and onboarding
- **#rangers-scout** - Partnership and opportunity hunting
- **#treasury-vault** - Financial strategy and metrics

*Join your squad's channel and start collaborating!* 🚀`,
      priority: 'medium',
      createdAt: '2024-01-14T15:30:00Z',
      author: 'Community Manager'
    },
    {
      id: '3',
      title: '🎉 Weekly Community Highlights',
      body: `## 🌟 This Week's Achievements

**Top Contributors:**
- @hoodie_creator_123 - Amazing meme collection
- @decoder_master - Comprehensive DeFi guide
- @speaker_pro - Engaging community discussions

**Squad Milestones:**
- **Creators:** 50+ memes created this week
- **Decoders:** 25 educational posts
- **Speakers:** 3 successful community events
- **Raiders:** Discord structure 90% complete
- **Rangers:** 5 new partnerships identified
- **Treasury:** 15% increase in community engagement

**Upcoming Events:**
- Friday: Squad submission deadline
- Saturday: Community voting opens
- Sunday: Live Q&A with top contributors

*Keep up the amazing work!* 🎊`,
      priority: 'low',
      createdAt: '2024-01-13T09:15:00Z',
      author: 'Community Manager'
    }
  ],
  squads: {
    creators: [
      {
        id: 'c1',
        title: '🎨 Creators Squad - Meme Assets Due Friday',
        body: `# 🎨 Creators Squad Update

**Priority Task:** Create meme assets for "Class Is In Session" campaign

## 📋 Requirements:
- **Format:** PNG/JPG, 1080x1080px minimum
- **Theme:** "Class Is In Session" - hoodie culture meets education
- **Style:** Pixel art, memes, or graphic design
- **Quantity:** 3-5 pieces per creator

## 🎯 Focus Areas:
- Hoodie + graduation cap combinations
- "Study hard, hoodie harder" variations
- Academic humor with crypto elements
- Community collaboration themes

## 📤 Submission Process:
1. Upload to Discord #creators-workshop
2. Tag with #class-in-session
3. Include your wallet address for rewards

**Deadline:** Friday, 11:59 PM UTC

*Let's make some legendary hoodie memes!* 🧢🎨`,
        priority: 'high',
        createdAt: '2024-01-15T11:00:00Z',
        author: 'Creators Squad Leader',
        squad: 'creators'
      }
    ],
    decoders: [
      {
        id: 'd1',
        title: '🧠 Decoders Squad - Educational Content Deadline',
        body: `# 🧠 Decoders Squad Mission

**Task:** Create educational content and TLDRs for the community

## 📚 Content Types Needed:
- **DeFi Protocol Explanations** (3-5 minute reads)
- **Crypto Market Analysis** (weekly summaries)
- **Technical Tutorials** (step-by-step guides)
- **Glossary Updates** (new terms and definitions)

## 🎯 Focus Topics:
- Layer 2 scaling solutions
- DeFi yield strategies
- NFT marketplace dynamics
- Cross-chain bridges

## 📝 Submission Guidelines:
- Use clear, beginner-friendly language
- Include visual aids when possible
- Tag with relevant topics
- Submit to #decoders-library

**Deadline:** Friday, 11:59 PM UTC

*Knowledge is power - let's share it!* 📖💡`,
        priority: 'high',
        createdAt: '2024-01-15T11:30:00Z',
        author: 'Decoders Squad Leader',
        squad: 'decoders'
      }
    ],
    speakers: [
      {
        id: 's1',
        title: '📢 Speakers Squad - Community Engagement Prep',
        body: `# 📢 Speakers Squad Update

**Mission:** Prepare community engagement materials and events

## 🎤 Tasks for This Week:
- **Welcome Threads** (2-3 per speaker)
- **Space Outlines** (community discussion topics)
- **Event Planning** (upcoming community calls)
- **Moderation Guidelines** (community standards)

## 🎯 Focus Areas:
- New member onboarding experience
- Community discussion topics
- Event scheduling and promotion
- Feedback collection methods

## 📋 Deliverables:
- Welcome thread templates
- Event calendar for next month
- Community guidelines document
- Engagement metrics tracking

**Deadline:** Friday, 11:59 PM UTC

*Let's make our community the most engaging in crypto!* 🎤✨`,
        priority: 'medium',
        createdAt: '2024-01-15T12:00:00Z',
        author: 'Speakers Squad Leader',
        squad: 'speakers'
      }
    ],
    raiders: [
      {
        id: 'r1',
        title: '⚔️ Raiders Squad - Discord Structure & Onboarding',
        body: `# ⚔️ Raiders Squad Mission

**Priority:** Complete Discord structure and onboarding documentation

## 🏗️ Discord Structure Tasks:
- **Channel Organization** (complete hierarchy)
- **Role Permissions** (squad-specific roles)
- **Bot Integration** (automation setup)
- **Welcome Flow** (new member experience)

## 📚 Documentation Needed:
- **Onboarding Guide** (step-by-step process)
- **Community Guidelines** (rules and standards)
- **Squad Handbook** (role descriptions)
- **FAQ Section** (common questions)

## 🎯 Deliverables:
- Complete Discord server structure
- Onboarding documentation
- Role permission matrix
- Welcome bot configuration

**Deadline:** Friday, 11:59 PM UTC

*Building the foundation for our community!* 🏗️📋`,
        priority: 'high',
        createdAt: '2024-01-15T12:30:00Z',
        author: 'Raiders Squad Leader',
        squad: 'raiders'
      }
    ],
    rangers: [
      {
        id: 'rg1',
        title: '🦅 Rangers Squad - Partnership Scouting',
        body: `# 🦅 Rangers Squad Update

**Mission:** Scout for partnerships and collaboration opportunities

## 🔍 Scouting Areas:
- **NFT Projects** (potential collaborations)
- **DeFi Protocols** (integration opportunities)
- **Gaming Studios** (crossover potential)
- **Educational Platforms** (content partnerships)

## 📊 Research Requirements:
- **Market Analysis** (trending projects)
- **Partnership Viability** (alignment assessment)
- **Contact Information** (decision makers)
- **Proposal Templates** (outreach materials)

## 🎯 Deliverables:
- Partnership opportunity list (10-15 projects)
- Contact database with key decision makers
- Outreach templates for different project types
- Partnership proposal framework

**Deadline:** Friday, 11:59 PM UTC

*Expanding our network and opportunities!* 🌐🤝`,
        priority: 'medium',
        createdAt: '2024-01-15T13:00:00Z',
        author: 'Rangers Squad Leader',
        squad: 'rangers'
      }
    ],
    treasury: [
      {
        id: 't1',
        title: '🏦 Treasury Squad - Metrics & Analytics',
        body: `# 🏦 Treasury Squad Mission

**Focus:** Track and analyze community metrics and financial strategies

## 📊 Metrics to Track:
- **Community Growth** (member acquisition)
- **Engagement Rates** (activity levels)
- **Content Performance** (popular posts/topics)
- **Financial Metrics** (treasury performance)

## 📈 Analysis Requirements:
- **Weekly Reports** (trend analysis)
- **Growth Projections** (forecasting)
- **ROI Calculations** (investment tracking)
- **Risk Assessment** (market conditions)

## 🎯 Deliverables:
- Weekly metrics dashboard
- Growth projection models
- Investment strategy recommendations
- Risk management framework

**Deadline:** Friday, 11:59 PM UTC

*Optimizing our community's financial health!* 📊💰`,
        priority: 'medium',
        createdAt: '2024-01-15T13:30:00Z',
        author: 'Treasury Squad Leader',
        squad: 'treasury'
      }
    ]
  }
};

export async function GET() {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return NextResponse.json(mockBulletinData);
  } catch (error) {
    console.error('Error fetching bulletin data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bulletin data' },
      { status: 500 }
    );
  }
} 