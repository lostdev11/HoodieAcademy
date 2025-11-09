-- Create starter_pack_claims table for Web3 Starter Pack feature
-- This table tracks claims, payments, approvals, and deliveries

CREATE TABLE IF NOT EXISTS starter_pack_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'delivered', 'failed')),
  
  -- Payment information
  payment_tx_signature TEXT,
  payment_amount_sol NUMERIC(18, 9) NOT NULL DEFAULT 0.05,
  treasury_wallet TEXT NOT NULL,
  payment_verified BOOLEAN DEFAULT FALSE,
  payment_verified_at TIMESTAMPTZ,
  
  -- Admin actions
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  rejected_by TEXT,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Delivery information (idempotent with tx ids)
  domain_tx_signature TEXT,
  sol_send_tx_signature TEXT,
  nft_mint_tx_signature TEXT,
  delivery_started_at TIMESTAMPTZ,
  delivery_completed_at TIMESTAMPTZ,
  delivery_error TEXT,
  
  -- Rewards delivered
  domain_name TEXT,
  sol_amount_sent NUMERIC(18, 9),
  nft_mint_address TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(wallet_address) -- One claim per wallet
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_starter_pack_claims_wallet ON starter_pack_claims(wallet_address);
CREATE INDEX IF NOT EXISTS idx_starter_pack_claims_status ON starter_pack_claims(status);
CREATE INDEX IF NOT EXISTS idx_starter_pack_claims_created_at ON starter_pack_claims(created_at DESC);

-- Enable RLS
ALTER TABLE starter_pack_claims ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own claims
-- Note: This allows viewing if the wallet matches or if user is admin
-- Adjust based on your auth setup
CREATE POLICY "Users can view their own claims"
  ON starter_pack_claims
  FOR SELECT
  USING (true); -- Allow all reads for now - adjust based on your auth needs

-- Policy: Users can create their own claims
-- Note: This allows any wallet to create a claim
-- The API will enforce one claim per wallet
CREATE POLICY "Users can create their own claims"
  ON starter_pack_claims
  FOR INSERT
  WITH CHECK (true); -- Allow all inserts - API enforces business logic

-- Policy: Only admins can update claims
-- Note: This allows updates - API will verify admin status
CREATE POLICY "Admins can update claims"
  ON starter_pack_claims
  FOR UPDATE
  USING (true) -- Allow all updates - API enforces admin check
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_starter_pack_claims_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_starter_pack_claims_updated_at
  BEFORE UPDATE ON starter_pack_claims
  FOR EACH ROW
  EXECUTE FUNCTION update_starter_pack_claims_updated_at();

