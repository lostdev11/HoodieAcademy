export interface BountyXPConfig {
  participationXP: number;
  maxSubmissionsPerBounty: number;
  winnerBonuses: {
    first: { xp: number; sol: number };
    second: { xp: number; sol: number };
    third: { xp: number; sol: number };
  };
}

export interface BountySubmission {
  id: string;
  walletAddress: string;
  bountyId: string;
  timestamp: string;
  placement?: 'first' | 'second' | 'third';
}

export interface BountyXPResult {
  totalXP: number;
  participationXP: number;
  bonusXP: number;
  solPrize?: number;
  placement?: 'first' | 'second' | 'third';
}

export class BountyXPService {
  private static instance: BountyXPService;
  private config: BountyXPConfig;

  constructor() {
    this.config = {
      participationXP: 10,
      maxSubmissionsPerBounty: 3,
      winnerBonuses: {
        first: { xp: 250, sol: 0.05 },
        second: { xp: 100, sol: 0.03 },
        third: { xp: 50, sol: 0.02 }
      }
    };
  }

  public static getInstance(): BountyXPService {
    if (!BountyXPService.instance) {
      BountyXPService.instance = new BountyXPService();
    }
    return BountyXPService.instance;
  }

  /**
   * Calculate XP for a user's bounty participation
   */
  public calculateBountyXP(
    userSubmissions: BountySubmission[],
    bountyId: string,
    placement?: 'first' | 'second' | 'third'
  ): BountyXPResult {
    // Count submissions for this specific bounty
    const bountySubmissions = userSubmissions.filter(
      sub => sub.bountyId === bountyId
    );

    // Calculate participation XP (max 30 XP)
    const submissionCount = Math.min(
      bountySubmissions.length,
      this.config.maxSubmissionsPerBounty
    );
    const participationXP = submissionCount * this.config.participationXP;

    // Calculate bonus XP for winners
    let bonusXP = 0;
    let solPrize: number | undefined;

    if (placement) {
      const bonus = this.config.winnerBonuses[placement];
      bonusXP = bonus.xp;
      solPrize = bonus.sol;
    }

    const totalXP = participationXP + bonusXP;

    return {
      totalXP,
      participationXP,
      bonusXP,
      solPrize,
      placement
    };
  }

  /**
   * Award XP for a new bounty submission
   */
  public awardSubmissionXP(
    walletAddress: string,
    bountyId: string,
    existingSubmissions: BountySubmission[]
  ): number {
    const userSubmissions = existingSubmissions.filter(
      sub => sub.walletAddress === walletAddress && sub.bountyId === bountyId
    );

    // Check if user has already reached max submissions
    if (userSubmissions.length >= this.config.maxSubmissionsPerBounty) {
      return 0;
    }

    return this.config.participationXP;
  }

  /**
   * Award winner bonuses
   */
  public awardWinnerBonus(
    placement: 'first' | 'second' | 'third'
  ): { xp: number; sol: number } {
    return this.config.winnerBonuses[placement];
  }

  /**
   * Get XP breakdown for display
   */
  public getXPBreakdown(
    userSubmissions: BountySubmission[],
    bountyId: string,
    walletAddress: string,
    placement?: 'first' | 'second' | 'third'
  ): {
    participation: number;
    bonus: number;
    total: number;
    solPrize?: number;
    maxSubmissionsReached: boolean;
  } {
    const bountySubmissions = userSubmissions.filter(
      sub => sub.walletAddress === walletAddress && sub.bountyId === bountyId
    );

    const participation = Math.min(
      bountySubmissions.length,
      this.config.maxSubmissionsPerBounty
    ) * this.config.participationXP;

    const bonus = placement ? this.config.winnerBonuses[placement].xp : 0;
    const solPrize = placement ? this.config.winnerBonuses[placement].sol : undefined;

    return {
      participation,
      bonus,
      total: participation + bonus,
      solPrize,
      maxSubmissionsReached: bountySubmissions.length >= this.config.maxSubmissionsPerBounty
    };
  }

  /**
   * Validate if user can submit to bounty
   */
  public canSubmitToBounty(
    walletAddress: string,
    bountyId: string,
    existingSubmissions: BountySubmission[]
  ): boolean {
    const userSubmissions = existingSubmissions.filter(
      sub => sub.walletAddress === walletAddress && sub.bountyId === bountyId
    );

    return userSubmissions.length < this.config.maxSubmissionsPerBounty;
  }

  /**
   * Get XP rules for display
   */
  public getXPRules(): BountyXPConfig {
    return { ...this.config };
  }
}

export const bountyXPService = BountyXPService.getInstance(); 