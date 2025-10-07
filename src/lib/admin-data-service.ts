'use client';

// Central service for fetching all admin dashboard data with clean, consistent logic

export interface AdminDashboardData {
  users: AdminUser[];
  bounties: AdminBounty[];
  submissions: AdminSubmission[];
  announcements: AdminAnnouncement[];
  events: AdminEvent[];
  courses: AdminCourse[];
  stats: AdminStats;
}

export interface AdminUser {
  id: string;
  wallet_address: string;
  display_name: string;
  squad?: string;
  created_at: string;
  last_active?: string;
  is_admin: boolean;
  profile_completed: boolean;
  squad_test_completed: boolean;
  placement_test_completed: boolean;
  username?: string;
  bio?: string;
  profile_picture?: string;
  total_xp?: number;
  level?: number;
}

export interface AdminBounty {
  id: string;
  title: string;
  short_desc: string;
  reward: string;
  reward_type: 'XP' | 'SOL' | 'NFT';
  start_date?: string;
  deadline?: string;
  status: 'active' | 'completed' | 'expired';
  hidden: boolean;
  squad_tag?: string;
  submissions: number;
  nft_prize?: string;
  nft_prize_image?: string;
  nft_prize_description?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminSubmission {
  id: string;
  bounty_id: string;
  wallet_address: string;
  submission_content: string;
  submission_type: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  bounty?: AdminBounty;
  user?: AdminUser;
}

export interface AdminAnnouncement {
  id: string;
  title: string;
  content: string;
  type: string;
  priority: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminEvent {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date?: string;
  location?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: string;
  duration: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  newUsersToday: number;
  totalBounties: number;
  activeBounties: number;
  hiddenBounties: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
  totalAnnouncements: number;
  activeAnnouncements: number;
  totalEvents: number;
  activeEvents: number;
  totalCourses: number;
  publishedCourses: number;
}

export class AdminDataService {
  private static instance: AdminDataService;

  static getInstance(): AdminDataService {
    if (!AdminDataService.instance) {
      AdminDataService.instance = new AdminDataService();
    }
    return AdminDataService.instance;
  }

  /**
   * Fetch all admin dashboard data in one call
   */
  async getAllAdminData(): Promise<AdminDashboardData> {
    try {
      console.log('🔄 [ADMIN DATA SERVICE] Fetching all admin data...');
      
      // Fetch all data in parallel for better performance
      const [users, bounties, submissions, announcements, events, courses] = await Promise.all([
        this.fetchUsers(),
        this.fetchBounties(),
        this.fetchSubmissions(),
        this.fetchAnnouncements(),
        this.fetchEvents(),
        this.fetchCourses()
      ]);

      // Calculate comprehensive stats
      const stats = this.calculateStats(users, bounties, submissions, announcements, events, courses);

      console.log('✅ [ADMIN DATA SERVICE] All admin data fetched successfully');
      
      return {
        users,
        bounties,
        submissions,
        announcements,
        events,
        courses,
        stats
      };
    } catch (error) {
      console.error('❌ [ADMIN DATA SERVICE] Error fetching admin data:', error);
      throw error;
    }
  }

  /**
   * Fetch users data
   */
  async fetchUsers(): Promise<AdminUser[]> {
    try {
      console.log('👥 [ADMIN DATA SERVICE] Fetching users...');
      
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }
      
      const result = await response.json();
      const users = result.users || [];
      console.log('✅ [ADMIN DATA SERVICE] Fetched users:', users.length);
      return users;
    } catch (error) {
      console.error('❌ [ADMIN DATA SERVICE] Error fetching users:', error);
      return [];
    }
  }

  /**
   * Fetch bounties data
   */
  async fetchBounties(): Promise<AdminBounty[]> {
    try {
      console.log('🎯 [ADMIN DATA SERVICE] Fetching bounties...');
      
      const response = await fetch('/api/bounties');
      if (!response.ok) {
        throw new Error(`Failed to fetch bounties: ${response.status}`);
      }
      
      const bounties = await response.json();
      console.log('✅ [ADMIN DATA SERVICE] Fetched bounties:', bounties.length);
      return bounties;
    } catch (error) {
      console.error('❌ [ADMIN DATA SERVICE] Error fetching bounties:', error);
      return [];
    }
  }

  /**
   * Fetch submissions data
   */
  async fetchSubmissions(): Promise<AdminSubmission[]> {
    try {
      console.log('📝 [ADMIN DATA SERVICE] Fetching submissions...');
      
      const response = await fetch('/api/admin/submissions');
      if (!response.ok) {
        throw new Error(`Failed to fetch submissions: ${response.status}`);
      }
      
      const result = await response.json();
      const submissions = result.submissions || [];
      console.log('✅ [ADMIN DATA SERVICE] Fetched submissions:', submissions.length);
      return submissions;
    } catch (error) {
      console.error('❌ [ADMIN DATA SERVICE] Error fetching submissions:', error);
      return [];
    }
  }

  /**
   * Fetch announcements data
   */
  async fetchAnnouncements(): Promise<AdminAnnouncement[]> {
    try {
      console.log('📢 [ADMIN DATA SERVICE] Fetching announcements...');
      
      const response = await fetch('/api/announcements');
      if (!response.ok) {
        throw new Error(`Failed to fetch announcements: ${response.status}`);
      }
      
      const result = await response.json();
      // Announcements API returns { success: true, announcements: [...] } format
      const announcements = result.announcements || result;
      console.log('✅ [ADMIN DATA SERVICE] Fetched announcements:', announcements.length);
      return announcements;
    } catch (error) {
      console.error('❌ [ADMIN DATA SERVICE] Error fetching announcements:', error);
      return [];
    }
  }

  /**
   * Fetch events data
   */
  async fetchEvents(): Promise<AdminEvent[]> {
    try {
      console.log('📅 [ADMIN DATA SERVICE] Fetching events...');
      
      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`);
      }
      
      const result = await response.json();
      // Events API returns { data: [...] } format
      const events = result.data || result;
      console.log('✅ [ADMIN DATA SERVICE] Fetched events:', events.length);
      return events;
    } catch (error) {
      console.error('❌ [ADMIN DATA SERVICE] Error fetching events:', error);
      return [];
    }
  }

  /**
   * Fetch courses data
   */
  async fetchCourses(): Promise<AdminCourse[]> {
    try {
      console.log('📚 [ADMIN DATA SERVICE] Fetching courses...');
      
      const response = await fetch('/api/courses');
      if (!response.ok) {
        console.warn('⚠️ [ADMIN DATA SERVICE] Courses API failed, returning empty array');
        return [];
      }
      
      const courses = await response.json();
      console.log('✅ [ADMIN DATA SERVICE] Fetched courses:', courses.length);
      return courses;
    } catch (error) {
      console.error('❌ [ADMIN DATA SERVICE] Error fetching courses:', error);
      return [];
    }
  }

  /**
   * Calculate comprehensive stats from all data
   */
  private calculateStats(
    users: AdminUser[],
    bounties: AdminBounty[],
    submissions: AdminSubmission[],
    announcements: AdminAnnouncement[],
    events: AdminEvent[],
    courses: AdminCourse[]
  ): AdminStats {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      // User stats
      totalUsers: users.length,
      activeUsers: users.filter(user => {
        if (!user.last_active) return false;
        const lastActive = new Date(user.last_active);
        const diffHours = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
        return diffHours < 24;
      }).length,
      adminUsers: users.filter(user => user.is_admin).length,
      newUsersToday: users.filter(user => {
        const created = new Date(user.created_at);
        return created >= today;
      }).length,

      // Bounty stats
      totalBounties: bounties.length,
      activeBounties: bounties.filter(bounty => bounty.status === 'active').length,
      hiddenBounties: bounties.filter(bounty => bounty.hidden).length,

      // Submission stats
      totalSubmissions: submissions.length,
      pendingSubmissions: submissions.filter(sub => sub.status === 'pending').length,
      approvedSubmissions: submissions.filter(sub => sub.status === 'approved').length,

      // Announcement stats
      totalAnnouncements: announcements.length,
      activeAnnouncements: announcements.filter(ann => ann.is_active).length,

      // Event stats
      totalEvents: events.length,
      activeEvents: events.filter(event => event.is_active).length,

      // Course stats
      totalCourses: courses.length,
      publishedCourses: courses.filter(course => course.is_published).length
    };
  }

  /**
   * Refresh specific data type
   */
  async refreshData(type: 'users' | 'bounties' | 'submissions' | 'announcements' | 'events' | 'courses') {
    console.log(`🔄 [ADMIN DATA SERVICE] Refreshing ${type}...`);
    
    switch (type) {
      case 'users':
        return await this.fetchUsers();
      case 'bounties':
        return await this.fetchBounties();
      case 'submissions':
        return await this.fetchSubmissions();
      case 'announcements':
        return await this.fetchAnnouncements();
      case 'events':
        return await this.fetchEvents();
      case 'courses':
        return await this.fetchCourses();
      default:
        throw new Error(`Unknown data type: ${type}`);
    }
  }
}

export const adminDataService = AdminDataService.getInstance();
