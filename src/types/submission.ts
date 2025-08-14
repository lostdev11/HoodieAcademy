export interface Submission {
  id: string;
  title: string;
  description: string;
  squad: string;
  courseRef?: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  upvotes?: Record<string, Array<{ walletAddress: string; squad: string; timestamp: string }>>;
  totalUpvotes?: number;
  imageUrl?: string;
  author?: string;
  walletAddress?: string;
}

export interface SubmissionUpvote {
  walletAddress: string;
  squad: string;
  timestamp: string;
}

export interface SubmissionStats {
  totalSubmissions: number;
  totalUpvotes: number;
  squadFavorites: number;
  trendingSubmissions: number;
} 