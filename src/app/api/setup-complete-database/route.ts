import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST() {
  try {
    const supabase = getSupabaseAdmin();
    
    console.log('🚀 Starting comprehensive database setup...');
    
    // 1. Create courses table
    console.log('📚 Creating courses table...');
    const { error: coursesError } = await supabase
      .from('courses')
      .select('id')
      .limit(1);
    
    if (coursesError && coursesError.code === '42P01') {
      // Table doesn't exist, create it
      const { error: createCoursesError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS courses (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            emoji TEXT DEFAULT '📚',
            squad TEXT,
            level TEXT DEFAULT 'beginner',
            access TEXT DEFAULT 'free',
            description TEXT,
            total_lessons INTEGER DEFAULT 0,
            category TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            is_visible BOOLEAN DEFAULT true,
            is_published BOOLEAN DEFAULT false,
            slug TEXT,
            sort_order INTEGER DEFAULT 0
          );
        `
      });
      
      if (createCoursesError) {
        console.log('⚠️ Could not create courses table automatically. Please create it manually.');
      } else {
        console.log('✅ Courses table created');
      }
    }
    
    // 2. Create global_settings table
    console.log('⚙️ Creating global_settings table...');
    const { error: settingsError } = await supabase
      .from('global_settings')
      .select('id')
      .limit(1);
    
    if (settingsError && settingsError.code === '42P01') {
      const { error: createSettingsError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS global_settings (
            id SERIAL PRIMARY KEY,
            site_maintenance BOOLEAN DEFAULT false,
            registration_enabled BOOLEAN DEFAULT true,
            course_submissions_enabled BOOLEAN DEFAULT true,
            bounty_submissions_enabled BOOLEAN DEFAULT true,
            chat_enabled BOOLEAN DEFAULT true,
            leaderboard_enabled BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (createSettingsError) {
        console.log('⚠️ Could not create global_settings table automatically. Please create it manually.');
      } else {
        console.log('✅ Global settings table created');
      }
    }
    
    // 3. Create other required tables
    console.log('🏗️ Creating other required tables...');
    const tables = [
      {
        name: 'announcements',
        sql: `
          CREATE TABLE IF NOT EXISTS announcements (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT,
            is_published BOOLEAN DEFAULT false,
            starts_at TIMESTAMP WITH TIME ZONE,
            ends_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_by UUID
          );
        `
      },
      {
        name: 'events',
        sql: `
          CREATE TABLE IF NOT EXISTS events (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            type TEXT DEFAULT 'space',
            date DATE,
            time TIME,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      },
      {
        name: 'bounties',
        sql: `
          CREATE TABLE IF NOT EXISTS bounties (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            title TEXT NOT NULL,
            short_desc TEXT,
            reward TEXT,
            deadline DATE,
            link_to TEXT,
            image TEXT,
            squad_tag TEXT,
            status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
            hidden BOOLEAN DEFAULT false,
            submissions INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            created_by UUID,
            updated_by UUID
          );
        `
      },
      {
        name: 'submissions',
        sql: `
          CREATE TABLE IF NOT EXISTS submissions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            squad TEXT,
            bounty_id UUID REFERENCES bounties(id),
            wallet_address TEXT,
            image_url TEXT,
            status TEXT DEFAULT 'pending',
            upvotes INTEGER DEFAULT 0,
            total_upvotes INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      }
    ];
    
    for (const table of tables) {
      try {
        const { error: checkError } = await supabase
          .from(table.name)
          .select('id')
          .limit(1);
        
        if (checkError && checkError.code === '42P01') {
          const { error: createError } = await supabase.rpc('exec_sql', { sql: table.sql });
          if (createError) {
            console.log(`⚠️ Could not create ${table.name} table automatically:`, createError.message);
          } else {
            console.log(`✅ ${table.name} table created`);
          }
        }
      } catch (error) {
        console.log(`⚠️ Error checking/creating ${table.name} table:`, error);
      }
    }
    
    // 3.5. Setup RLS policies for bounties
    console.log('🔒 Setting up RLS policies for bounties...');
    const rlsPolicies = [
      {
        name: 'bounties_rls',
        sql: `
          -- Enable RLS for bounties
          ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;
          
          -- Create policies for bounties
          DROP POLICY IF EXISTS "Everyone can view bounties" ON bounties;
          CREATE POLICY "Everyone can view bounties" ON bounties
            FOR SELECT USING (true);
          
          DROP POLICY IF EXISTS "Admins can insert bounties" ON bounties;
          CREATE POLICY "Admins can insert bounties" ON bounties
            FOR INSERT USING (
              EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid() 
                AND users.is_admin = true
              )
            );
          
          DROP POLICY IF EXISTS "Admins can update bounties" ON bounties;
          CREATE POLICY "Admins can update bounties" ON bounties
            FOR UPDATE USING (
              EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid() 
                AND users.is_admin = true
              )
            );
          
          DROP POLICY IF EXISTS "Admins can delete bounties" ON bounties;
          CREATE POLICY "Admins can delete bounties" ON bounties
            FOR DELETE USING (
              EXISTS (
                SELECT 1 FROM users 
                WHERE users.id = auth.uid() 
                AND users.is_admin = true
              )
            );
        `
      }
    ];
    
    for (const policy of rlsPolicies) {
      try {
        const { error: policyError } = await supabase.rpc('exec_sql', { sql: policy.sql });
        if (policyError) {
          console.log(`⚠️ Could not setup ${policy.name}:`, policyError.message);
        } else {
          console.log(`✅ ${policy.name} setup complete`);
        }
      } catch (error) {
        console.log(`⚠️ Error setting up ${policy.name}:`, error);
      }
    }
    
    // 4. Insert sample courses
    console.log('📝 Inserting sample courses...');
    const sampleCourses = [
      {
        id: 'intro-web3',
        title: 'Introduction to Web3',
        emoji: '🌐',
        squad: 'All',
        level: 'beginner',
        access: 'free',
        description: 'Learn the basics of Web3 and blockchain technology',
        total_lessons: 5,
        category: 'fundamentals',
        is_visible: true,
        is_published: true,
        slug: 'intro-web3',
        sort_order: 1
      },
      {
        id: 'nft-basics',
        title: 'NFT Fundamentals',
        emoji: '🖼️',
        squad: 'Creators',
        level: 'beginner',
        access: 'free',
        description: 'Master the basics of NFTs and digital ownership',
        total_lessons: 8,
        category: 'nfts',
        is_visible: true,
        is_published: true,
        slug: 'nft-basics',
        sort_order: 2
      },
      {
        id: 'trading-psychology',
        title: 'Trading Psychology',
        emoji: '🧠',
        squad: 'Traders',
        level: 'intermediate',
        access: 'hoodie',
        description: 'Master the mental game of trading and investing',
        total_lessons: 12,
        category: 'psychology',
        is_visible: true,
        is_published: true,
        slug: 'trading-psychology',
        sort_order: 3
      },
      {
        id: 'technical-analysis',
        title: 'Technical Analysis',
        emoji: '📊',
        squad: 'Traders',
        level: 'intermediate',
        access: 'hoodie',
        description: 'Learn chart patterns, indicators, and market analysis',
        total_lessons: 15,
        category: 'analysis',
        is_visible: true,
        is_published: true,
        slug: 'technical-analysis',
        sort_order: 4
      }
    ];
    
    for (const course of sampleCourses) {
      const { error: insertError } = await supabase
        .from('courses')
        .upsert(course, { onConflict: 'id' });
      
      if (insertError) {
        console.log(`⚠️ Could not insert course ${course.id}:`, insertError.message);
      } else {
        console.log(`✅ Course ${course.id} inserted/updated`);
      }
    }
    
    // 5. Insert sample announcements
    console.log('📢 Inserting sample announcements...');
    const sampleAnnouncements = [
      {
        title: 'Welcome to Hoodie Academy!',
        content: 'We\'re excited to launch our comprehensive Web3 learning platform. Start your journey today!',
        is_published: true
      },
      {
        title: 'New Course: Trading Psychology',
        content: 'Learn the mental game of trading with our latest course. Perfect for intermediate traders.',
        is_published: true
      }
    ];
    
    for (const announcement of sampleAnnouncements) {
      const { error: insertError } = await supabase
        .from('announcements')
        .upsert(announcement, { onConflict: 'id' });
      
      if (insertError) {
        console.log(`⚠️ Could not insert announcement:`, insertError.message);
      } else {
        console.log(`✅ Announcement inserted/updated`);
      }
    }
    
    // 6. Insert sample bounties
    console.log('🎯 Inserting sample bounties...');
    const sampleBounties = [
      {
        title: 'Create Course Content',
        short_desc: 'Help create content for our new DeFi course',
        squad_tag: 'Creators',
        reward: '1000 XP + Hoodie NFT',
        status: 'active'
      },
      {
        title: 'Community Building',
        short_desc: 'Help grow our Discord community',
        squad_tag: 'Community',
        reward: '500 XP',
        status: 'active'
      }
    ];
    
    for (const bounty of sampleBounties) {
      const { error: insertError } = await supabase
        .from('bounties')
        .upsert(bounty, { onConflict: 'id' });
      
      if (insertError) {
        console.log(`⚠️ Could not insert bounty:`, insertError.message);
      } else {
        console.log(`✅ Bounty inserted/updated`);
      }
    }
    
    // 7. Insert sample events
    console.log('📅 Inserting sample events...');
    const sampleEvents = [
      {
        title: 'Weekly Trading Space',
        description: 'Join us every Friday for our weekly trading discussion',
        type: 'space',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Next Friday
      },
      {
        title: 'NFT Workshop',
        description: 'Learn how to create and trade NFTs',
        type: 'workshop',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Next week
      }
    ];
    
    for (const event of sampleEvents) {
      const { error: insertError } = await supabase
        .from('events')
        .upsert(event, { onConflict: 'id' });
      
      if (insertError) {
        console.log(`⚠️ Could not insert event:`, insertError.message);
      } else {
        console.log(`✅ Event inserted/updated`);
      }
    }
    
    // 8. Insert default global settings
    console.log('⚙️ Inserting default global settings...');
    const { error: settingsInsertError } = await supabase
      .from('global_settings')
      .upsert({
        id: 1,
        site_maintenance: false,
        registration_enabled: true,
        course_submissions_enabled: true,
        bounty_submissions_enabled: true,
        chat_enabled: true,
        leaderboard_enabled: true
      }, { onConflict: 'id' });
    
    if (settingsInsertError) {
      console.log('⚠️ Could not insert global settings:', settingsInsertError.message);
    } else {
      console.log('✅ Global settings inserted/updated');
    }
    
    console.log('🎉 Database setup completed!');
    
    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully',
      tablesCreated: ['courses', 'global_settings', 'announcements', 'events', 'bounties', 'submissions'],
      sampleDataInserted: {
        courses: sampleCourses.length,
        announcements: sampleAnnouncements.length,
        bounties: sampleBounties.length,
        events: sampleEvents.length
      }
    });
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    return NextResponse.json({ 
      error: 'Database setup failed', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

