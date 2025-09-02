import { createClient } from '@supabase/supabase-js';

export interface Bounty {
  id: string;
  title: string;
  short_desc?: string;
  squad_tag?: string;
  reward?: string;
  deadline?: string;
  status: 'active' | 'completed' | 'expired' | 'draft';
  hidden: boolean;
  submissions: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBountyData {
  title: string;
  short_desc?: string;
  squad_tag?: string;
  reward?: string;
  deadline?: string;
  status?: string;
  hidden?: boolean;
}

export interface UpdateBountyData {
  title?: string;
  short_desc?: string;
  squad_tag?: string;
  reward?: string;
  deadline?: string;
  status?: string;
  hidden?: boolean;
}

class BountyService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  /**
   * Set the authenticated user session
   */
  setAuthSession(session: any) {
    if (session?.access_token) {
      this.supabase.auth.setSession(session);
    }
  }

  /**
   * Get all bounties
   */
  async getBounties(): Promise<Bounty[]> {
    try {
      const { data, error } = await this.supabase
        .from('bounties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bounties:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getBounties:', error);
      return [];
    }
  }

  /**
   * Get bounty by ID
   */
  async getBountyById(id: string): Promise<Bounty | null> {
    try {
      const { data, error } = await this.supabase
        .from('bounties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching bounty:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getBountyById:', error);
      return null;
    }
  }

  /**
   * Create a new bounty
   */
  async createBounty(bountyData: CreateBountyData, walletAddress?: string): Promise<Bounty | null> {
    try {
      // If wallet address is provided, we need to authenticate the user first
      if (walletAddress) {
        // Get the user's session by signing a message
        const message = `Authenticate bounty creation: ${Date.now()}`;
        const encodedMessage = new TextEncoder().encode(message);
        
        // This would require the wallet to sign a message
        // For now, we'll use a different approach - create the bounty with the wallet address
        const bountyWithCreator = {
          ...bountyData,
          created_by: walletAddress // Store wallet address as created_by
        };
        
        const { data, error } = await this.supabase
          .from('bounties')
          .insert([bountyWithCreator])
          .select()
          .single();

        if (error) {
          console.error('Error creating bounty:', error);
          throw error;
        }

        return data;
      } else {
        // Fallback to original method
        const { data, error } = await this.supabase
          .from('bounties')
          .insert([bountyData])
          .select()
          .single();

        if (error) {
          console.error('Error creating bounty:', error);
          throw error;
        }

        return data;
      }
    } catch (error) {
      console.error('Error in createBounty:', error);
      return null;
    }
  }

  /**
   * Update a bounty
   */
  async updateBounty(id: string, bountyData: UpdateBountyData): Promise<Bounty | null> {
    try {
      const { data, error } = await this.supabase
        .from('bounties')
        .update({ ...bountyData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating bounty:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateBounty:', error);
      return null;
    }
  }

  /**
   * Delete a bounty
   */
  async deleteBounty(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('bounties')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting bounty:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteBounty:', error);
      return false;
    }
  }

  /**
   * Toggle bounty visibility
   */
  async toggleBountyVisibility(id: string): Promise<Bounty | null> {
    try {
      const bounty = await this.getBountyById(id);
      if (!bounty) return null;

      const newHiddenState = !bounty.hidden;
      return await this.updateBounty(id, { hidden: newHiddenState });
    } catch (error) {
      console.error('Error in toggleBountyVisibility:', error);
      return null;
    }
  }

  /**
   * Get bounties by squad
   */
  async getBountiesBySquad(squad: string): Promise<Bounty[]> {
    try {
      const { data, error } = await this.supabase
        .from('bounties')
        .select('*')
        .eq('squad_tag', squad)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bounties by squad:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getBountiesBySquad:', error);
      return [];
    }
  }

  /**
   * Get bounties by status
   */
  async getBountiesByStatus(status: string): Promise<Bounty[]> {
    try {
      const { data, error } = await this.supabase
        .from('bounties')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bounties by status:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getBountiesByStatus:', error);
      return [];
    }
  }

  /**
   * Search bounties
   */
  async searchBounties(searchTerm: string): Promise<Bounty[]> {
    try {
      const { data, error } = await this.supabase
        .from('bounties')
        .select('*')
        .or(`title.ilike.%${searchTerm}%,short_desc.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching bounties:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchBounties:', error);
      return [];
    }
  }
}

export const bountyService = new BountyService();
export default bountyService;

