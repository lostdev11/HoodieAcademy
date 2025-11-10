import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const DEFAULT_COURSE_SLUG = 't100-chart-literacy';

type ProgressRow = {
  wallet_address: string;
  completion_percentage: number | null;
  completed_lessons: number | null;
  total_lessons: number | null;
  completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  lesson_data: unknown;
};

type UserRow = {
  wallet_address: string;
  display_name: string | null;
  squad: string | null;
  squad_id: string | null;
  total_xp: number | null;
  level: number | null;
  last_active: string | null;
  created_at: string | null;
};

type PreviewRow = {
  wallet_address: string | null;
  email: string | null;
  submitted_at: string | null;
  created_at: string | null;
};

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error('[FREE COURSE API] Missing Supabase configuration');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const courseSlug = searchParams.get('course_slug') || DEFAULT_COURSE_SLUG;

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: progressRows, error: progressError } = await supabase
      .from('course_progress')
      .select(
        'wallet_address, completion_percentage, completed_lessons, total_lessons, completed_at, created_at, updated_at, lesson_data'
      )
      .eq('course_slug', courseSlug)
      .order('updated_at', { ascending: false });

    if (progressError) {
      console.error('[FREE COURSE API] Error fetching progress:', progressError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch course progress' },
        { status: 500 }
      );
    }

    const sanitizedProgress: ProgressRow[] = (progressRows || []).map((row) => ({
      wallet_address: row.wallet_address,
      completion_percentage: row.completion_percentage ?? 0,
      completed_lessons: row.completed_lessons ?? 0,
      total_lessons: row.total_lessons ?? 0,
      completed_at: row.completed_at ?? null,
      created_at: row.created_at ?? null,
      updated_at: row.updated_at ?? null,
      lesson_data: row.lesson_data ?? [],
    }));

    const walletAddresses = Array.from(
      new Set(
        sanitizedProgress
          .map((row) => row.wallet_address)
          .filter((wallet): wallet is string => Boolean(wallet))
      )
    );

    const usersMap = new Map<string, UserRow>();
    const previewMap = new Map<string, PreviewRow>();

    if (walletAddresses.length > 0) {
      const { data: usersRows, error: usersError } = await supabase
        .from('users')
        .select(
          'wallet_address, display_name, squad, squad_id, total_xp, level, last_active, created_at'
        )
        .in('wallet_address', walletAddresses);

      if (usersError) {
        console.error('[FREE COURSE API] Error fetching users:', usersError);
      } else {
        (usersRows || []).forEach((user) => {
          usersMap.set(user.wallet_address, {
            wallet_address: user.wallet_address,
            display_name: user.display_name ?? null,
            squad: user.squad ?? null,
            squad_id: user.squad_id ?? null,
            total_xp: user.total_xp ?? 0,
            level: user.level ?? null,
            last_active: user.last_active ?? null,
            created_at: user.created_at ?? null,
          });
        });
      }

      const { data: previewRows, error: previewError } = await supabase
        .from('preview_submissions')
        .select('wallet_address, email, submitted_at, created_at')
        .in('wallet_address', walletAddresses);

      if (previewError) {
        console.warn('[FREE COURSE API] Preview submissions lookup failed:', previewError);
      } else {
        (previewRows || []).forEach((preview) => {
          if (preview.wallet_address) {
            previewMap.set(preview.wallet_address, {
              wallet_address: preview.wallet_address,
              email: preview.email ?? null,
              submitted_at: preview.submitted_at ?? preview.created_at ?? null,
              created_at: preview.created_at ?? null,
            });
          }
        });
      }
    }

    const totals = sanitizedProgress.reduce(
      (acc, row) => {
        const completion = row.completion_percentage ?? 0;
        acc.total += 1;
        acc.sumCompletion += completion;

        if (completion >= 100) {
          acc.completed += 1;
        } else if (completion > 0) {
          acc.inProgress += 1;
        } else {
          acc.notStarted += 1;
        }

        return acc;
      },
      {
        total: 0,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        sumCompletion: 0,
      }
    );

    const participants = sanitizedProgress.map((row) => {
      const user = usersMap.get(row.wallet_address);
      const preview = previewMap.get(row.wallet_address);

      return {
        wallet_address: row.wallet_address,
        display_name: user?.display_name || null,
        squad: user?.squad || user?.squad_id || null,
        total_xp: user?.total_xp ?? 0,
        level: user?.level ?? null,
        completion_percentage: row.completion_percentage ?? 0,
        completed_lessons: row.completed_lessons ?? 0,
        total_lessons: row.total_lessons ?? 0,
        started_at: row.created_at,
        last_updated: row.updated_at,
        completed_at: row.completed_at,
        lesson_data: row.lesson_data,
        last_active: user?.last_active || null,
        preview_submission: preview
          ? {
              email: preview.email,
              submitted_at: preview.submitted_at,
            }
          : null,
      };
    });

    const stats = {
      total: totals.total,
      completed: totals.completed,
      in_progress: totals.inProgress,
      not_started: totals.notStarted,
      average_progress:
        totals.total > 0 ? Number((totals.sumCompletion / totals.total).toFixed(2)) : 0,
      completion_rate:
        totals.total > 0 ? Number(((totals.completed / totals.total) * 100).toFixed(2)) : 0,
    };

    return NextResponse.json({
      success: true,
      course_slug: courseSlug,
      stats,
      participants,
      last_updated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[FREE COURSE API] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


