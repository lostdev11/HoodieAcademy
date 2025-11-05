'use client';

import { createClient } from '@/lib/supabase';
import { EventKind } from '@/types/tracking';

const supabase = createClient();

/**
 * Seed script for generating test tracking data
 * 
 * ⚠️ WARNING: This file is for DEVELOPMENT/TESTING only!
 * Do not use mock/test users in production. Real users should be created
 * automatically when they connect their wallets.
 * 
 * This creates sample events, bounties, and submissions for testing
 * (without creating mock users)
 */

export async function seedTrackingData(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🌱 Starting tracking data seed...');
    console.log('⚠️  WARNING: This function is for development/testing only!');
    console.log('⚠️  Mock users have been removed. Only use real wallet addresses.');

    // Get existing users from database (no mock users will be created)
    const { data: existingUsers, error: usersError } = await supabase
      .from('users')
      .select('id, wallet_address')
      .limit(10);

    if (usersError) {
      throw new Error(`Failed to fetch existing users: ${usersError.message}`);
    }

    if (!existingUsers || existingUsers.length === 0) {
      console.log('⚠️  No users found in database. Seed function requires real users.');
      console.log('⚠️  Connect real wallets before seeding tracking data.');
      return { 
        success: false, 
        error: 'No users found. Real users must be created by connecting wallets first.' 
      };
    }

    const users = existingUsers;
    console.log(`✅ Using ${users.length} existing real users for seed data`);

    // Create sample bounties
    const sampleBounties = [
      {
        title: 'Complete Solana Basics Course',
        description: 'Finish the comprehensive Solana blockchain fundamentals course',
        reward_xp: 100,
        status: 'open' as const,
        open_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        close_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['course', 'solana', 'blockchain'],
        max_submissions: 50,
        allow_multiple_submissions: false
      },
      {
        title: 'Build a DeFi Dashboard',
        description: 'Create a dashboard showing DeFi protocol metrics',
        reward_xp: 250,
        status: 'open' as const,
        open_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        close_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['defi', 'dashboard', 'frontend'],
        max_submissions: 20,
        allow_multiple_submissions: true
      },
      {
        title: 'Write Solana Security Guide',
        description: 'Create a comprehensive guide on Solana security best practices',
        reward_xp: 150,
        status: 'closed' as const,
        open_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        close_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['security', 'documentation', 'guide'],
        max_submissions: 10,
        allow_multiple_submissions: false
      }
    ];

    const { data: bounties, error: bountiesError } = await supabase
      .from('bounties')
      .insert(sampleBounties)
      .select('id, title');

    if (bountiesError) {
      throw new Error(`Failed to insert bounties: ${bountiesError.message}`);
    }

    console.log(`✅ Created ${bounties.length} bounties`);

    // Create sample submissions
    const sampleSubmissions = [
      {
        bounty_id: bounties[0].id,
        user_id: users[0].id,
        wallet_address: users[0].wallet_address,
        title: 'Solana Basics Course Completion',
        content: 'I completed the Solana basics course and learned about account model, programs, and transactions.',
        url: 'https://example.com/certificate',
        evidence_links: ['https://example.com/certificate', 'https://example.com/project'],
        status: 'approved' as const,
        score: 95,
        reviewed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        feedback: 'Excellent work! Great understanding of Solana fundamentals.'
      },
      {
        bounty_id: bounties[1].id,
        user_id: users[0].id,
        wallet_address: users[0].wallet_address,
        title: 'DeFi Dashboard v1.0',
        content: 'Built a comprehensive DeFi dashboard with real-time data from multiple protocols.',
        url: 'https://example.com/defi-dashboard',
        evidence_links: ['https://example.com/defi-dashboard', 'https://github.com/user/defi-dashboard'],
        status: 'pending_review' as const
      },
      {
        bounty_id: bounties[1].id,
        user_id: users[1].id,
        wallet_address: users[1].wallet_address,
        title: 'DeFi Analytics Platform',
        content: 'Created an advanced analytics platform for DeFi protocols with custom metrics.',
        url: 'https://example.com/defi-analytics',
        evidence_links: ['https://example.com/defi-analytics'],
        status: 'approved' as const,
        score: 88,
        reviewed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        feedback: 'Very impressive work! The custom metrics are particularly well thought out.'
      },
      {
        bounty_id: bounties[2].id,
        user_id: users[1].id,
        wallet_address: users[1].wallet_address,
        title: 'Solana Security Best Practices',
        content: 'Comprehensive guide covering wallet security, smart contract auditing, and common attack vectors.',
        url: 'https://example.com/solana-security-guide',
        evidence_links: ['https://example.com/solana-security-guide'],
        status: 'rejected' as const,
        score: 45,
        reviewed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        feedback: 'Good effort, but the guide needs more depth and practical examples.'
      }
    ];

    const { data: submissions, error: submissionsError } = await supabase
      .from('bounty_submissions')
      .insert(sampleSubmissions)
      .select('id, bounty_id, user_id, status');

    if (submissionsError) {
      throw new Error(`Failed to insert submissions: ${submissionsError.message}`);
    }

    console.log(`✅ Created ${submissions.length} submissions`);

    // Create XP events
    const xpEvents = [
      // Alice's XP events
      {
        user_id: users[0].id,
        source: 'bounty_submission' as const,
        source_id: submissions[0].id,
        delta: 100,
        reason: 'XP for approved submission to bounty Complete Solana Basics Course'
      },
      {
        user_id: users[0].id,
        source: 'course' as const,
        source_id: 'solana-basics',
        delta: 50,
        reason: 'Course completion bonus'
      },
      // Bob's XP events
      {
        user_id: users[1].id,
        source: 'bounty_submission' as const,
        source_id: submissions[2].id,
        delta: 250,
        reason: 'XP for approved submission to bounty Build a DeFi Dashboard'
      },
      {
        user_id: users[1].id,
        source: 'course' as const,
        source_id: 'defi-fundamentals',
        delta: 75,
        reason: 'Course completion bonus'
      },
      // Admin's XP events
      {
        user_id: users[3].id,
        source: 'admin_adjustment' as const,
        delta: 1000,
        reason: 'Admin bonus for platform management'
      }
    ];

    const { error: xpError } = await supabase
      .from('xp_events')
      .insert(xpEvents);

    if (xpError) {
      throw new Error(`Failed to insert XP events: ${xpError.message}`);
    }

    console.log(`✅ Created ${xpEvents.length} XP events`);

    // Create sample sessions
    const sessions = [];
    for (const user of users) {
      const sessionCount = Math.floor(Math.random() * 5) + 1; // 1-5 sessions per user
      
      for (let i = 0; i < sessionCount; i++) {
        const sessionStart = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
        const sessionEnd = new Date(sessionStart.getTime() + Math.random() * 2 * 60 * 60 * 1000); // 0-2 hours
        
        sessions.push({
          user_id: user.id,
          wallet_address: user.wallet_address,
          started_at: sessionStart.toISOString(),
          last_heartbeat_at: sessionEnd.toISOString(),
          ended_at: Math.random() > 0.3 ? sessionEnd.toISOString() : null, // 70% ended
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ip: `192.168.1.${Math.floor(Math.random() * 255)}`
        });
      }
    }

    const { error: sessionsError } = await supabase
      .from('sessions')
      .insert(sessions);

    if (sessionsError) {
      throw new Error(`Failed to insert sessions: ${sessionsError.message}`);
    }

    console.log(`✅ Created ${sessions.length} sessions`);

    // Create sample event log entries
    const eventLogs = [];
    const eventKinds: EventKind[] = [
      'wallet_connect', 'page_view', 'course_start', 'course_complete',
      'lesson_start', 'lesson_complete', 'exam_started', 'exam_submitted'
    ];

    for (const user of users) {
      const eventCount = Math.floor(Math.random() * 20) + 10; // 10-30 events per user
      
      for (let i = 0; i < eventCount; i++) {
        const eventTime = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
        const kind = eventKinds[Math.floor(Math.random() * eventKinds.length)];
        
        eventLogs.push({
          user_id: user.id,
          wallet_address: user.wallet_address,
          kind,
          path: kind === 'page_view' ? `/page-${Math.floor(Math.random() * 10)}` : null,
          course_id: kind.includes('course') || kind.includes('lesson') ? 'solana-basics' : null,
          lesson_id: kind.includes('lesson') ? `lesson-${Math.floor(Math.random() * 5)}` : null,
          payload: {
            timestamp: eventTime.toISOString(),
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            url: `https://hoodieacademy.com/page-${Math.floor(Math.random() * 10)}`
          },
          created_at: eventTime.toISOString()
        });
      }
    }

    const { error: eventsError } = await supabase
      .from('event_log')
      .insert(eventLogs);

    if (eventsError) {
      throw new Error(`Failed to insert event logs: ${eventsError.message}`);
    }

    console.log(`✅ Created ${eventLogs.length} event log entries`);

    // Refresh materialized views
    const { error: refreshError } = await supabase
      .rpc('refresh_materialized_view', { view_name: 'activity_daily' });

    if (refreshError) {
      console.warn('Warning: Could not refresh materialized view:', refreshError.message);
    }

    console.log('🎉 Tracking data seed completed successfully!');
    return { success: true };

  } catch (error) {
    console.error('❌ Error seeding tracking data:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Clear all tracking data (for testing)
 */
export async function clearTrackingData(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🧹 Clearing tracking data...');

    // Delete in reverse order of dependencies
    const tables = [
      'xp_events',
      'bounty_submissions', 
      'bounties',
      'event_log',
      'sessions',
      'wallets',
      'admin_wallets'
    ];

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (error) {
        console.warn(`Warning: Could not clear ${table}:`, error.message);
      }
    }

    console.log('✅ Tracking data cleared');
    return { success: true };

  } catch (error) {
    console.error('❌ Error clearing tracking data:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
