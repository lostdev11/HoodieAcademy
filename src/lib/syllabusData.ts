import type { SyllabusData } from '@/components/Syllabus';

export const syllabusData: Record<string, SyllabusData> = {
  'wallet-wizardry': {
    overview: "Master the fundamentals of Web3 wallet setup, security, and management.",
    objectives: [
      "Understand the basics of blockchain wallets",
      "Set up and secure a MetaMask wallet",
      "Learn to connect wallets to dApps",
      "Master wallet security measures"
    ],
    materials: [
      {
        type: 'video',
        title: 'Wallet Security Best Practices',
        url: 'https://www.youtube.com/watch?v=example1'
      }
    ],
    estimatedTime: "2-3 hours",
    quizOverview: {
      totalQuestions: 10,
      passingScore: 75,
      topics: ['Wallet Security', 'MetaMask Setup', 'Gas Fees']
    }
  },
  'nft-mastery': {
    overview: "Dive deep into the world of NFTs - from creation and minting to trading and community building. Explore the technical and social aspects of the NFT ecosystem with practical exercises.",
    objectives: [
      "Understand what NFTs are and their use cases in Web3",
      "Learn the process of creating and minting NFTs",
      "Master NFT trading strategies and market analysis",
      "Build and engage with NFT communities",
      "Navigate popular NFT marketplaces and tools"
    ],
    materials: [
      {
        type: 'video',
        title: 'NFT Creation Workshop',
        url: 'https://www.youtube.com/watch?v=example2',
        description: 'Hands-on tutorial for creating your first NFT'
      },
      {
        type: 'link',
        title: 'OpenSea Marketplace Guide',
        url: 'https://opensea.io/learn',
        description: 'Official guide to using OpenSea marketplace'
      },
      {
        type: 'tweet',
        title: 'NFT Market Analysis',
        url: 'https://twitter.com/hoodieacademy/status/example2',
        description: 'How to analyze NFT market trends'
      }
    ],
    estimatedTime: "3-4 hours",
    quizOverview: {
      totalQuestions: 12,
      passingScore: 75,
      topics: ['NFT Basics', 'Minting Process', 'Market Analysis', 'Community Building']
    }
  },
  'meme-coin-mania': {
    overview: "Navigate the volatile world of meme coins with data-driven analysis and risk management strategies. Learn to identify trends, build portfolios, and avoid common pitfalls in the meme coin space.",
    objectives: [
      "Understand meme coin psychology and market dynamics",
      "Analyze social media trends and community sentiment",
      "Build and manage a mock meme coin portfolio",
      "Learn risk management strategies for volatile assets",
      "Identify red flags and avoid common scams"
    ],
    materials: [
      {
        type: 'video',
        title: 'Meme Coin Analysis Framework',
        url: 'https://www.youtube.com/watch?v=example3',
        description: 'Systematic approach to analyzing meme coins'
      },
      {
        type: 'link',
        title: 'CoinGecko API Documentation',
        url: 'https://www.coingecko.com/en/api',
        description: 'Real-time cryptocurrency data API'
      },
      {
        type: 'tweet',
        title: 'Red Flags in Meme Coins',
        url: 'https://twitter.com/hoodieacademy/status/example3',
        description: 'Warning signs to watch out for'
      }
    ],
    estimatedTime: "2-3 hours",
    quizOverview: {
      totalQuestions: 8,
      passingScore: 75,
      topics: ['Market Analysis', 'Risk Management', 'Portfolio Strategy', 'Scam Detection']
    }
  },
  'n120-nft-lingo-decoded': {
    overview: "Master the language of NFT Twitter and Web3 culture. Learn to speak like a true degen and decode the hidden meanings behind NFT slang, floor price mechanics, trait rankings, and red flag detection.",
    objectives: [
      "Understand and use common NFT Twitter slang and terminology",
      "Master floor price mechanics and undercutting strategies",
      "Learn trait meta and rarity ranking systems",
      "Identify red flags and exit signals in NFT communities",
      "Navigate NFT culture with confidence and authenticity"
    ],
    materials: [
      {
        type: 'video',
        title: 'Degen Language Intro',
        url: '/videos/degen-language-intro.mp4',
        description: 'Introduction to NFT Twitter slang and culture'
      },
      {
        type: 'video',
        title: 'Floor Price Mechanics',
        url: '/videos/floor-mechanics.mp4',
        description: 'Understanding how floor prices work and move'
      },
      {
        type: 'video',
        title: 'Trait Meta Analysis',
        url: '/videos/trait-meta.mp4',
        description: 'How to analyze NFT traits and rarity'
      },
      {
        type: 'video',
        title: 'Red Flags Detection',
        url: '/videos/red-flags.mp4',
        description: 'Spotting warning signs in NFT projects'
      }
    ],
    estimatedTime: "1-2 hours",
    quizOverview: {
      totalQuestions: 8,
      passingScore: 75,
      topics: ['NFT Lingo', 'Floor Mechanics', 'Trait Analysis', 'Red Flags']
    }
  },
  'community-strategy': {
    overview: "Master the art of building and managing thriving Web3 communities. Learn social dynamics, engagement strategies, and governance structures that drive successful decentralized communities.",
    objectives: [
      "Understand the fundamentals of Web3 community building",
      "Learn effective communication and engagement strategies",
      "Master DAO governance and voting mechanisms",
      "Develop community growth and retention tactics",
      "Navigate community conflicts and moderation"
    ],
    materials: [
      {
        type: 'video',
        title: 'Community Building Masterclass',
        url: 'https://www.youtube.com/watch?v=example4',
        description: 'Comprehensive guide to building Web3 communities'
      },
      {
        type: 'pdf',
        title: 'DAO Governance Handbook',
        url: '/guides/dao-governance.pdf',
        description: 'Complete guide to DAO structures and voting'
      },
      {
        type: 'link',
        title: 'Discord Server Setup',
        url: 'https://discord.com/developers/docs',
        description: 'Official Discord developer documentation'
      }
    ],
    estimatedTime: "3-4 hours",
    quizOverview: {
      totalQuestions: 10,
      passingScore: 75,
      topics: ['Community Building', 'DAO Governance', 'Engagement Strategies', 'Conflict Resolution']
    }
  },
  'sns': {
    overview: "Your Journey From Domain Noob to Naming Savant - A practical and strategic curriculum for mastering SNS (Solana Name Service) domain flipping, storytelling, and ecosystem domination.",
    objectives: [
      "Master domain psychology and naming strategies",
      "Learn to identify and trade domain archetypes",
      "Create compelling lore and worldbuilding with subdomains",
      "Understand domains as digital real estate assets",
      "Develop advanced bidding and sniping techniques",
      "Build multi-use domain operations and team structures",
      "Master narrative economics and meme asset valuation",
      "Learn domain warfare and ecosystem domination strategies"
    ],
    materials: [
      {
        type: 'video',
        title: 'Domain Psychology 101: Why Names Matter',
        url: 'https://www.youtube.com/watch?v=example5',
        description: 'Understanding the psychology behind successful domain names'
      },
      {
        type: 'link',
        title: 'SNS Official Documentation',
        url: 'https://docs.solana.com/developing/runtime-facilities/programs/name-service',
        description: 'Official Solana Name Service documentation'
      },
      {
        type: 'tweet',
        title: 'Domain Archetypes & Use Cases',
        url: 'https://twitter.com/hoodieacademy/status/example5',
        description: 'Learn to recognize the core use cases behind successful domains'
      }
    ],
    estimatedTime: "20-30 hours",
    quizOverview: {
      totalQuestions: 50,
      passingScore: 75,
      topics: ['Domain Psychology', 'Archetypes', 'LoreCrafting', 'Digital Real Estate', 'Bidding Strategies', 'Multi-Use Domains', 'Narrative Economics', 'Domain Warfare']
    }
  },
  'technical-analysis': {
    overview: "Master advanced technical analysis techniques for cryptocurrency trading. Learn chart patterns, indicators, and leverage trading strategies to navigate volatile markets with confidence.",
    objectives: [
      "Master fundamental and advanced chart patterns",
      "Learn to use technical indicators effectively",
      "Understand leverage trading and risk management",
      "Develop systematic trading strategies",
      "Analyze market trends and momentum"
    ],
    materials: [
      {
        type: 'video',
        title: 'Technical Analysis Fundamentals',
        url: 'https://www.youtube.com/watch?v=example6',
        description: 'Core concepts of technical analysis'
      },
      {
        type: 'pdf',
        title: 'Chart Pattern Recognition',
        url: '/guides/chart-patterns.pdf',
        description: 'Comprehensive guide to chart patterns'
      },
      {
        type: 'link',
        title: 'TradingView Tutorial',
        url: 'https://www.tradingview.com/support/solutions/43000516165',
        description: 'How to use TradingView for analysis'
      }
    ],
    estimatedTime: "4-5 hours",
    quizOverview: {
      totalQuestions: 15,
      passingScore: 75,
      topics: ['Chart Patterns', 'Technical Indicators', 'Leverage Trading', 'Risk Management']
    }
  },
  'nft-trading-psychology': {
    overview: "Your journey from casual collector to meta-aware floor tactician. Learn NFT awareness, market instincts, and trading discipline through psychology-driven curriculum.",
    objectives: [
      "Master NFT marketplace navigation and trading mechanics",
      "Understand trading psychology and behavioral patterns",
      "Learn to identify meta shifts and trend waves",
      "Develop floor tactics and pricing strategies",
      "Study collector archetypes and counter-trading techniques"
    ],
    materials: [
      {
        type: 'video',
        title: 'NFT Marketplaces 101',
        url: 'https://www.youtube.com/watch?v=example7',
        description: 'Introduction to Tensor, Magic Eden, and trading mechanics'
      },
      {
        type: 'video',
        title: 'Trading Psychology Fundamentals',
        url: 'https://www.youtube.com/watch?v=example8',
        description: 'Understanding market psychology and behavioral patterns'
      },
      {
        type: 'link',
        title: 'Tensor Analytics',
        url: 'https://tensor.trade',
        description: 'Advanced NFT trading analytics and tools'
      }
    ],
    estimatedTime: "4-5 hours",
    quizOverview: {
      totalQuestions: 21,
      passingScore: 75,
      topics: ['Marketplace Mechanics', 'Trading Psychology', 'Meta Analysis', 'Floor Tactics', 'Archetype Study']
    }
  },
  'cybersecurity-wallet-practices': {
    overview: "Protect ya neck in Web3. Learn wallet security, browser hygiene, scam detection, and OpSec for traders. Essential knowledge for anyone in the crypto space.",
    objectives: [
      "Master wallet security fundamentals and seed phrase protection",
      "Learn browser hygiene and extension security",
      "Identify and avoid common crypto scams and phishing attempts",
      "Implement wallet segmentation and transaction simulation",
      "Develop OpSec practices for privacy and security",
      "Create incident response plans for security breaches"
    ],
    materials: [
      {
        type: 'video',
        title: 'Wallet Security Fundamentals',
        url: 'https://www.youtube.com/watch?v=example9',
        description: 'Understanding hot vs cold wallets and seed phrase security'
      },
      {
        type: 'video',
        title: 'Browser Security & OpSec',
        url: 'https://www.youtube.com/watch?v=example10',
        description: 'Browser hygiene and privacy protection techniques'
      },
      {
        type: 'link',
        title: 'Revoke.cash',
        url: 'https://revoke.cash',
        description: 'Token approval management and revocation'
      }
    ],
    estimatedTime: "3-4 hours",
    quizOverview: {
      totalQuestions: 21,
      passingScore: 75,
      topics: ['Wallet Security', 'Browser Hygiene', 'Scam Detection', 'OpSec', 'Incident Response']
    }
  },
  'ai-automation-curriculum': {
    overview: "Learn to wield the machine. Sacred knowledge for AI literacy, prompt engineering, and automation tools. This curriculum provides the foundation for understanding and using AI effectively in Web3.",
    objectives: [
      "Understand LLMs and AI fundamentals in plain English",
      "Master AI vocabulary and prompt engineering techniques",
      "Learn AI safety and ethics in Web3 context",
      "Develop intermediate prompting and customization skills",
      "Understand automation tools and database structures",
      "Explore AI agents and advanced automation concepts"
    ],
    materials: [
      {
        type: 'video',
        title: 'LLMs for Degens: Plain English + Real Tests',
        url: 'https://www.youtube.com/watch?v=example11',
        description: 'Understanding AI fundamentals without the hype'
      },
      {
        type: 'video',
        title: 'Prompt Engineering: Build, Don\'t Beg',
        url: 'https://www.youtube.com/watch?v=example12',
        description: 'Mastering the art of effective AI prompting'
      },
      {
        type: 'link',
        title: 'Make.com Documentation',
        url: 'https://www.make.com/en/help',
        description: 'Automation platform for building workflows'
      }
    ],
    estimatedTime: "4-5 hours",
    quizOverview: {
      totalQuestions: 24,
      passingScore: 75,
      topics: ['AI Fundamentals', 'Prompt Engineering', 'AI Safety', 'Automation Tools', 'Agent Systems']
    }
  },
  'lore-narrative-crafting': {
    overview: "Build worlds. Shape myths. Write the future. Learn storytelling, worldbuilding, and narrative development in Web3 communities. This curriculum focuses on creating compelling narratives that strengthen community bonds.",
    objectives: [
      "Understand the value of narrative in decentralized communities",
      "Discover your personal archetype and identity within the community",
      "Create compelling personal lore and character development",
      "Learn worldbuilding techniques for community spaces",
      "Master narrative conflict and faction development",
      "Develop skills for translating lore into social media content",
      "Explore advanced symbolism and recurring themes"
    ],
    materials: [
      {
        type: 'video',
        title: 'Lore is Liquidity: Why Stories Matter in NFTs',
        url: 'https://www.youtube.com/watch?v=example13',
        description: 'Understanding the value of narrative in Web3 communities'
      },
      {
        type: 'video',
        title: 'From Carl Jung to Hoodie Lore: Know Thy Degen',
        url: 'https://www.youtube.com/watch?v=example14',
        description: 'Discovering your archetype and identity'
      },
      {
        type: 'link',
        title: 'Lore Template Resources',
        url: 'https://notion.so',
        description: 'Templates for creating and organizing lore content'
      }
    ],
    estimatedTime: "3-4 hours",
    quizOverview: {
      totalQuestions: 21,
      passingScore: 75,
      topics: ['Lore Fundamentals', 'Archetypes', 'Worldbuilding', 'Narrative Conflict', 'Symbolism']
    }
  },
  'hoodie-squad-track': {
    overview: "Choose your squad and follow a curated learning path designed for your specific role in the Hoodie Academy ecosystem. Each squad has specialized curricula that develop the skills and knowledge needed for their unique mission.",
    objectives: [
      "Understand the four Hoodie squads and their distinct roles",
      "Choose the squad that best aligns with your skills and interests",
      "Follow a curated curriculum path for your selected squad",
      "Develop squad-specific competencies and knowledge",
      "Track progress across multiple courses within your squad track"
    ],
    materials: [
      {
        type: 'video',
        title: 'Squad Overview: Decoders, Raiders, Speakers, Creators',
        url: 'https://www.youtube.com/watch?v=example15',
        description: 'Understanding the four Hoodie squads and their missions'
      },
      {
        type: 'link',
        title: 'Squad Selection Guide',
        url: '/hoodie-squad-track',
        description: 'Interactive guide to help you choose your squad'
      }
    ],
    estimatedTime: "Varies by squad (4-8 hours)",
    quizOverview: {
      totalQuestions: 0,
      passingScore: 0,
      topics: ['Squad Selection', 'Curated Learning Paths', 'Progress Tracking']
    }
  }
}; 