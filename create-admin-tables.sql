-- Create Student of the Week table
CREATE TABLE IF NOT EXISTS student_of_week (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    set_by TEXT NOT NULL, -- wallet address of admin who set this
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Lore Log table
CREATE TABLE IF NOT EXISTS lore_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    entry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by TEXT NOT NULL, -- wallet address of admin who created this
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Academy Milestones table
CREATE TABLE IF NOT EXISTS academy_milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    target_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by TEXT NOT NULL, -- wallet address of admin who created this
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_of_week_created_at ON student_of_week(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lore_log_entry_date ON lore_log(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_lore_log_created_at ON lore_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_academy_milestones_target_date ON academy_milestones(target_date);
CREATE INDEX IF NOT EXISTS idx_academy_milestones_created_at ON academy_milestones(created_at DESC);

-- Enable RLS
ALTER TABLE student_of_week ENABLE ROW LEVEL SECURITY;
ALTER TABLE lore_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_milestones ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for student_of_week
CREATE POLICY "Anyone can view student of the week" ON student_of_week
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage student of the week" ON student_of_week
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.wallet_address = auth.jwt() ->> 'wallet_address' 
            AND users.is_admin = true
        )
    );

-- Create RLS policies for lore_log
CREATE POLICY "Anyone can view lore log" ON lore_log
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage lore log" ON lore_log
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.wallet_address = auth.jwt() ->> 'wallet_address' 
            AND users.is_admin = true
        )
    );

-- Create RLS policies for academy_milestones
CREATE POLICY "Anyone can view academy milestones" ON academy_milestones
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage academy milestones" ON academy_milestones
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.wallet_address = auth.jwt() ->> 'wallet_address' 
            AND users.is_admin = true
        )
    );

-- Insert sample data
INSERT INTO lore_log (title, content, entry_date, created_by) VALUES
(
    'Entry 0042: The Glitchfire Relic',
    'The first sighting of the glitchfire relic occurred during the Codec Storm of Cycle 7. Rangers reported flickering trait signatures along the WifHoodie borderlands. The relic''s energy patterns suggest a connection to the ancient protocols that govern our digital realm. Scholars from the Decoders Squad are currently analyzing the phenomenon, while Creators are documenting the visual manifestations for the Academy archives.',
    '2025-01-27T00:00:00Z',
    'admin'
),
(
    'Entry 0041: The Great Meme Migration',
    'When the meme lords of old abandoned their thrones, a new generation rose from the digital ashes. The Creators Squad was born from this chaos, wielding the power of viral content and community engagement. Their influence spreads across all squads, bringing joy and connection to our decentralized learning ecosystem.',
    '2025-01-26T00:00:00Z',
    'admin'
),
(
    'Entry 0040: The Decoder''s Dilemma',
    'In the depths of the blockchain, ancient algorithms whisper secrets only the purest minds can decipher. The Decoders Squad guards these sacred texts, ensuring that knowledge remains accessible to those who seek understanding. Their work forms the foundation of our educational mission.',
    '2025-01-25T00:00:00Z',
    'admin'
);

INSERT INTO academy_milestones (title, description, progress, target_date, created_by) VALUES
(
    'Phase 3 Rollout',
    'Advanced trading courses and squad challenges',
    72,
    '2025-02-14T00:00:00Z',
    'admin'
),
(
    'Merch Drop',
    'Limited edition Hoodie Academy gear',
    45,
    '2025-03-15T00:00:00Z',
    'admin'
),
(
    'Squad Leader Elections',
    'Democratic leadership selection process',
    30,
    '2025-02-28T00:00:00Z',
    'admin'
),
(
    'NFT Marketplace Launch',
    'Student-created content marketplace',
    88,
    '2025-03-15T00:00:00Z',
    'admin'
),
(
    'Global Tournament',
    'Cross-squad competitive event',
    23,
    '2025-04-01T00:00:00Z',
    'admin'
);
