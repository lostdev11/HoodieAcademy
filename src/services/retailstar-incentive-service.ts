export interface RetailstarReward {
  id: string;
  type: 'retail_ticket' | 'domain_pfp' | 'landing_page' | 'lore_access' | 'asset_pack' | 'spotlight' | 'role_upgrade';
  name: string;
  description: string;
  squadAlignment: string[];
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  requirements: {
    minSubmissions?: number;
    minPlacement?: 'first' | 'second' | 'third';
    squadSpecific?: string[];
    specialCriteria?: string;
  };
  metadata?: {
    domainName?: string;
    bannerDesign?: string;
    assetPackSize?: number;
    spotlightDuration?: number;
    roleBadge?: string;
  };
}

export interface RetailstarIncentiveConfig {
  rewards: RetailstarReward[];
  tieredBonuses: {
    basic: RetailstarReward[];
    excellent: RetailstarReward[];
    creative: RetailstarReward[];
  };
}

export interface UserRetailstarReward {
  id: string;
  walletAddress: string;
  rewardId: string;
  awardedAt: string;
  status: 'pending' | 'active' | 'redeemed' | 'expired';
  metadata?: Record<string, any>;
}

export class RetailstarIncentiveService {
  private static instance: RetailstarIncentiveService;
  private config: RetailstarIncentiveConfig;

  constructor() {
    this.config = {
      rewards: [
        {
          id: 'retail_ticket_1',
          type: 'retail_ticket',
          name: '🎟️ Retail Ticket',
          description: 'Entry into raffles, future domain deals, or special mall events',
          squadAlignment: ['creators', 'speakers', 'decoders', 'raiders'],
          rarity: 'common',
          requirements: { minSubmissions: 1 }
        },
        {
          id: 'domain_pfp_upgrade',
          type: 'domain_pfp',
          name: '🪪 Domain PFP Upgrade',
          description: 'Custom banner + PFP design tied to a .sol domain',
          squadAlignment: ['creators', 'speakers'],
          rarity: 'uncommon',
          requirements: { minSubmissions: 2, minPlacement: 'second' }
        },
        {
          id: 'landing_page_build',
          type: 'landing_page',
          name: '🧱 1-Page Landing Page Build',
          description: 'Fully built landing site for their own project or personal identity',
          squadAlignment: ['creators', 'decoders'],
          rarity: 'rare',
          requirements: { minSubmissions: 3, minPlacement: 'first' }
        },
        {
          id: 'lore_access',
          type: 'lore_access',
          name: '🔐 Hidden Lore Access',
          description: 'Reveal secret rooms in Retailstar Mall or unlock cipher-gated paths',
          squadAlignment: ['raiders', 'decoders'],
          rarity: 'epic',
          requirements: { minSubmissions: 2, minPlacement: 'first', specialCriteria: 'puzzle_solver' }
        },
        {
          id: 'asset_pack',
          type: 'asset_pack',
          name: '📦 Mallcore Asset Pack',
          description: 'Pre-built design assets (icons, buttons, templates) for their own use',
          squadAlignment: ['creators'],
          rarity: 'uncommon',
          requirements: { minSubmissions: 1, minPlacement: 'second' }
        },
        {
          id: 'spotlight',
          type: 'spotlight',
          name: '📣 Public Spotlight',
          description: 'Featured in Academy post or quoted in homepage banner',
          squadAlignment: ['speakers'],
          rarity: 'rare',
          requirements: { minSubmissions: 2, minPlacement: 'first' }
        },
        {
          id: 'role_upgrade',
          type: 'role_upgrade',
          name: '🧢 Squad Role Upgrade',
          description: 'Early access to special squad badges or emoji flair',
          squadAlignment: ['creators', 'speakers', 'decoders', 'raiders'],
          rarity: 'common',
          requirements: { minSubmissions: 1 }
        }
      ],
      tieredBonuses: {
        basic: [
          {
            id: 'basic_retail_ticket',
            type: 'retail_ticket',
            name: '🎟️ Basic Retail Ticket',
            description: 'Entry into basic raffles and events',
            squadAlignment: ['creators', 'speakers', 'decoders', 'raiders'],
            rarity: 'common',
            requirements: { minSubmissions: 1 }
          }
        ],
        excellent: [
          {
            id: 'excellent_domain_banner',
            type: 'domain_pfp',
            name: '🪪 Domain Banner + PFP',
            description: 'Custom banner design with PFP upgrade',
            squadAlignment: ['creators', 'speakers'],
            rarity: 'uncommon',
            requirements: { minSubmissions: 2, minPlacement: 'second' }
          },
          {
            id: 'excellent_role_badge',
            type: 'role_upgrade',
            name: '🧢 Discord Role Badge',
            description: 'Special Discord role with custom badge',
            squadAlignment: ['creators', 'speakers', 'decoders', 'raiders'],
            rarity: 'uncommon',
            requirements: { minSubmissions: 1, minPlacement: 'second' }
          }
        ],
        creative: [
          {
            id: 'creative_landing_page',
            type: 'landing_page',
            name: '🧱 1-Page Landing Site',
            description: 'Custom landing page for personal project',
            squadAlignment: ['creators', 'decoders'],
            rarity: 'rare',
            requirements: { minSubmissions: 3, minPlacement: 'first' }
          },
          {
            id: 'creative_lore_unlock',
            type: 'lore_access',
            name: '🔐 Lore Cipher Unlock',
            description: 'Access to encrypted lore content',
            squadAlignment: ['raiders', 'decoders'],
            rarity: 'epic',
            requirements: { minSubmissions: 2, minPlacement: 'first' }
          }
        ]
      }
    };
  }

  public static getInstance(): RetailstarIncentiveService {
    if (!RetailstarIncentiveService.instance) {
      RetailstarIncentiveService.instance = new RetailstarIncentiveService();
    }
    return RetailstarIncentiveService.instance;
  }

  /**
   * Calculate available rewards for a user based on their performance
   */
  public calculateAvailableRewards(
    walletAddress: string,
    userSquad: string,
    submissionCount: number,
    placement?: 'first' | 'second' | 'third',
    specialCriteria?: string[]
  ): RetailstarReward[] {
    const availableRewards: RetailstarReward[] = [];

    // Check all rewards against user criteria
    for (const reward of this.config.rewards) {
      if (this.isRewardEligible(reward, userSquad, submissionCount, placement, specialCriteria)) {
        availableRewards.push(reward);
      }
    }

    return availableRewards;
  }

  /**
   * Get tiered bonus rewards for task completion
   */
  public getTieredBonuses(
    performance: 'basic' | 'excellent' | 'creative',
    userSquad: string
  ): RetailstarReward[] {
    const tierRewards = this.config.tieredBonuses[performance];
    return tierRewards.filter(reward => 
      reward.squadAlignment.includes(userSquad)
    );
  }

  /**
   * Check if user is eligible for a specific reward
   */
  private isRewardEligible(
    reward: RetailstarReward,
    userSquad: string,
    submissionCount: number,
    placement?: 'first' | 'second' | 'third',
    specialCriteria?: string[]
  ): boolean {
    // Check squad alignment
    if (!reward.squadAlignment.includes(userSquad)) {
      return false;
    }

    // Check submission requirements
    if (reward.requirements.minSubmissions && submissionCount < reward.requirements.minSubmissions) {
      return false;
    }

    // Check placement requirements
    if (reward.requirements.minPlacement) {
      if (!placement) return false;
      
      const placementOrder = { first: 1, second: 2, third: 3 };
      const requiredOrder = placementOrder[reward.requirements.minPlacement];
      const actualOrder = placementOrder[placement];
      
      if (actualOrder > requiredOrder) {
        return false;
      }
    }

    // Check special criteria
    if (reward.requirements.specialCriteria && specialCriteria) {
      if (!specialCriteria.includes(reward.requirements.specialCriteria)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Award a reward to a user
   */
  public awardReward(
    walletAddress: string,
    rewardId: string,
    metadata?: Record<string, any>
  ): UserRetailstarReward {
    const reward = this.config.rewards.find(r => r.id === rewardId);
    if (!reward) {
      throw new Error(`Reward ${rewardId} not found`);
    }

    const userReward: UserRetailstarReward = {
      id: `user_reward_${Date.now()}`,
      walletAddress,
      rewardId,
      awardedAt: new Date().toISOString(),
      status: 'pending',
      metadata
    };

    return userReward;
  }

  /**
   * Award a retailstar reward to a user (for use in bounty/squad logic)
   */
  public async awardRetailstarReward({
    userId,
    taskId,
    squad,
    tier
  }: {
    userId: string;
    taskId: string;
    squad: string;
    tier: 'basic' | 'excellent' | 'creative';
  }): Promise<{ success: boolean; rewards?: string[]; error?: string }> {
    try {
      // Get tiered bonuses for this squad and tier
      const tierRewards = this.getTieredBonuses(tier, squad);
      
      if (tierRewards.length === 0) {
        return { success: false, error: 'No rewards available for this tier and squad' };
      }

      // Award each reward in the tier
      const awardedRewards: string[] = [];
      
      for (const reward of tierRewards) {
        try {
          const response = await fetch('/api/retailstar-rewards/claim', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              walletAddress: userId,
              rewardId: reward.id,
              metadata: {
                taskId,
                squad,
                tier,
                awardedAt: new Date().toISOString()
              }
            })
          });

          if (response.ok) {
            awardedRewards.push(reward.id);
          }
        } catch (error) {
          console.error(`Failed to award reward ${reward.id}:`, error);
        }
      }

      return {
        success: awardedRewards.length > 0,
        rewards: awardedRewards
      };
    } catch (error) {
      console.error('Error awarding retailstar rewards:', error);
      return { success: false, error: 'Failed to award rewards' };
    }
  }

  /**
   * Fetch claimed rewards for a user (for dashboard display)
   */
  public async fetchClaimedRewards(walletAddress: string): Promise<UserRetailstarReward[]> {
    try {
      const response = await fetch(`/api/retailstar-rewards/claim?walletAddress=${walletAddress}`);
      
      if (response.ok) {
        const data = await response.json();
        return data.rewards || [];
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching claimed rewards:', error);
      return [];
    }
  }

  /**
   * Get all rewards for a specific squad
   */
  public getSquadRewards(squadId: string): RetailstarReward[] {
    return this.config.rewards.filter(reward => 
      reward.squadAlignment.includes(squadId)
    );
  }

  /**
   * Get reward by ID
   */
  public getRewardById(rewardId: string): RetailstarReward | undefined {
    return this.config.rewards.find(reward => reward.id === rewardId);
  }

  /**
   * Get all available rewards
   */
  public getAllRewards(): RetailstarReward[] {
    return [...this.config.rewards];
  }

  /**
   * Get rewards by rarity
   */
  public getRewardsByRarity(rarity: string): RetailstarReward[] {
    return this.config.rewards.filter(reward => reward.rarity === rarity);
  }

  /**
   * Get rewards by type
   */
  public getRewardsByType(type: string): RetailstarReward[] {
    return this.config.rewards.filter(reward => reward.type === type);
  }

  /**
   * Get available rewards for a user based on their performance
   */
  public async getAvailableRewards(
    walletAddress: string,
    userSquad: string,
    submissionCount: number = 0,
    placement?: 'first' | 'second' | 'third'
  ): Promise<RetailstarReward[]> {
    try {
      const response = await fetch('/api/retailstar-rewards/available', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          userSquad,
          submissionCount,
          placement
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.rewards || [];
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching available rewards:', error);
      return [];
    }
  }
}

export const retailstarIncentiveService = RetailstarIncentiveService.getInstance(); 