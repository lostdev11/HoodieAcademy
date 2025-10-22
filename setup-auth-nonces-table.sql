-- ============================================
-- AUTH NONCES TABLE FOR REPLAY PROTECTION
-- ============================================
-- This table stores one-time nonces for signature verification
-- to prevent replay attacks on daily login claims

-- Create auth_nonces table
CREATE TABLE IF NOT EXISTS auth_nonces (
    id BIGSERIAL PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    nonce TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT nonce_unique UNIQUE (nonce)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_auth_nonces_wallet ON auth_nonces(wallet_address);
CREATE INDEX IF NOT EXISTS idx_auth_nonces_expires ON auth_nonces(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_nonces_used ON auth_nonces(used_at);
CREATE INDEX IF NOT EXISTS idx_auth_nonces_nonce ON auth_nonces(nonce) WHERE used_at IS NULL;

-- Add comment
COMMENT ON TABLE auth_nonces IS 'Stores one-time nonces for signature verification to prevent replay attacks';

-- ============================================
-- CLEANUP FUNCTION FOR EXPIRED NONCES
-- ============================================
-- Automatically delete expired nonces (older than 24 hours)

CREATE OR REPLACE FUNCTION cleanup_expired_nonces()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM auth_nonces
    WHERE expires_at < NOW() - INTERVAL '24 hours';
    
    RAISE NOTICE 'Cleaned up expired nonces';
END;
$$;

-- ============================================
-- FUNCTION TO GENERATE NEW NONCE
-- ============================================

CREATE OR REPLACE FUNCTION generate_auth_nonce(
    p_wallet_address TEXT
)
RETURNS TABLE (
    nonce TEXT,
    expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_nonce TEXT;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- Generate a random nonce (UUID v4)
    v_nonce := gen_random_uuid()::TEXT;
    
    -- Set expiration to 5 minutes from now
    v_expires_at := NOW() + INTERVAL '5 minutes';
    
    -- Insert the nonce
    INSERT INTO auth_nonces (wallet_address, nonce, expires_at)
    VALUES (p_wallet_address, v_nonce, v_expires_at);
    
    -- Return the nonce and expiration
    RETURN QUERY
    SELECT v_nonce, v_expires_at;
END;
$$;

-- ============================================
-- FUNCTION TO VERIFY AND MARK NONCE AS USED
-- ============================================

CREATE OR REPLACE FUNCTION verify_and_use_nonce(
    p_wallet_address TEXT,
    p_nonce TEXT
)
RETURNS TABLE (
    valid BOOLEAN,
    reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_nonce_record RECORD;
BEGIN
    -- Try to find and lock the nonce atomically
    SELECT * INTO v_nonce_record
    FROM auth_nonces
    WHERE nonce = p_nonce
    FOR UPDATE SKIP LOCKED;
    
    -- Check if nonce exists
    IF v_nonce_record IS NULL THEN
        RETURN QUERY SELECT FALSE, 'Nonce not found or already being used'::TEXT;
        RETURN;
    END IF;
    
    -- Check if nonce is already used
    IF v_nonce_record.used_at IS NOT NULL THEN
        RETURN QUERY SELECT FALSE, 'Nonce already used'::TEXT;
        RETURN;
    END IF;
    
    -- Check if nonce is expired
    IF v_nonce_record.expires_at < NOW() THEN
        RETURN QUERY SELECT FALSE, 'Nonce expired'::TEXT;
        RETURN;
    END IF;
    
    -- Check if wallet address matches
    IF v_nonce_record.wallet_address != p_wallet_address THEN
        RETURN QUERY SELECT FALSE, 'Wallet address mismatch'::TEXT;
        RETURN;
    END IF;
    
    -- Mark nonce as used atomically
    UPDATE auth_nonces
    SET used_at = NOW()
    WHERE nonce = p_nonce AND used_at IS NULL;
    
    -- Verify the update succeeded
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Nonce was used by another request'::TEXT;
        RETURN;
    END IF;
    
    -- Success
    RETURN QUERY SELECT TRUE, 'Nonce verified and marked as used'::TEXT;
END;
$$;

-- ============================================
-- SCHEDULED CLEANUP (Optional - requires pg_cron extension)
-- ============================================
-- Uncomment if you have pg_cron extension enabled

-- SELECT cron.schedule(
--     'cleanup-expired-nonces',
--     '0 * * * *', -- Run every hour
--     $$SELECT cleanup_expired_nonces();$$
-- );

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant access to authenticated users (adjust as needed)
-- GRANT SELECT, INSERT ON auth_nonces TO authenticated;
-- GRANT EXECUTE ON FUNCTION generate_auth_nonce(TEXT) TO authenticated;
-- GRANT EXECUTE ON FUNCTION verify_and_use_nonce(TEXT, TEXT) TO authenticated;

-- ============================================
-- TESTING QUERIES
-- ============================================

-- Test generating a nonce
-- SELECT * FROM generate_auth_nonce('test_wallet_address');

-- Test verifying a nonce
-- SELECT * FROM verify_and_use_nonce('test_wallet_address', 'your-nonce-here');

-- View all nonces
-- SELECT * FROM auth_nonces ORDER BY created_at DESC LIMIT 10;

-- Cleanup expired nonces manually
-- SELECT cleanup_expired_nonces();

