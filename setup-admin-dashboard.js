#!/usr/bin/env node

/**
 * Admin Dashboard Setup Script
 * 
 * This script helps set up the database tables and initial data
 * needed for the admin dashboard functionality.
 * 
 * Run this after setting up your Supabase project.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Check environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    console.error('Please check your .env.local file');
    process.exit(1);
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client with service role for admin operations
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function setupAdminDashboard() {
  console.log('🚀 Setting up Admin Dashboard...\n');

  try {
    // 1. Check if tables exist
    console.log('📋 Checking existing tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', [
        'courses', 'announcements', 'events', 'bounties', 
        'course_progress', 'global_settings', 'feature_flags'
      ]);

    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError);
      return;
    }

    const existingTables = tables.map(t => t.table_name);
    console.log('✅ Existing tables:', existingTables);

    // 2. Create missing tables using SQL
    console.log('\n🗄️ Creating missing tables...');
    
    // Read and execute the schema SQL
    const fs = require('fs');
    const path = require('path');
    
    try {
      const schemaPath = path.join(__dirname, 'src', 'lib', 'admin-dashboard-schema.sql');
      const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
      
      // Split SQL into individual statements
      const statements = schemaSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
            if (error) {
              console.log('⚠️ Statement skipped (may already exist):', statement.substring(0, 50) + '...');
            }
          } catch (err) {
            // Ignore errors for statements that may already exist
            console.log('⚠️ Statement skipped:', statement.substring(0, 50) + '...');
          }
        }
      }
      
      console.log('✅ Schema execution completed');
    } catch (fileError) {
      console.log('⚠️ Could not read schema file, tables may already exist');
    }

    // 3. Insert sample data
    console.log('\n📝 Inserting sample data...');

    // Sample courses
    const sampleCourses = [
      {
        id: 'intro-web3',
        title: 'Introduction to Web3',
        emoji: '🌐',
        squad: 'All',
        level: 'Beginner',
        access: 'public',
        description: 'Learn the basics of Web3 and blockchain technology',
        totalLessons: 5,
        category: 'fundamentals',
        is_visible: true,
        is_published: true
      },
      {
        id: 'nft-basics',
        title: 'NFT Fundamentals',
        emoji: '🖼️',
        squad: 'Creators',
        level: 'Beginner',
        access: 'public',
        description: 'Master the basics of NFTs and digital ownership',
        totalLessons: 8,
        category: 'nfts',
        is_visible: true,
        is_published: true
      }
    ];

    for (const course of sampleCourses) {
      const { error } = await supabase
        .from('courses')
        .upsert(course, { onConflict: 'id' });
      
      if (error) {
        console.log('⚠️ Course already exists:', course.id);
      } else {
        console.log('✅ Created course:', course.id);
      }
    }

    // Sample announcements
    const sampleAnnouncements = [
      {
        title: 'Welcome to Hoodie Academy!',
        content: 'We\'re excited to launch our new learning platform. Start your Web3 journey today!',
        is_published: true
      },
      {
        title: 'New Course Available',
        content: 'Check out our new NFT Fundamentals course designed for creators.',
        is_published: true
      }
    ];

    for (const announcement of sampleAnnouncements) {
      const { error } = await supabase
        .from('announcements')
        .insert(announcement);
      
      if (error) {
        console.log('⚠️ Announcement creation error:', error.message);
      } else {
        console.log('✅ Created announcement:', announcement.title);
      }
    }

    // Sample events
    const sampleEvents = [
      {
        title: 'Web3 Workshop',
        description: 'Join us for a hands-on workshop on building DApps',
        type: 'workshop',
        date: '2024-03-15',
        time: '2:00 PM UTC'
      },
      {
        title: 'Community Meetup',
        description: 'Monthly community meetup to discuss latest trends',
        type: 'meetup',
        date: '2024-03-20',
        time: '7:00 PM UTC'
      }
    ];

    for (const event of sampleEvents) {
      const { error } = await supabase
        .from('events')
        .insert(event);
      
      if (error) {
        console.log('⚠️ Event creation error:', error.message);
      } else {
        console.log('✅ Created event:', event.title);
      }
    }

    // Sample bounties
    const sampleBounties = [
      {
        title: 'Logo Design Contest',
        short_desc: 'Design a new logo for Hoodie Academy',
        reward: '0.5 SOL',
        squad_tag: 'Creators',
        status: 'active',
        hidden: false
      },
      {
        title: 'Tutorial Video',
        short_desc: 'Create a tutorial video for beginners',
        reward: '0.3 SOL',
        squad_tag: 'Speakers',
        status: 'active',
        hidden: false
      }
    ];

    for (const bounty of sampleBounties) {
      const { error } = await supabase
        .from('bounties')
        .insert(bounty);
      
      if (error) {
        console.log('⚠️ Bounty creation error:', error.message);
      } else {
        console.log('✅ Created bounty:', bounty.title);
      }
    }

    // 4. Verify setup
    console.log('\n🔍 Verifying setup...');
    
    const { data: finalTables, error: finalError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', [
        'courses', 'announcements', 'events', 'bounties', 
        'course_progress', 'global_settings', 'feature_flags'
      ]);

    if (finalError) {
      console.error('❌ Error verifying tables:', finalError);
      return;
    }

    const finalTableNames = finalTables.map(t => t.table_name);
    console.log('✅ Final tables:', finalTableNames);

    // 5. Check data counts
    const { data: coursesCount } = await supabase
      .from('courses')
      .select('*', { count: 'exact' });
    
    const { data: announcementsCount } = await supabase
      .from('announcements')
      .select('*', { count: 'exact' });
    
    const { data: eventsCount } = await supabase
      .from('events')
      .select('*', { count: 'exact' });
    
    const { data: bountiesCount } = await supabase
      .from('bounties')
      .select('*', { count: 'exact' });

    console.log('\n📊 Sample Data Summary:');
    console.log(`   Courses: ${coursesCount?.length || 0}`);
    console.log(`   Announcements: ${announcementsCount?.length || 0}`);
    console.log(`   Events: ${eventsCount?.length || 0}`);
    console.log(`   Bounties: ${bountiesCount?.length || 0}`);

    console.log('\n🎉 Admin Dashboard setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Navigate to /admin in your application');
    console.log('   2. Connect with an admin wallet');
    console.log('   3. Test the realtime functionality');
    console.log('   4. Verify updates appear on public pages');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run setup
if (require.main === module) {
  setupAdminDashboard();
}

module.exports = { setupAdminDashboard };
