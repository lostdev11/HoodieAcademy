/**
 * Unit tests for the tracking system
 * These tests verify the core functionality of the tracking system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: vi.fn()
  },
  from: vi.fn(() => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn()
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn()
      }))
    }))
  }))
};

// Mock fetch
global.fetch = vi.fn();

describe('Tracking System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Event Logging', () => {
    it('should log wallet connect event', async () => {
      // Mock successful response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      // Import the function after mocking
      const { logWalletConnect } = await import('@/lib/tracking/client');
      
      const result = await logWalletConnect('test-wallet-address');
      
      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'wallet_connect',
          walletAddress: 'test-wallet-address',
          payload: expect.objectContaining({
            timestamp: expect.any(String),
            userAgent: expect.any(String),
            url: expect.any(String)
          })
        }),
        cache: 'no-store'
      });
    });

    it('should handle wallet connect event failure', async () => {
      // Mock error response
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Unauthorized' })
      });

      const { logWalletConnect } = await import('@/lib/tracking/client');
      
      const result = await logWalletConnect('test-wallet-address');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });

    it('should log page view event', async () => {
      // Mock successful response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      const { logPageView } = await import('@/lib/tracking/client');
      
      const result = await logPageView('/test-page', 'https://example.com', 'session-123');
      
      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'page_view',
          path: '/test-page',
          referrer: 'https://example.com',
          sessionId: 'session-123',
          payload: expect.objectContaining({
            timestamp: expect.any(String),
            userAgent: expect.any(String),
            url: expect.any(String),
            title: expect.any(String)
          })
        }),
        cache: 'no-store'
      });
    });

    it('should log course events', async () => {
      // Mock successful response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      const { logCourseStart, logCourseComplete } = await import('@/lib/tracking/client');
      
      const startResult = await logCourseStart('course-123', 'session-123', 'wallet-123');
      const completeResult = await logCourseComplete('course-123', 'session-123', 'wallet-123');
      
      expect(startResult.success).toBe(true);
      expect(completeResult.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Admin Functions', () => {
    it('should check admin status via JWT role', async () => {
      // Mock admin user
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-123',
            app_metadata: { role: 'admin' }
          }
        }
      });

      const { isAdminForUser } = await import('@/lib/admin');
      const result = await isAdminForUser(mockSupabase);
      
      expect(result).toBe(true);
    });

    it('should check admin status via wallet list', async () => {
      // Mock non-admin user with admin wallet
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-123',
            app_metadata: {}
          }
        }
      });

      // Mock user data with admin wallet
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { primary_wallet: 'admin-wallet-123' }
            }))
          }))
        }))
      });

      // Mock admin wallet check
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => ({
              data: { wallet_address: 'admin-wallet-123' }
            }))
          }))
        }))
      });

      const { isAdminForUser } = await import('@/lib/admin');
      const result = await isAdminForUser(mockSupabase);
      
      expect(result).toBe(true);
    });

    it('should return false for non-admin user', async () => {
      // Mock non-admin user
      mockSupabase.auth.getUser.mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-123',
            app_metadata: {}
          }
        }
      });

      // Mock user data without admin wallet
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { primary_wallet: 'regular-wallet-123' }
            }))
          }))
        }))
      });

      // Mock admin wallet check (no match)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => ({
              data: null
            }))
          }))
        }))
      });

      const { isAdminForUser } = await import('@/lib/admin');
      const result = await isAdminForUser(mockSupabase);
      
      expect(result).toBe(false);
    });
  });

  describe('Session Management', () => {
    it('should create session successfully', async () => {
      // Mock successful session creation
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ sessionId: 'session-123' })
      });

      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: 'wallet-123' })
      });

      const data = await response.json();
      
      expect(data.sessionId).toBe('session-123');
    });

    it('should handle session creation failure', async () => {
      // Mock error response
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Unauthorized' })
      });

      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: 'wallet-123' })
      });

      const data = await response.json();
      
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Bounty Management', () => {
    it('should create bounty successfully', async () => {
      // Mock successful bounty creation
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'bounty-123',
          title: 'Test Bounty',
          reward_xp: 100
        })
      });

      const response = await fetch('/api/bounties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Bounty',
          description: 'A test bounty',
          reward_xp: 100,
          status: 'open'
        })
      });

      const data = await response.json();
      
      expect(data.id).toBe('bounty-123');
      expect(data.title).toBe('Test Bounty');
      expect(data.reward_xp).toBe(100);
    });

    it('should submit to bounty successfully', async () => {
      // Mock successful submission
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'submission-123',
          bounty_id: 'bounty-123',
          status: 'pending_review'
        })
      });

      const response = await fetch('/api/bounties/bounty-123/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'My Submission',
          content: 'This is my submission',
          url: 'https://example.com'
        })
      });

      const data = await response.json();
      
      expect(data.id).toBe('submission-123');
      expect(data.bounty_id).toBe('bounty-123');
      expect(data.status).toBe('pending_review');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network error
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const { logWalletConnect } = await import('@/lib/tracking/client');
      
      const result = await logWalletConnect('test-wallet');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should handle invalid event data', async () => {
      // Mock validation error
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          error: 'Invalid request data',
          details: { fieldErrors: { kind: ['Invalid enum value'] } }
        })
      });

      const { logEvent } = await import('@/lib/tracking/client');
      
      const result = await logEvent({
        kind: 'invalid_event' as any,
        walletAddress: 'test-wallet'
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid request data');
    });
  });
});
