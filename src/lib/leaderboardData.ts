export interface LeaderboardUser {
  walletAddress: string;
  displayName: string;
  rank: number;
  totalScore: number;
  coursesCompleted: number;
  totalLessons: number;
  totalQuizzes: number;
  averageQuizScore: number;
  badgesEarned: number;
  joinDate: string;
  lastActive: string;
  profileImage?: string;
  squad?: string;
  achievements: Achievement[];
  courseProgress: CourseProgress[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedDate: string;
  points: number;
}

export interface CourseProgress {
  courseId: string;
  courseName: string;
  progress: number;
  score: number;
  completed: boolean;
  completedDate?: string;
  lessonsCompleted: number;
  totalLessons: number;
  quizzesPassed: number;
  totalQuizzes: number;
}

// Mock leaderboard data - in production this would come from a database
export const mockLeaderboardData: LeaderboardUser[] = [
  {
    walletAddress: "JCUGres3WA8MbHgzoBNRqcKRcrfyCk31yK16bfzFUtoU",
    displayName: "HoodieScholar",
    rank: 1,
    totalScore: 2850,
    coursesCompleted: 6,
    totalLessons: 22,
    totalQuizzes: 18,
    averageQuizScore: 94.2,
    badgesEarned: 6,
    joinDate: "2024-01-15",
    lastActive: "2024-12-19T10:30:00Z",
    squad: "hoodie-creators",
    achievements: [
      {
        id: "first-course",
        name: "First Steps",
        description: "Completed your first course",
        icon: "🎯",
        earnedDate: "2024-01-20",
        points: 100
      },
      {
        id: "perfect-score",
        name: "Perfect Score",
        description: "Achieved 100% on a quiz",
        icon: "⭐",
        earnedDate: "2024-02-15",
        points: 200
      }
    ],
    courseProgress: [
      {
        courseId: "wallet-wizardry",
        courseName: "Wallet Wizardry",
        progress: 100,
        score: 95,
        completed: true,
        completedDate: "2024-01-20",
        lessonsCompleted: 4,
        totalLessons: 4,
        quizzesPassed: 1,
        totalQuizzes: 1
      },
      {
        courseId: "nft-mastery",
        courseName: "NFT Mastery",
        progress: 100,
        score: 92,
        completed: true,
        completedDate: "2024-02-10",
        lessonsCompleted: 4,
        totalLessons: 4,
        quizzesPassed: 1,
        totalQuizzes: 1
      },
      {
        courseId: "meme-coin-mania",
        courseName: "Meme Coin Mania",
        progress: 100,
        score: 98,
        completed: true,
        completedDate: "2024-03-05",
        lessonsCompleted: 4,
        totalLessons: 4,
        quizzesPassed: 1,
        totalQuizzes: 1
      },
      {
        courseId: "community-strategy",
        courseName: "Community Strategy",
        progress: 100,
        score: 89,
        completed: true,
        completedDate: "2024-04-12",
        lessonsCompleted: 4,
        totalLessons: 4,
        quizzesPassed: 1,
        totalQuizzes: 1
      },
      {
        courseId: "sns",
        courseName: "SNS Simplified",
        progress: 100,
        score: 96,
        completed: true,
        completedDate: "2024-05-20",
        lessonsCompleted: 2,
        totalLessons: 2,
        quizzesPassed: 1,
        totalQuizzes: 1
      },
      {
        courseId: "technical-analysis",
        courseName: "Technical Analysis Tactics",
        progress: 100,
        score: 91,
        completed: true,
        completedDate: "2024-06-15",
        lessonsCompleted: 4,
        totalLessons: 4,
        quizzesPassed: 1,
        totalQuizzes: 1
      }
    ]
  },
  {
    walletAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    displayName: "CryptoNinja",
    rank: 2,
    totalScore: 2720,
    coursesCompleted: 5,
    totalLessons: 18,
    totalQuizzes: 15,
    averageQuizScore: 91.8,
    badgesEarned: 5,
    joinDate: "2024-02-01",
    lastActive: "2024-12-19T09:15:00Z",
    squad: "hoodie-creators",
    achievements: [
      {
        id: "speed-learner",
        name: "Speed Learner",
        description: "Completed 3 courses in one week",
        icon: "⚡",
        earnedDate: "2024-03-10",
        points: 300
      }
    ],
    courseProgress: [
      {
        courseId: "wallet-wizardry",
        courseName: "Wallet Wizardry",
        progress: 100,
        score: 88,
        completed: true,
        completedDate: "2024-02-10",
        lessonsCompleted: 4,
        totalLessons: 4,
        quizzesPassed: 1,
        totalQuizzes: 1
      },
      {
        courseId: "nft-mastery",
        courseName: "NFT Mastery",
        progress: 100,
        score: 95,
        completed: true,
        completedDate: "2024-03-05",
        lessonsCompleted: 4,
        totalLessons: 4,
        quizzesPassed: 1,
        totalQuizzes: 1
      },
      {
        courseId: "meme-coin-mania",
        courseName: "Meme Coin Mania",
        progress: 100,
        score: 92,
        completed: true,
        completedDate: "2024-04-01",
        lessonsCompleted: 4,
        totalLessons: 4,
        quizzesPassed: 1,
        totalQuizzes: 1
      },
      {
        courseId: "community-strategy",
        courseName: "Community Strategy",
        progress: 100,
        score: 89,
        completed: true,
        completedDate: "2024-05-15",
        lessonsCompleted: 4,
        totalLessons: 4,
        quizzesPassed: 1,
        totalQuizzes: 1
      },
      {
        courseId: "sns",
        courseName: "SNS Simplified",
        progress: 100,
        score: 94,
        completed: true,
        completedDate: "2024-06-10",
        lessonsCompleted: 2,
        totalLessons: 2,
        quizzesPassed: 1,
        totalQuizzes: 1
      },
      {
        courseId: "technical-analysis",
        courseName: "Technical Analysis Tactics",
        progress: 75,
        score: 0,
        completed: false,
        lessonsCompleted: 3,
        totalLessons: 4,
        quizzesPassed: 0,
        totalQuizzes: 1
      }
    ]
  },
  {
    walletAddress: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    displayName: "Web3Wizard",
    rank: 3,
    totalScore: 2580,
    coursesCompleted: 4,
    totalLessons: 16,
    totalQuizzes: 12,
    averageQuizScore: 89.5,
    badgesEarned: 4,
    joinDate: "2024-01-20",
    lastActive: "2024-12-19T08:45:00Z",
    squad: "hoodie-creators",
    achievements: [
      {
        id: "consistency",
        name: "Consistency King",
        description: "Logged in for 30 consecutive days",
        icon: "🔥",
        earnedDate: "2024-04-20",
        points: 250
      }
    ],
    courseProgress: [
      {
        courseId: "wallet-wizardry",
        courseName: "Wallet Wizardry",
        progress: 100,
        score: 90,
        completed: true,
        completedDate: "2024-02-05",
        lessonsCompleted: 4,
        totalLessons: 4,
        quizzesPassed: 1,
        totalQuizzes: 1
      },
      {
        courseId: "nft-mastery",
        courseName: "NFT Mastery",
        progress: 100,
        score: 87,
        completed: true,
        completedDate: "2024-03-20",
        lessonsCompleted: 4,
        totalLessons: 4,
        quizzesPassed: 1,
        totalQuizzes: 1
      },
      {
        courseId: "meme-coin-mania",
        courseName: "Meme Coin Mania",
        progress: 100,
        score: 93,
        completed: true,
        completedDate: "2024-05-01",
        lessonsCompleted: 4,
        totalLessons: 4,
        quizzesPassed: 1,
        totalQuizzes: 1
      },
      {
        courseId: "community-strategy",
        courseName: "Community Strategy",
        progress: 100,
        score: 85,
        completed: true,
        completedDate: "2024-06-05",
        lessonsCompleted: 4,
        totalLessons: 4,
        quizzesPassed: 1,
        totalQuizzes: 1
      },
      {
        courseId: "sns",
        courseName: "SNS Simplified",
        progress: 50,
        score: 0,
        completed: false,
        lessonsCompleted: 1,
        totalLessons: 2,
        quizzesPassed: 0,
        totalQuizzes: 1
      },
      {
        courseId: "technical-analysis",
        courseName: "Technical Analysis Tactics",
        progress: 25,
        score: 0,
        completed: false,
        lessonsCompleted: 1,
        totalLessons: 4,
        quizzesPassed: 0,
        totalQuizzes: 1
      }
    ]
  },
  {
    walletAddress: "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
    displayName: "DeFiDragon",
    rank: 4,
    totalScore: 2450,
    coursesCompleted: 4,
    totalLessons: 14,
    totalQuizzes: 10,
    averageQuizScore: 87.2,
    badgesEarned: 4,
    joinDate: "2024-02-10",
    lastActive: "2024-12-19T07:30:00Z",
    squad: "hoodie-creators",
    achievements: [],
    courseProgress: [
      {
        courseId: "wallet-wizardry",
        courseName: "Wallet Wizardry",
        progress: 100,
        score: 85,
        completed: true,
        completedDate: "2024-03-01",
        lessonsCompleted: 4,
        totalLessons: 4,
        quizzesPassed: 1,
        totalQuizzes: 1
      },
      {
        courseId: "nft-mastery",
        courseName: "NFT Mastery",
        progress: 100,
        score: 89,
        completed: true,
        completedDate: "2024-04-10",
        lessonsCompleted: 4,
        totalLessons: 4,
        quizzesPassed: 1,
        totalQuizzes: 1
      },
      {
        courseId: "meme-coin-mania",
        courseName: "Meme Coin Mania",
        progress: 100,
        score: 91,
        completed: true,
        completedDate: "2024-05-20",
        lessonsCompleted: 4,
        totalLessons: 4,
        quizzesPassed: 1,
        totalQuizzes: 1
      },
      {
        courseId: "community-strategy",
        courseName: "Community Strategy",
        progress: 100,
        score: 83,
        completed: true,
        completedDate: "2024-06-25",
        lessonsCompleted: 4,
        totalLessons: 4,
        quizzesPassed: 1,
        totalQuizzes: 1
      },
      {
        courseId: "sns",
        courseName: "SNS Simplified",
        progress: 0,
        score: 0,
        completed: false,
        lessonsCompleted: 0,
        totalLessons: 2,
        quizzesPassed: 0,
        totalQuizzes: 1
      },
      {
        courseId: "technical-analysis",
        courseName: "Technical Analysis Tactics",
        progress: 0,
        score: 0,
        completed: false,
        lessonsCompleted: 0,
        totalLessons: 4,
        quizzesPassed: 0,
        totalQuizzes: 1
      }
    ]
  },
  {
    walletAddress: "3xNweLHLqrxN9QwHqJqkqJqkqJqkqJqkqJqkqJqkqJqk",
    displayName: "BlockchainBabe",
    rank: 5,
    totalScore: 2320,
    coursesCompleted: 3,
    totalLessons: 12,
    totalQuizzes: 8,
    averageQuizScore: 84.8,
    badgesEarned: 3,
    joinDate: "2024-03-01",
    lastActive: "2024-12-19T06:15:00Z",
    squad: "hoodie-creators",
    achievements: [],
    courseProgress: [
      {
        courseId: "wallet-wizardry",
        courseName: "Wallet Wizardry",
        progress: 100,
        score: 82,
        completed: true,
        completedDate: "2024-03-15",
        lessonsCompleted: 4,
        totalLessons: 4,
        quizzesPassed: 1,
        totalQuizzes: 1
      },
      {
        courseId: "nft-mastery",
        courseName: "NFT Mastery",
        progress: 100,
        score: 86,
        completed: true,
        completedDate: "2024-04-25",
        lessonsCompleted: 4,
        totalLessons: 4,
        quizzesPassed: 1,
        totalQuizzes: 1
      },
      {
        courseId: "meme-coin-mania",
        courseName: "Meme Coin Mania",
        progress: 100,
        score: 88,
        completed: true,
        completedDate: "2024-06-01",
        lessonsCompleted: 4,
        totalLessons: 4,
        quizzesPassed: 1,
        totalQuizzes: 1
      },
      {
        courseId: "community-strategy",
        courseName: "Community Strategy",
        progress: 50,
        score: 0,
        completed: false,
        lessonsCompleted: 2,
        totalLessons: 4,
        quizzesPassed: 0,
        totalQuizzes: 1
      },
      {
        courseId: "sns",
        courseName: "SNS Simplified",
        progress: 0,
        score: 0,
        completed: false,
        lessonsCompleted: 0,
        totalLessons: 2,
        quizzesPassed: 0,
        totalQuizzes: 1
      },
      {
        courseId: "technical-analysis",
        courseName: "Technical Analysis Tactics",
        progress: 0,
        score: 0,
        completed: false,
        lessonsCompleted: 0,
        totalLessons: 4,
        quizzesPassed: 0,
        totalQuizzes: 1
      }
    ]
  }
];

// Helper function to calculate user score based on performance
export const calculateUserScore = (user: LeaderboardUser): number => {
  let score = 0;
  
  // Base points for completed courses
  score += user.coursesCompleted * 300;
  
  // Points for lessons completed
  score += user.totalLessons * 50;
  
  // Points for quiz performance
  score += user.totalQuizzes * 100;
  score += Math.round(user.averageQuizScore * 10);
  
  // Points for badges
  score += user.badgesEarned * 150;
  
  // Points for achievements
  score += user.achievements.reduce((acc, achievement) => acc + achievement.points, 0);
  
  // Bonus for consistency (days since joining)
  const daysSinceJoining = Math.floor((Date.now() - new Date(user.joinDate).getTime()) / (1000 * 60 * 60 * 24));
  score += Math.min(daysSinceJoining * 5, 500); // Max 500 points for consistency
  
  return score;
};

// Helper function to get user rank
export const getUserRank = (walletAddress: string): number => {
  const user = mockLeaderboardData.find(u => u.walletAddress === walletAddress);
  return user ? user.rank : -1;
};

// Helper function to get top 20 users
export const getTop20Users = (): LeaderboardUser[] => {
  return mockLeaderboardData.slice(0, 20);
};

// Helper function to update user progress (for when courses are completed)
export const updateUserProgress = (
  walletAddress: string, 
  courseId: string, 
  progress: number, 
  score: number,
  completed: boolean
): void => {
  const userIndex = mockLeaderboardData.findIndex(u => u.walletAddress === walletAddress);
  
  if (userIndex !== -1) {
    const user = mockLeaderboardData[userIndex];
    const courseIndex = user.courseProgress.findIndex(c => c.courseId === courseId);
    
    if (courseIndex !== -1) {
      user.courseProgress[courseIndex] = {
        ...user.courseProgress[courseIndex],
        progress,
        score,
        completed,
        completedDate: completed ? new Date().toISOString() : undefined
      };
      
      // Recalculate user stats
      user.coursesCompleted = user.courseProgress.filter(c => c.completed).length;
      user.totalLessons = user.courseProgress.reduce((acc, c) => acc + c.lessonsCompleted, 0);
      user.totalQuizzes = user.courseProgress.reduce((acc, c) => acc + c.quizzesPassed, 0);
      user.averageQuizScore = user.courseProgress
        .filter(c => c.score > 0)
        .reduce((acc, c) => acc + c.score, 0) / Math.max(user.courseProgress.filter(c => c.score > 0).length, 1);
      
      // Recalculate total score
      user.totalScore = calculateUserScore(user);
      
      // Update last active
      user.lastActive = new Date().toISOString();
    }
  }
}; 