# Hoodie Academy 🎓

A comprehensive Next.js educational platform focused on Web3, Solana, and NFTs, featuring token gating, interactive courses, and a competitive leaderboard system.

## 🚀 Features

### Core Learning Platform
- **Token-gated content** based on WifHoodie NFT ownership
- **Interactive course content** with lessons, quizzes, and progress tracking
- **6 comprehensive courses** covering Web3 fundamentals
- **Real-time progress tracking** with localStorage persistence
- **Responsive design** optimized for all devices

### 🏆 Top 20 Leaderboard System
- **Wallet-based user tracking** using Solana addresses
- **Performance scoring** based on course completion, quiz scores, and achievements
- **Achievement system** with automatic unlocking
- **Real-time ranking** with search and filter capabilities
- **Detailed user profiles** with progress breakdown
- **Competitive gamification** to motivate learners

### 📊 Dashboard & Analytics
- **Personalized dashboard** with progress overview
- **Course completion statistics** and performance metrics
- **NFT badge tracking** and achievement display
- **Upcoming classes** and announcements
- **To-do list** with course assignments
- **Real-time clock** and activity tracking

### 🎯 Course Catalog
1. **Wallet Wizardry** - Master wallet setup and security
2. **NFT Mastery** - Create, trade, and build NFT communities
3. **Meme Coin Mania** - Navigate volatile meme coin markets
4. **Community Strategy** - Build thriving Web3 communities
5. **SNS Simplified** - Master Solana Name Service domains
6. **Technical Analysis** - Advanced trading strategies

### 🔐 Authentication & Security
- **Multi-wallet support** (MetaMask, Solflare, Phantom)
- **NFT verification** via Helius API
- **Session management** with secure storage
- **Wallet address validation** and SNS resolution

## 🛠️ Technologies Used

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icons

### Blockchain Integration
- **Solana Web3.js** - Solana blockchain interaction
- **Helius API** - NFT verification and data
- **SNS Resolver** - Solana Name Service integration

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vercel** - Deployment platform

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── leaderboard/       # Leaderboard system
│   ├── courses/          # Course catalog
│   ├── profile/          # User profiles
│   └── [course-pages]/   # Individual course pages
├── components/           # Reusable UI components
│   ├── leaderboard/     # Leaderboard components
│   ├── dashboard/       # Dashboard components
│   ├── ui/             # Base UI components
│   └── course-roadmap/ # Course navigation
├── services/           # Business logic services
├── hooks/             # Custom React hooks
├── lib/               # Utility functions and data
└── styles/            # Global styles
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Solana wallet (MetaMask, Solflare, or Phantom)
- WifHoodie NFT for access

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/lostdev11/HoodieAcademy.git
   cd HoodieAcademy
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_HELIUS_API_KEY=your_helius_api_key_here
   NEXT_PUBLIC_RPC_URL=https://api.mainnet-beta.solana.com
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

## 🎮 How to Use

### For Learners
1. **Connect your wallet** - Use MetaMask, Solflare, or Phantom
2. **Verify NFT ownership** - Ensure you own a WifHoodie NFT
3. **Access courses** - Browse the course catalog and start learning
4. **Track progress** - Monitor your completion and quiz scores
5. **Compete on leaderboard** - View rankings and achievements
6. **Earn badges** - Complete courses to unlock NFT badges

### For Developers
1. **Explore the codebase** - Check out the component structure
2. **Customize courses** - Modify course content in `src/lib/`
3. **Extend leaderboard** - Add new scoring metrics or achievements
4. **Deploy** - Use Vercel for easy deployment

## 🏆 Leaderboard System

### Scoring Algorithm
- **Course Completion**: 300 points per course
- **Lesson Progress**: 50 points per lesson
- **Quiz Performance**: 100 points + (score × 2)
- **Badge System**: 150 points per NFT badge
- **Achievements**: 100-300 points based on type
- **Consistency Bonus**: Up to 500 points for daily participation

### Achievements
- 🎯 **First Steps** - Complete your first course
- ⭐ **Perfect Score** - Achieve 100% on any quiz
- ⚡ **Speed Learner** - Complete 3 courses in one week
- 🔥 **Consistency King** - Log in for 30 consecutive days

## 📊 Performance Metrics

- **Build Size**: Optimized for fast loading
- **SEO**: Static generation for better performance
- **Accessibility**: WCAG compliant components
- **Mobile**: Responsive design for all devices

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Component-based architecture

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository
2. Configure environment variables
3. Deploy automatically on push

### Manual Deployment
```bash
npm run build
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Solana Foundation** for blockchain infrastructure
- **Helius** for NFT verification API
- **Radix UI** for accessible components
- **Tailwind CSS** for styling utilities

## 📞 Support

For questions or issues:
- Check the [Issues](https://github.com/lostdev11/HoodieAcademy/issues) page
- Review the [LEADERBOARD_README.md](./LEADERBOARD_README.md) for detailed leaderboard documentation
- Ensure your wallet is properly connected and you own a WifHoodie NFT

---

**Ready to start your Web3 learning journey? Connect your wallet and dive into the Hoodie Academy! 🎓✨** 