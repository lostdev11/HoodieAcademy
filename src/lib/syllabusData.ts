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
    overview: "Master the Solana Name Service (SNS) ecosystem. Learn to register, manage, and trade .sol domain names while understanding the technical and economic aspects of decentralized naming systems.",
    objectives: [
      "Understand the Solana Name Service and its benefits",
      "Learn to register and manage .sol domain names",
      "Master SNS trading and valuation strategies",
      "Navigate the SNS marketplace and tools",
      "Understand the technical architecture of SNS"
    ],
    materials: [
      {
        type: 'video',
        title: 'SNS Registration Tutorial',
        url: 'https://www.youtube.com/watch?v=example5',
        description: 'Step-by-step guide to registering .sol domains'
      },
      {
        type: 'link',
        title: 'SNS Official Documentation',
        url: 'https://docs.solana.com/developing/runtime-facilities/programs/name-service',
        description: 'Official Solana Name Service documentation'
      },
      {
        type: 'tweet',
        title: 'SNS Trading Tips',
        url: 'https://twitter.com/hoodieacademy/status/example5',
        description: 'Advanced trading strategies for .sol domains'
      }
    ],
    estimatedTime: "1-2 hours",
    quizOverview: {
      totalQuestions: 6,
      passingScore: 75,
      topics: ['SNS Basics', 'Domain Registration', 'Trading Strategies', 'Technical Architecture']
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
  }
}; 