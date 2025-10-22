-- ============================================
-- STUDENT OF THE WEEK SYSTEM
-- ============================================
-- Tracks and manages Student of the Week selections

-- Create student_of_the_week table
CREATE TABLE IF NOT EXISTS student_of_the_week (
    id BIGSERIAL PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    reason TEXT,
    achievements TEXT[],
    selected_by TEXT, -- Admin wallet who selected them
    selected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    featured BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure only one featured student per week
    UNIQUE(week_start, week_end, featured)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_student_of_week_wallet ON student_of_the_week(wallet_address);
CREATE INDEX IF NOT EXISTS idx_student_of_week_dates ON student_of_the_week(week_start, week_end);
CREATE INDEX IF NOT EXISTS idx_student_of_week_featured ON student_of_the_week(featured, week_start DESC);

-- Add comments
COMMENT ON TABLE student_of_the_week IS 'Tracks Student of the Week selections';
COMMENT ON COLUMN student_of_the_week.featured IS 'Only one featured student per week';

-- ============================================
-- FUNCTION: Get Current Student of the Week
-- ============================================

CREATE OR REPLACE FUNCTION get_current_student_of_week()
RETURNS TABLE (
    wallet_address TEXT,
    display_name TEXT,
    pfp TEXT,
    total_xp BIGINT,
    level INTEGER,
    squad TEXT,
    reason TEXT,
    achievements TEXT[],
    week_start DATE,
    week_end DATE,
    selected_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sotw.wallet_address,
        COALESCE(u.display_name, SUBSTRING(sotw.wallet_address, 1, 8) || '...') as display_name,
        u.pfp,
        COALESCE(u.total_xp, 0) as total_xp,
        COALESCE(u.level, 1) as level,
        u.squad,
        sotw.reason,
        sotw.achievements,
        sotw.week_start,
        sotw.week_end,
        sotw.selected_at
    FROM student_of_the_week sotw
    LEFT JOIN users u ON u.wallet_address = sotw.wallet_address
    WHERE sotw.featured = TRUE
        AND sotw.week_start <= CURRENT_DATE
        AND sotw.week_end >= CURRENT_DATE
    ORDER BY sotw.selected_at DESC
    LIMIT 1;
END;
$$;

-- ============================================
-- FUNCTION: Get Top Students This Week
-- ============================================

CREATE OR REPLACE FUNCTION get_top_students_this_week(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    wallet_address TEXT,
    display_name TEXT,
    pfp TEXT,
    total_xp BIGINT,
    level INTEGER,
    squad TEXT,
    xp_this_week BIGINT,
    claims_this_week BIGINT,
    bounties_this_week BIGINT,
    current_streak INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_week_start DATE;
BEGIN
    -- Get the start of this week (Monday)
    v_week_start := DATE_TRUNC('week', CURRENT_DATE)::DATE;
    
    RETURN QUERY
    WITH weekly_xp AS (
        SELECT 
            ua.wallet_address,
            SUM(CASE 
                WHEN ua.metadata->>'xp_awarded' IS NOT NULL 
                THEN (ua.metadata->>'xp_awarded')::INTEGER 
                ELSE 0 
            END) as xp_earned
        FROM user_activity ua
        WHERE DATE(ua.created_at) >= v_week_start
            AND ua.activity_type IN ('daily_login_bonus', 'xp_awarded', 'course_completion', 'bounty_completion')
        GROUP BY ua.wallet_address
    ),
    weekly_claims AS (
        SELECT 
            wallet_address,
            COUNT(*) as claim_count
        FROM daily_logins
        WHERE claim_utc_date >= v_week_start
        GROUP BY wallet_address
    ),
    weekly_bounties AS (
        SELECT 
            wallet_address,
            COUNT(*) as bounty_count
        FROM user_activity
        WHERE DATE(created_at) >= v_week_start
            AND activity_type = 'bounty_completion'
        GROUP BY wallet_address
    )
    SELECT 
        u.wallet_address,
        COALESCE(u.display_name, SUBSTRING(u.wallet_address, 1, 8) || '...') as display_name,
        u.pfp,
        COALESCE(u.total_xp, 0) as total_xp,
        COALESCE(u.level, 1) as level,
        u.squad,
        COALESCE(wx.xp_earned, 0) as xp_this_week,
        COALESCE(wc.claim_count, 0) as claims_this_week,
        COALESCE(wb.bounty_count, 0) as bounties_this_week,
        0 as current_streak -- TODO: Use calculate_user_streak if available
    FROM users u
    LEFT JOIN weekly_xp wx ON wx.wallet_address = u.wallet_address
    LEFT JOIN weekly_claims wc ON wc.wallet_address = u.wallet_address
    LEFT JOIN weekly_bounties wb ON wb.wallet_address = u.wallet_address
    WHERE u.banned = FALSE
        AND (wx.xp_earned > 0 OR wc.claim_count > 0 OR wb.bounty_count > 0)
    ORDER BY 
        xp_this_week DESC,
        claims_this_week DESC,
        bounties_this_week DESC
    LIMIT p_limit;
END;
$$;

-- ============================================
-- FUNCTION: Set Student of the Week
-- ============================================

CREATE OR REPLACE FUNCTION set_student_of_week(
    p_wallet_address TEXT,
    p_reason TEXT DEFAULT NULL,
    p_achievements TEXT[] DEFAULT NULL,
    p_selected_by TEXT DEFAULT NULL,
    p_week_start DATE DEFAULT NULL,
    p_week_end DATE DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    student_id BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_student_id BIGINT;
    v_week_start DATE;
    v_week_end DATE;
BEGIN
    -- Calculate week dates if not provided
    IF p_week_start IS NULL THEN
        v_week_start := DATE_TRUNC('week', CURRENT_DATE)::DATE;
    ELSE
        v_week_start := p_week_start;
    END IF;
    
    IF p_week_end IS NULL THEN
        v_week_end := v_week_start + INTERVAL '6 days';
    ELSE
        v_week_end := p_week_end;
    END IF;
    
    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE wallet_address = p_wallet_address) THEN
        RETURN QUERY SELECT FALSE, 'User not found'::TEXT, NULL::BIGINT;
        RETURN;
    END IF;
    
    -- Unfeatured any existing student for this week
    UPDATE student_of_the_week
    SET featured = FALSE
    WHERE week_start = v_week_start
        AND week_end = v_week_end
        AND featured = TRUE;
    
    -- Insert new student of the week
    INSERT INTO student_of_the_week (
        wallet_address,
        week_start,
        week_end,
        reason,
        achievements,
        selected_by,
        featured
    )
    VALUES (
        p_wallet_address,
        v_week_start,
        v_week_end,
        p_reason,
        p_achievements,
        p_selected_by,
        TRUE
    )
    RETURNING id INTO v_student_id;
    
    RETURN QUERY SELECT TRUE, 'Student of the Week set successfully'::TEXT, v_student_id;
END;
$$;

-- ============================================
-- FUNCTION: Get Student of the Week History
-- ============================================

CREATE OR REPLACE FUNCTION get_student_of_week_history(p_limit INTEGER DEFAULT 12)
RETURNS TABLE (
    wallet_address TEXT,
    display_name TEXT,
    pfp TEXT,
    total_xp BIGINT,
    level INTEGER,
    squad TEXT,
    reason TEXT,
    achievements TEXT[],
    week_start DATE,
    week_end DATE,
    selected_at TIMESTAMPTZ,
    featured BOOLEAN
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sotw.wallet_address,
        COALESCE(u.display_name, SUBSTRING(sotw.wallet_address, 1, 8) || '...') as display_name,
        u.pfp,
        COALESCE(u.total_xp, 0) as total_xp,
        COALESCE(u.level, 1) as level,
        u.squad,
        sotw.reason,
        sotw.achievements,
        sotw.week_start,
        sotw.week_end,
        sotw.selected_at,
        sotw.featured
    FROM student_of_the_week sotw
    LEFT JOIN users u ON u.wallet_address = sotw.wallet_address
    ORDER BY sotw.week_start DESC, sotw.selected_at DESC
    LIMIT p_limit;
END;
$$;

-- ============================================
-- FUNCTION: Get Times User Was Student of Week
-- ============================================

CREATE OR REPLACE FUNCTION get_user_sotw_count(p_wallet_address TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM student_of_the_week
    WHERE wallet_address = p_wallet_address
        AND featured = TRUE;
    
    RETURN v_count;
END;
$$;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant access to authenticated users
-- GRANT SELECT ON student_of_the_week TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_current_student_of_week() TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_student_of_week_history(INTEGER) TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_user_sotw_count(TEXT) TO authenticated;

-- Admin-only functions
-- GRANT EXECUTE ON FUNCTION set_student_of_week(TEXT, TEXT, TEXT[], TEXT, DATE, DATE) TO service_role;
-- GRANT EXECUTE ON FUNCTION get_top_students_this_week(INTEGER) TO service_role;

-- ============================================
-- TESTING QUERIES
-- ============================================

-- Get current student of the week
-- SELECT * FROM get_current_student_of_week();

-- Get top students this week
-- SELECT * FROM get_top_students_this_week(10);

-- Set student of the week
-- SELECT * FROM set_student_of_week(
--     'wallet_address_here',
--     'Outstanding contributions to the community!',
--     ARRAY['Completed 5 courses', 'Helped 10+ students', '30 day streak'],
--     'admin_wallet_address'
-- );

-- Get history
-- SELECT * FROM get_student_of_week_history(12);

-- Get user's total times as student of the week
-- SELECT get_user_sotw_count('wallet_address_here');


