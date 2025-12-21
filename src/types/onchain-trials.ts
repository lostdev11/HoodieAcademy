export type PredictionType = 
  | 'beat_median_score'
  | 'complete_under_time';

export interface Prediction {
  id?: string;
  wallet: string;
  predictionType: PredictionType;
  stakeAmount: number; // in SOL
  lockedAt?: string;
  result?: 'win' | 'loss' | 'pending';
  createdAt?: string;
}

export interface LeaderboardEntry {
  id: string;
  wallet: string;
  username: string | null;
  best_score: number;
  success_rate: number;
  streak: number;
  created_at: string;
}

export interface PlayerStats {
  wallet: string;
  username: string | null;
  totalGames: number;
  totalWins: number;
  bestScoreMs: number | null;
  currentStreak: number;
  longestStreak: number;
  successRate: number; // percentage
  createdAt?: string;
  updatedAt?: string;
}

