// =====================================================
// TRACKING SYSTEM TYPES FOR HOODIE ACADEMY
// =====================================================

export type EventKind =
  | 'wallet_connect'
  | 'wallet_disconnect'
  | 'page_view'
  | 'course_start'
  | 'course_complete'
  | 'lesson_start'
  | 'lesson_complete'
  | 'exam_started'
  | 'exam_submitted'
  | 'exam_approved'
  | 'exam_rejected'
  | 'placement_started'
  | 'placement_completed'
  | 'custom';

export type BountyStatus = 'draft' | 'open' | 'closed';
export type SubmissionStatus = 'pending_review' | 'approved' | 'rejected' | 'needs_revision';
export type XPSource = 'bounty_submission' | 'admin_adjustment' | 'course' | 'other';

// =====================================================
// CORE TRACKING INTERFACES
// =====================================================

export interface TrackingEvent {
  kind: EventKind;
  path?: string;
  referrer?: string;
  payload?: Record<string, unknown>;
  sessionId?: string;
  walletAddress?: string;
  courseId?: string;
  lessonId?: string;
  examId?: string;
}

export interface Session {
  id: string;
  user_id: string;
  wallet_address?: string;
  started_at: string;
  last_heartbeat_at: string;
  ended_at?: string;
  user_agent?: string;
  ip?: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  address: string;
  label?: string;
  is_primary: boolean;
  connected_first_at?: string;
  connected_last_at?: string;
  created_at: string;
}

export interface EventLog {
  id: number;
  user_id: string;
  session_id?: string;
  wallet_address?: string;
  kind: EventKind;
  path?: string;
  referrer?: string;
  course_id?: string;
  lesson_id?: string;
  exam_id?: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface CourseProgress {
  id: string;
  user_id: string;
  course_id: string;
  started_at?: string;
  completed_at?: string;
  last_event_at?: string;
  progress_percent: number;
}

export interface PlacementProgress {
  id: string;
  user_id: string;
  status: 'not_started' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
  started_at?: string;
  submitted_at?: string;
  decided_at?: string;
  decided_by?: string;
  score?: number;
  notes?: string;
}

// =====================================================
// BOUNTY SYSTEM INTERFACES
// =====================================================

export interface Bounty {
  id: string;
  slug?: string;
  title: string;
  description?: string;
  reward_xp: number;
  status: BountyStatus;
  created_by?: string;
  open_at?: string;
  close_at?: string;
  tags: string[];
  max_submissions?: number;
  allow_multiple_submissions: boolean;
  created_at: string;
  updated_at: string;
}

export interface BountySubmission {
  id: string;
  bounty_id: string;
  user_id: string;
  wallet_address?: string;
  title?: string;
  content?: string;
  url?: string;
  evidence_links: string[];
  status: SubmissionStatus;
  score?: number;
  reviewer_id?: string;
  reviewed_at?: string;
  feedback?: string;
  created_at: string;
  updated_at: string;
}

export interface XPEvent {
  id: number;
  user_id: string;
  source: XPSource;
  source_id?: string;
  delta: number;
  reason?: string;
  created_at: string;
}

export interface XPBalance {
  user_id: string;
  total_xp: number;
}

// =====================================================
// ADMIN INTERFACES
// =====================================================

export interface AdminApproval {
  id: string;
  admin_id: string;
  user_id: string;
  resource_kind: 'exam' | 'placement';
  resource_id: string;
  action: 'approved' | 'rejected';
  reason?: string;
  created_at: string;
}

export interface AdminWallet {
  wallet_address: string;
  label?: string;
  created_at: string;
}

// =====================================================
// ANALYTICS INTERFACES
// =====================================================

export interface DailyActivity {
  day: string;
  dau: number;
}

export interface InactiveUser {
  user_id: string;
  wallet_address: string;
  display_name?: string;
  last_active_at?: string;
}

// =====================================================
// API REQUEST/RESPONSE INTERFACES
// =====================================================

export interface TrackEventRequest {
  kind: EventKind;
  path?: string;
  referrer?: string;
  payload?: Record<string, unknown>;
  sessionId?: string;
  walletAddress?: string;
  courseId?: string;
  lessonId?: string;
  examId?: string;
}

export interface CreateSessionRequest {
  walletAddress?: string;
}

export interface CreateSessionResponse {
  sessionId: string;
}

export interface EndSessionRequest {
  sessionId: string;
}

export interface CreateBountyRequest {
  title: string;
  description?: string;
  slug?: string;
  reward_xp?: number;
  status?: BountyStatus;
  open_at?: string;
  close_at?: string;
  tags?: string[];
  max_submissions?: number;
  allow_multiple_submissions?: boolean;
}

export interface UpdateBountyRequest extends Partial<CreateBountyRequest> {
  id: string;
}

export interface CreateSubmissionRequest {
  title?: string;
  content?: string;
  url?: string;
  evidence_links?: string[];
  wallet_address?: string;
}

export interface ModerateSubmissionRequest {
  status: SubmissionStatus;
  score?: number;
  feedback?: string;
}

export interface AdjustXPRequest {
  user_id: string;
  delta: number;
  reason: string;
}

// =====================================================
// DASHBOARD INTERFACES
// =====================================================

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  liveUsers: number;
  newWallets24h: number;
  newWallets7d: number;
  totalBounties: number;
  openBounties: number;
  pendingSubmissions: number;
  totalXP: number;
  topCourses: Array<{
    course_id: string;
    active_users: number;
  }>;
  inactiveUsers: InactiveUser[];
}

export interface UserTrackingData {
  user: {
    id: string;
    wallet_address: string;
    display_name?: string;
    squad?: string;
    primary_wallet?: string;
    last_active_at?: string;
    created_at: string;
    is_admin: boolean;
  };
  stats: {
    total_xp: number;
    bounty_xp: number;
    course_xp: number;
    total_submissions: number;
    approved_submissions: number;
    pending_submissions: number;
    rejected_submissions: number;
    last_active: string | null;
  };
  recent_events: EventLog[];
  submissions: BountySubmission[];
  xp_events: XPEvent[];
}

// =====================================================
// HOOK INTERFACES
// =====================================================

export interface UseWalletTrackingOptions {
  walletAddress: string | null;
  sessionId?: string | null;
  autoStart?: boolean;
}

export interface UsePageViewOptions {
  sessionId?: string | null;
  debounceMs?: number;
}

export interface UseSessionTrackingOptions {
  walletAddress?: string | null;
  autoStart?: boolean;
  heartbeatInterval?: number;
}

export interface UseCourseEventsOptions {
  sessionId?: string | null;
  walletAddress?: string | null;
}

// =====================================================
// ERROR INTERFACES
// =====================================================

export interface TrackingError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface APIError {
  error: string;
  details?: Record<string, unknown>;
}