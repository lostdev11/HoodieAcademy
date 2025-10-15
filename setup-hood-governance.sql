-- =========================================
-- HOOD GOVERNANCE SYSTEM
-- =========================================
-- Complete governance system for $HOOD token
-- Includes proposals, voting, tokenomics, and unlock mechanisms
-- =========================================

-- =========================================
-- 1. TOKEN ALLOCATIONS TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS hood_token_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_name TEXT NOT NULL,
  allocation_type TEXT NOT NULL, -- 'founder', 'community', 'bonding_curve', 'partnerships'
  total_tokens BIGINT NOT NULL,
  locked_tokens BIGINT NOT NULL,
  unlocked_tokens BIGINT DEFAULT 0,
  percentage DECIMAL(5,2) NOT NULL,
  unlock_method TEXT NOT NULL, -- 'governance', 'immediate', 'vesting'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial allocations
INSERT INTO hood_token_allocations (allocation_name, allocation_type, total_tokens, locked_tokens, percentage, unlock_method, description) VALUES
('Founder Vault', 'founder', 600000000, 600000000, 60.00, 'governance', 'Long-term control & sustainability - unlocks via governance votes'),
('Community Vault', 'community', 200000000, 200000000, 20.00, 'governance', 'Academy rewards, XP conversion, quest bounties'),
('Bonding Curve Launch', 'bonding_curve', 150000000, 0, 15.00, 'immediate', 'Public liquidity on Jupiter'),
('Partnerships & Collabs', 'partnerships', 50000000, 50000000, 5.00, 'vesting', 'Ecosystem growth, DAO alliances')
ON CONFLICT DO NOTHING;

-- =========================================
-- 2. GOVERNANCE PROPOSALS TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS governance_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_number SERIAL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  proposal_type TEXT NOT NULL, -- 'unlock', 'course', 'reward', 'policy', 'treasury'
  
  -- Proposal details
  requested_unlock_amount BIGINT DEFAULT 0,
  target_allocation TEXT, -- Which vault to unlock from
  
  -- Status tracking
  status TEXT DEFAULT 'active', -- 'active', 'passed', 'rejected', 'executed', 'cancelled'
  
  -- Vote counts
  votes_for BIGINT DEFAULT 0,
  votes_against BIGINT DEFAULT 0,
  total_voting_power BIGINT DEFAULT 0,
  
  -- Voting period
  voting_starts_at TIMESTAMPTZ DEFAULT NOW(),
  voting_ends_at TIMESTAMPTZ NOT NULL,
  
  -- Execution
  executed_at TIMESTAMPTZ,
  executed_by TEXT,
  execution_tx_hash TEXT,
  
  -- Metadata
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(proposal_number)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_proposals_status ON governance_proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_created_by ON governance_proposals(created_by);
CREATE INDEX IF NOT EXISTS idx_proposals_voting_ends ON governance_proposals(voting_ends_at);

-- =========================================
-- 3. GOVERNANCE VOTES TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS governance_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES governance_proposals(id) ON DELETE CASCADE,
  voter_wallet TEXT NOT NULL,
  
  -- Vote details
  vote_choice TEXT NOT NULL, -- 'for', 'against', 'abstain'
  voting_power BIGINT NOT NULL,
  
  -- Vote calculation breakdown
  hood_balance BIGINT DEFAULT 0,
  xp_amount INTEGER DEFAULT 0,
  calculated_power BIGINT NOT NULL,
  
  -- Metadata
  vote_tx_hash TEXT,
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(proposal_id, voter_wallet)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_votes_proposal ON governance_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter ON governance_votes(voter_wallet);

-- =========================================
-- 4. TOKEN UNLOCK HISTORY TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS hood_unlock_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_id UUID REFERENCES hood_token_allocations(id),
  proposal_id UUID REFERENCES governance_proposals(id),
  
  -- Unlock details
  unlock_amount BIGINT NOT NULL,
  unlock_reason TEXT NOT NULL,
  unlock_type TEXT NOT NULL, -- 'governance', 'vesting', 'manual'
  
  -- Execution
  executed_by TEXT NOT NULL,
  execution_tx_hash TEXT,
  
  -- Metadata
  unlocked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index
CREATE INDEX IF NOT EXISTS idx_unlock_history_allocation ON hood_unlock_history(allocation_id);

-- =========================================
-- 5. USER TOKEN BALANCES TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS hood_user_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL UNIQUE,
  
  -- Token amounts
  hood_balance BIGINT DEFAULT 0,
  locked_hood BIGINT DEFAULT 0,
  
  -- Derived from XP
  xp_amount INTEGER DEFAULT 0,
  
  -- Total voting power (calculated)
  voting_power BIGINT DEFAULT 0,
  
  -- Metadata
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index
CREATE INDEX IF NOT EXISTS idx_hood_balances_wallet ON hood_user_balances(wallet_address);

-- =========================================
-- 6. FUNCTION: CALCULATE VOTING POWER
-- =========================================

CREATE OR REPLACE FUNCTION calculate_voting_power(
  p_hood_balance BIGINT,
  p_xp_amount INTEGER
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
  v_hood_power DECIMAL;
  v_xp_power DECIMAL;
  v_total_power BIGINT;
BEGIN
  -- Formula: 0.5 × HOOD + 0.5 × (XP × 0.001)
  v_hood_power := p_hood_balance * 0.5;
  v_xp_power := (p_xp_amount * 0.001) * 0.5;
  v_total_power := FLOOR(v_hood_power + v_xp_power);
  
  RETURN v_total_power;
END;
$$;

-- =========================================
-- 7. FUNCTION: GET USER VOTING POWER
-- =========================================

CREATE OR REPLACE FUNCTION get_user_voting_power(
  p_wallet_address TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_hood_balance BIGINT := 0;
  v_xp_amount INTEGER := 0;
  v_voting_power BIGINT;
BEGIN
  -- Get HOOD balance
  SELECT COALESCE(hood_balance, 0) INTO v_hood_balance
  FROM hood_user_balances
  WHERE wallet_address = p_wallet_address;
  
  -- Get XP from users table
  SELECT COALESCE(xp, 0) INTO v_xp_amount
  FROM users
  WHERE wallet_address = p_wallet_address;
  
  -- Calculate voting power
  v_voting_power := calculate_voting_power(v_hood_balance, v_xp_amount);
  
  RETURN jsonb_build_object(
    'wallet_address', p_wallet_address,
    'hood_balance', v_hood_balance,
    'xp_amount', v_xp_amount,
    'voting_power', v_voting_power,
    'hood_contribution', FLOOR(v_hood_balance * 0.5),
    'xp_contribution', FLOOR((v_xp_amount * 0.001) * 0.5)
  );
END;
$$;

-- =========================================
-- 8. FUNCTION: CAST VOTE
-- =========================================

CREATE OR REPLACE FUNCTION cast_governance_vote(
  p_proposal_id UUID,
  p_voter_wallet TEXT,
  p_vote_choice TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_proposal RECORD;
  v_voting_power BIGINT;
  v_hood_balance BIGINT;
  v_xp_amount INTEGER;
  v_existing_vote RECORD;
BEGIN
  -- Check if proposal exists and is active
  SELECT * INTO v_proposal
  FROM governance_proposals
  WHERE id = p_proposal_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Proposal not found');
  END IF;
  
  IF v_proposal.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Proposal is not active');
  END IF;
  
  IF NOW() > v_proposal.voting_ends_at THEN
    RETURN jsonb_build_object('success', false, 'error', 'Voting period has ended');
  END IF;
  
  -- Get voting power
  SELECT 
    (power->>'hood_balance')::BIGINT,
    (power->>'xp_amount')::INTEGER,
    (power->>'voting_power')::BIGINT
  INTO v_hood_balance, v_xp_amount, v_voting_power
  FROM get_user_voting_power(p_voter_wallet) AS power;
  
  IF v_voting_power = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'No voting power');
  END IF;
  
  -- Check for existing vote
  SELECT * INTO v_existing_vote
  FROM governance_votes
  WHERE proposal_id = p_proposal_id AND voter_wallet = p_voter_wallet;
  
  IF FOUND THEN
    -- Update existing vote
    -- First, remove old vote from proposal counts
    IF v_existing_vote.vote_choice = 'for' THEN
      UPDATE governance_proposals
      SET votes_for = votes_for - v_existing_vote.voting_power,
          total_voting_power = total_voting_power - v_existing_vote.voting_power
      WHERE id = p_proposal_id;
    ELSIF v_existing_vote.vote_choice = 'against' THEN
      UPDATE governance_proposals
      SET votes_against = votes_against - v_existing_vote.voting_power,
          total_voting_power = total_voting_power - v_existing_vote.voting_power
      WHERE id = p_proposal_id;
    END IF;
    
    -- Update vote record
    UPDATE governance_votes
    SET vote_choice = p_vote_choice,
        voting_power = v_voting_power,
        hood_balance = v_hood_balance,
        xp_amount = v_xp_amount,
        calculated_power = v_voting_power,
        voted_at = NOW()
    WHERE id = v_existing_vote.id;
  ELSE
    -- Insert new vote
    INSERT INTO governance_votes (
      proposal_id, voter_wallet, vote_choice, voting_power,
      hood_balance, xp_amount, calculated_power
    ) VALUES (
      p_proposal_id, p_voter_wallet, p_vote_choice, v_voting_power,
      v_hood_balance, v_xp_amount, v_voting_power
    );
  END IF;
  
  -- Update proposal vote counts
  IF p_vote_choice = 'for' THEN
    UPDATE governance_proposals
    SET votes_for = votes_for + v_voting_power,
        total_voting_power = total_voting_power + v_voting_power,
        updated_at = NOW()
    WHERE id = p_proposal_id;
  ELSIF p_vote_choice = 'against' THEN
    UPDATE governance_proposals
    SET votes_against = votes_against + v_voting_power,
        total_voting_power = total_voting_power + v_voting_power,
        updated_at = NOW()
    WHERE id = p_proposal_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'proposal_id', p_proposal_id,
    'voter', p_voter_wallet,
    'vote_choice', p_vote_choice,
    'voting_power', v_voting_power
  );
END;
$$;

-- =========================================
-- 9. FUNCTION: FINALIZE PROPOSAL
-- =========================================

CREATE OR REPLACE FUNCTION finalize_proposal(
  p_proposal_id UUID,
  p_admin_wallet TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_proposal RECORD;
  v_is_admin BOOLEAN;
  v_result TEXT;
BEGIN
  -- Check admin status
  SELECT is_admin INTO v_is_admin
  FROM users
  WHERE wallet_address = p_admin_wallet;
  
  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin access required');
  END IF;
  
  -- Get proposal
  SELECT * INTO v_proposal
  FROM governance_proposals
  WHERE id = p_proposal_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Proposal not found');
  END IF;
  
  IF v_proposal.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Proposal already finalized');
  END IF;
  
  -- Determine result (simple majority)
  IF v_proposal.votes_for > v_proposal.votes_against THEN
    v_result := 'passed';
  ELSE
    v_result := 'rejected';
  END IF;
  
  -- Update proposal status
  UPDATE governance_proposals
  SET status = v_result,
      updated_at = NOW()
  WHERE id = p_proposal_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'proposal_id', p_proposal_id,
    'result', v_result,
    'votes_for', v_proposal.votes_for,
    'votes_against', v_proposal.votes_against
  );
END;
$$;

-- =========================================
-- 10. GRANT PERMISSIONS
-- =========================================

GRANT SELECT ON hood_token_allocations TO authenticated, anon;
GRANT SELECT ON governance_proposals TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON governance_votes TO authenticated;
GRANT SELECT ON hood_unlock_history TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON hood_user_balances TO authenticated;

-- =========================================
-- 11. VERIFICATION QUERIES
-- =========================================

-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'hood%' OR table_name LIKE 'governance%'
ORDER BY table_name;

-- Check allocations
SELECT 
  allocation_name,
  total_tokens,
  locked_tokens,
  unlocked_tokens,
  percentage
FROM hood_token_allocations
ORDER BY percentage DESC;

-- =========================================
-- ✅ COMPLETE!
-- =========================================
-- HOOD Governance system is ready:
-- ✅ Token allocations tracking
-- ✅ Proposal creation and management
-- ✅ Voting with power calculation
-- ✅ Unlock history tracking
-- ✅ User balance management
-- =========================================

