'use client';

import { getSupabaseBrowser } from '@/lib/supabaseClient';

export interface CourseProgress {
  id: string;
  user_id: string;
  course_id: string;
  completed_lessons: string[];
  progress_percentage: number;
  last_accessed: string;
  created_at: string;
  updated_at: string;
}

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  completedAt?: string;
  score?: number;
}

export class CourseProgressService {
  private supabase = getSupabaseBrowser();

  /**
   * Get course progress for a specific user and course
   */
  async getCourseProgress(userId: string, courseId: string): Promise<CourseProgress | null> {
    try {
      const { data, error } = await this.supabase
        .from('course_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching course progress:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getCourseProgress:', error);
      return null;
    }
  }

  /**
   * Get all course progress for a user
   */
  async getUserCourseProgress(userId: string): Promise<CourseProgress[]> {
    try {
      const { data, error } = await this.supabase
        .from('course_progress')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching user course progress:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserCourseProgress:', error);
      return [];
    }
  }

  /**
   * Create or update course progress
   */
  async upsertCourseProgress(
    userId: string, 
    courseId: string, 
    completedLessons: string[], 
    progressPercentage: number
  ): Promise<CourseProgress | null> {
    try {
      const progressData = {
        user_id: userId,
        course_id: courseId,
        completed_lessons: completedLessons,
        progress_percentage: progressPercentage,
        last_accessed: new Date().toISOString(),
      };

      const { data, error } = await this.supabase
        .from('course_progress')
        .upsert(progressData, { 
          onConflict: 'user_id,course_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) {
        console.error('Error upserting course progress:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in upsertCourseProgress:', error);
      return null;
    }
  }

  /**
   * Mark a lesson as completed
   */
  async completeLesson(
    userId: string, 
    courseId: string, 
    lessonId: string
  ): Promise<boolean> {
    try {
      // Get current progress
      const currentProgress = await this.getCourseProgress(userId, courseId);
      
      let completedLessons = currentProgress?.completed_lessons || [];
      let progressPercentage = currentProgress?.progress_percentage || 0;

      // Add lesson if not already completed
      if (!completedLessons.includes(lessonId)) {
        completedLessons.push(lessonId);
        
        // Calculate new progress percentage (you may need to adjust this based on your course structure)
        // For now, assuming each lesson is worth equal percentage
        const totalLessons = 10; // This should come from your course data
        progressPercentage = Math.min(100, Math.round((completedLessons.length / totalLessons) * 100));
      }

      // Update progress
      const result = await this.upsertCourseProgress(
        userId, 
        courseId, 
        completedLessons, 
        progressPercentage
      );

      return result !== null;
    } catch (error) {
      console.error('Error in completeLesson:', error);
      return false;
    }
  }

  /**
   * Get progress percentage for a course
   */
  async getProgressPercentage(userId: string, courseId: string): Promise<number> {
    try {
      const progress = await this.getCourseProgress(userId, courseId);
      return progress?.progress_percentage || 0;
    } catch (error) {
      console.error('Error in getProgressPercentage:', error);
      return 0;
    }
  }

  /**
   * Check if a lesson is completed
   */
  async isLessonCompleted(
    userId: string, 
    courseId: string, 
    lessonId: string
  ): Promise<boolean> {
    try {
      const progress = await this.getCourseProgress(userId, courseId);
      return progress?.completed_lessons.includes(lessonId) || false;
    } catch (error) {
      console.error('Error in isLessonCompleted:', error);
      return false;
    }
  }

  /**
   * Reset course progress for a user
   */
  async resetCourseProgress(userId: string, courseId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('course_progress')
        .delete()
        .eq('user_id', userId)
        .eq('course_id', courseId);

      if (error) {
        console.error('Error resetting course progress:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in resetCourseProgress:', error);
      return false;
    }
  }

  /**
   * Get course completion status
   */
  async getCourseCompletionStatus(userId: string, courseId: string): Promise<{
    completed: boolean;
    progressPercentage: number;
    completedLessons: string[];
  }> {
    try {
      const progress = await this.getCourseProgress(userId, courseId);
      
      return {
        completed: progress?.progress_percentage === 100 || false,
        progressPercentage: progress?.progress_percentage || 0,
        completedLessons: progress?.completed_lessons || [],
      };
    } catch (error) {
      console.error('Error in getCourseCompletionStatus:', error);
      return {
        completed: false,
        progressPercentage: 0,
        completedLessons: [],
      };
    }
  }
}

// Export a singleton instance
export const courseProgressService = new CourseProgressService();
