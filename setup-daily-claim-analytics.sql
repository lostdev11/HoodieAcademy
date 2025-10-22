-- ============================================
-- DAILY CLAIM ANALYTICS SYSTEM
-- ============================================
-- Tracks all daily claim attempts for analytics and economy tuning

-- Create analytics events table
CREATE TABLE IF NOT EXISTS daily_claim_analytics (
    id BIGSERIAL PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'claim_success', 'claim_rejected_already_claimed', 'signature_invalid', 'rate_limited', 'nonce_invalid'
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Success-specific data
    xp_awarded INTEGER,
    streak_days INTEGER,
    time_since_midnight_minutes INTEGER, -- Minutes since UTC midnight
    level_up BOOLEAN,
    new_level INTEGER,
    
    -- Request metadata
    device_info JSONB,
    ip_hash TEXT, -- Hashed IP for privacy
    user_agent TEXT,
    
    -- Rejection metadata
    rejection_reason TEXT,
    
    -- Performance metrics
    processing_time_ms INTEGER,
    
    -- Indexes for analytics
    CONSTRAINT valid_event_type CHECK (event_type IN (
        'claim_success',
        'claim_rejected_already_claimed',
        'signature_invalid',
        'rate_limited',
        'nonce_invalid',
        'nonce_expired',
        'nonce_used'
    ))
);

-- Create indexes for fast analytics queries
CREATE INDEX IF NOT EXISTS idx_daily_claim_analytics_timestamp ON daily_claim_analytics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_daily_claim_analytics_event_type ON daily_claim_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_daily_claim_analytics_wallet ON daily_claim_analytics(wallet_address);
CREATE INDEX IF NOT EXISTS idx_daily_claim_analytics_date ON daily_claim_analytics(DATE(timestamp));
CREATE INDEX IF NOT EXISTS idx_daily_claim_analytics_success ON daily_claim_analytics(event_type, timestamp) WHERE event_type = 'claim_success';

-- Add comments
COMMENT ON TABLE daily_claim_analytics IS 'Tracks all daily claim attempts for analytics and economy tuning';
COMMENT ON COLUMN daily_claim_analytics.time_since_midnight_minutes IS 'Minutes elapsed since UTC midnight when claim was made';
COMMENT ON COLUMN daily_claim_analytics.ip_hash IS 'SHA-256 hash of IP address for privacy-preserving analytics';

-- ============================================
-- ANALYTICS FUNCTIONS
-- ============================================

-- Function to log a claim event
CREATE OR REPLACE FUNCTION log_daily_claim_event(
    p_wallet_address TEXT,
    p_event_type TEXT,
    p_xp_awarded INTEGER DEFAULT NULL,
    p_streak_days INTEGER DEFAULT NULL,
    p_time_since_midnight_minutes INTEGER DEFAULT NULL,
    p_level_up BOOLEAN DEFAULT FALSE,
    p_new_level INTEGER DEFAULT NULL,
    p_device_info JSONB DEFAULT NULL,
    p_ip_hash TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_rejection_reason TEXT DEFAULT NULL,
    p_processing_time_ms INTEGER DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_id BIGINT;
BEGIN
    INSERT INTO daily_claim_analytics (
        wallet_address,
        event_type,
        xp_awarded,
        streak_days,
        time_since_midnight_minutes,
        level_up,
        new_level,
        device_info,
        ip_hash,
        user_agent,
        rejection_reason,
        processing_time_ms
    ) VALUES (
        p_wallet_address,
        p_event_type,
        p_xp_awarded,
        p_streak_days,
        p_time_since_midnight_minutes,
        p_level_up,
        p_new_level,
        p_device_info,
        p_ip_hash,
        p_user_agent,
        p_rejection_reason,
        p_processing_time_ms
    )
    RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$;

-- Get today's claim statistics
CREATE OR REPLACE FUNCTION get_daily_claim_stats_today()
RETURNS TABLE (
    total_claims BIGINT,
    unique_claimers BIGINT,
    successful_claims BIGINT,
    rejected_claims BIGINT,
    avg_time_to_claim_minutes NUMERIC,
    median_time_to_claim_minutes NUMERIC,
    total_xp_awarded BIGINT,
    avg_processing_time_ms NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_today_start TIMESTAMPTZ;
BEGIN
    v_today_start := DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC');
    
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT AS total_claims,
        COUNT(DISTINCT wallet_address)::BIGINT AS unique_claimers,
        COUNT(*) FILTER (WHERE event_type = 'claim_success')::BIGINT AS successful_claims,
        COUNT(*) FILTER (WHERE event_type != 'claim_success')::BIGINT AS rejected_claims,
        AVG(time_since_midnight_minutes) FILTER (WHERE event_type = 'claim_success') AS avg_time_to_claim_minutes,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY time_since_midnight_minutes) FILTER (WHERE event_type = 'claim_success') AS median_time_to_claim_minutes,
        COALESCE(SUM(xp_awarded), 0)::BIGINT AS total_xp_awarded,
        AVG(processing_time_ms) AS avg_processing_time_ms
    FROM daily_claim_analytics
    WHERE timestamp >= v_today_start;
END;
$$;

-- Get claim breakdown by event type (today)
CREATE OR REPLACE FUNCTION get_claim_event_breakdown_today()
RETURNS TABLE (
    event_type TEXT,
    count BIGINT,
    percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_today_start TIMESTAMPTZ;
    v_total_events BIGINT;
BEGIN
    v_today_start := DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC');
    
    SELECT COUNT(*) INTO v_total_events
    FROM daily_claim_analytics
    WHERE timestamp >= v_today_start;
    
    RETURN QUERY
    SELECT
        dca.event_type,
        COUNT(*)::BIGINT AS count,
        ROUND((COUNT(*)::NUMERIC / NULLIF(v_total_events, 0) * 100), 2) AS percentage
    FROM daily_claim_analytics dca
    WHERE timestamp >= v_today_start
    GROUP BY dca.event_type
    ORDER BY count DESC;
END;
$$;

-- Get top squads by claims today
CREATE OR REPLACE FUNCTION get_top_squads_by_claims_today(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    squad TEXT,
    total_claims BIGINT,
    unique_members BIGINT,
    total_xp_awarded BIGINT,
    avg_time_to_claim_minutes NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_today_start TIMESTAMPTZ;
BEGIN
    v_today_start := DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC');
    
    RETURN QUERY
    SELECT
        COALESCE(u.squad, 'No Squad') AS squad,
        COUNT(dca.id)::BIGINT AS total_claims,
        COUNT(DISTINCT dca.wallet_address)::BIGINT AS unique_members,
        COALESCE(SUM(dca.xp_awarded), 0)::BIGINT AS total_xp_awarded,
        AVG(dca.time_since_midnight_minutes) AS avg_time_to_claim_minutes
    FROM daily_claim_analytics dca
    LEFT JOIN users u ON u.wallet_address = dca.wallet_address
    WHERE dca.timestamp >= v_today_start
        AND dca.event_type = 'claim_success'
    GROUP BY u.squad
    ORDER BY total_claims DESC
    LIMIT p_limit;
END;
$$;

-- Get time-to-claim distribution (histogram)
CREATE OR REPLACE FUNCTION get_time_to_claim_distribution_today()
RETURNS TABLE (
    hour_bucket INTEGER, -- 0-23 representing hour of day UTC
    claim_count BIGINT,
    percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_today_start TIMESTAMPTZ;
    v_total_claims BIGINT;
BEGIN
    v_today_start := DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC');
    
    SELECT COUNT(*) INTO v_total_claims
    FROM daily_claim_analytics
    WHERE timestamp >= v_today_start
        AND event_type = 'claim_success';
    
    RETURN QUERY
    SELECT
        FLOOR(time_since_midnight_minutes / 60)::INTEGER AS hour_bucket,
        COUNT(*)::BIGINT AS claim_count,
        ROUND((COUNT(*)::NUMERIC / NULLIF(v_total_claims, 0) * 100), 2) AS percentage
    FROM daily_claim_analytics
    WHERE timestamp >= v_today_start
        AND event_type = 'claim_success'
        AND time_since_midnight_minutes IS NOT NULL
    GROUP BY hour_bucket
    ORDER BY hour_bucket;
END;
$$;

-- Get streak distribution
CREATE OR REPLACE FUNCTION get_streak_distribution_today()
RETURNS TABLE (
    streak_days INTEGER,
    user_count BIGINT,
    percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_today_start TIMESTAMPTZ;
    v_total_users BIGINT;
BEGIN
    v_today_start := DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC');
    
    SELECT COUNT(DISTINCT wallet_address) INTO v_total_users
    FROM daily_claim_analytics
    WHERE timestamp >= v_today_start
        AND event_type = 'claim_success';
    
    RETURN QUERY
    SELECT
        streak_days,
        COUNT(DISTINCT wallet_address)::BIGINT AS user_count,
        ROUND((COUNT(DISTINCT wallet_address)::NUMERIC / NULLIF(v_total_users, 0) * 100), 2) AS percentage
    FROM daily_claim_analytics
    WHERE timestamp >= v_today_start
        AND event_type = 'claim_success'
        AND streak_days IS NOT NULL
    GROUP BY streak_days
    ORDER BY streak_days;
END;
$$;

-- Get historical trend (last 7 days)
CREATE OR REPLACE FUNCTION get_daily_claim_trend(p_days INTEGER DEFAULT 7)
RETURNS TABLE (
    date DATE,
    total_claims BIGINT,
    unique_claimers BIGINT,
    successful_claims BIGINT,
    rejected_claims BIGINT,
    total_xp_awarded BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        DATE(timestamp) AS date,
        COUNT(*)::BIGINT AS total_claims,
        COUNT(DISTINCT wallet_address)::BIGINT AS unique_claimers,
        COUNT(*) FILTER (WHERE event_type = 'claim_success')::BIGINT AS successful_claims,
        COUNT(*) FILTER (WHERE event_type != 'claim_success')::BIGINT AS rejected_claims,
        COALESCE(SUM(xp_awarded), 0)::BIGINT AS total_xp_awarded
    FROM daily_claim_analytics
    WHERE timestamp >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY DATE(timestamp)
    ORDER BY date DESC;
END;
$$;

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Function to calculate time since midnight UTC in minutes
CREATE OR REPLACE FUNCTION calculate_time_since_midnight_utc()
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_now TIMESTAMPTZ;
    v_midnight TIMESTAMPTZ;
    v_minutes INTEGER;
BEGIN
    v_now := NOW() AT TIME ZONE 'UTC';
    v_midnight := DATE_TRUNC('day', v_now);
    v_minutes := EXTRACT(EPOCH FROM (v_now - v_midnight))::INTEGER / 60;
    
    RETURN v_minutes;
END;
$$;

-- Function to hash IP address (SHA-256)
CREATE OR REPLACE FUNCTION hash_ip_address(p_ip_address TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    IF p_ip_address IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN encode(digest(p_ip_address, 'sha256'), 'hex');
END;
$$;

-- ============================================
-- CLEANUP FUNCTION
-- ============================================

-- Clean up old analytics data (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM daily_claim_analytics
    WHERE timestamp < NOW() - INTERVAL '90 days';
    
    RAISE NOTICE 'Cleaned up analytics older than 90 days';
END;
$$;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant access to service role
-- GRANT SELECT, INSERT ON daily_claim_analytics TO service_role;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ============================================
-- TESTING QUERIES
-- ============================================

-- View today's stats
-- SELECT * FROM get_daily_claim_stats_today();

-- View event breakdown
-- SELECT * FROM get_claim_event_breakdown_today();

-- View top squads
-- SELECT * FROM get_top_squads_by_claims_today(5);

-- View time-to-claim distribution
-- SELECT * FROM get_time_to_claim_distribution_today();

-- View streak distribution
-- SELECT * FROM get_streak_distribution_today();

-- View 7-day trend
-- SELECT * FROM get_daily_claim_trend(7);

-- Calculate current time since midnight
-- SELECT calculate_time_since_midnight_utc();

-- Test IP hashing
-- SELECT hash_ip_address('192.168.1.1');

