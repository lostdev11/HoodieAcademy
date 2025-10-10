'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWalletSupabase } from './use-wallet-supabase';

export interface Course {
  id: string;
  title: string;
  description?: string;
  content?: string;
  squad_id: string;
  squad_name: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimated_duration: number;
  xp_reward: number;
  is_published: boolean;
  is_hidden: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  tags: string[];
  prerequisites: string[];
  order_index: number;
  course_sections?: CourseSection[];
}

export interface CourseSection {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  content?: string;
  order_index: number;
  is_required: boolean;
  estimated_duration?: number;
  created_at: string;
  updated_at: string;
}

export interface CourseProgress {
  id: string;
  user_wallet: string;
  course_id: string;
  progress_percentage: number;
  is_completed: boolean;
  completed_at?: string;
  started_at: string;
  last_accessed_at: string;
  time_spent: number;
  current_section?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  courses?: Course;
}

export interface SectionProgress {
  id: string;
  user_wallet: string;
  section_id: string;
  course_id: string;
  is_completed: boolean;
  completed_at?: string;
  time_spent: number;
  created_at: string;
  updated_at: string;
  course_sections?: CourseSection;
  courses?: Course;
}

export interface CourseSummary {
  total_courses: number;
  completed_courses: number;
  in_progress_courses: number;
  total_xp_earned: number;
}

/**
 * Hook for managing courses
 */
export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { wallet } = useWalletSupabase();

  const fetchCourses = useCallback(async (squadId?: string, includeHidden = false) => {
    if (!wallet) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        wallet_address: wallet,
        include_hidden: includeHidden.toString()
      });

      if (squadId) {
        params.append('squad_id', squadId);
      }

      const response = await fetch(`/api/courses?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();
      setCourses(data.courses || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  const createCourse = useCallback(async (courseData: Partial<Course>) => {
    if (!wallet) {
      throw new Error('Wallet not connected');
    }

    const response = await fetch('/api/courses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...courseData,
        created_by: wallet
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create course');
    }

    const result = await response.json();
    return result.course;
  }, [wallet]);

  const updateCourse = useCallback(async (courseId: string, courseData: Partial<Course>) => {
    if (!wallet) {
      throw new Error('Wallet not connected');
    }

    const response = await fetch(`/api/courses/${courseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...courseData,
        updated_by: wallet
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update course');
    }

    const result = await response.json();
    return result.course;
  }, [wallet]);

  const deleteCourse = useCallback(async (courseId: string) => {
    if (!wallet) {
      throw new Error('Wallet not connected');
    }

    const response = await fetch(`/api/courses/${courseId}?deleted_by=${wallet}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete course');
    }

    return true;
  }, [wallet]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return {
    courses,
    loading,
    error,
    fetchCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    refetch: () => fetchCourses()
  };
}

/**
 * Hook for managing course progress
 */
export function useCourseProgress() {
  const [progress, setProgress] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { wallet } = useWalletSupabase();

  const fetchProgress = useCallback(async (courseId?: string) => {
    if (!wallet) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        wallet_address: wallet
      });

      if (courseId) {
        params.append('course_id', courseId);
      }

      const response = await fetch(`/api/courses/progress?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch course progress');
      }

      const data = await response.json();
      setProgress(Array.isArray(data.progress) ? data.progress : [data.progress].filter(Boolean));
    } catch (err) {
      console.error('Error fetching course progress:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch course progress');
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  const updateProgress = useCallback(async (courseId: string, progressData: {
    progress_percentage?: number;
    current_section?: string;
    notes?: string;
    time_spent?: number;
  }) => {
    if (!wallet) {
      throw new Error('Wallet not connected');
    }

    const response = await fetch('/api/courses/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        wallet_address: wallet,
        course_id: courseId,
        ...progressData
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update course progress');
    }

    const result = await response.json();
    return result.progress;
  }, [wallet]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return {
    progress,
    loading,
    error,
    fetchProgress,
    updateProgress,
    refetch: () => fetchProgress()
  };
}

/**
 * Hook for managing section progress
 */
export function useSectionProgress() {
  const [progress, setProgress] = useState<SectionProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { wallet } = useWalletSupabase();

  const fetchProgress = useCallback(async (courseId?: string, sectionId?: string) => {
    if (!wallet) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        wallet_address: wallet
      });

      if (courseId) {
        params.append('course_id', courseId);
      }

      if (sectionId) {
        params.append('section_id', sectionId);
      }

      const response = await fetch(`/api/courses/sections/progress?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch section progress');
      }

      const data = await response.json();
      setProgress(Array.isArray(data.progress) ? data.progress : [data.progress].filter(Boolean));
    } catch (err) {
      console.error('Error fetching section progress:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch section progress');
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  const updateProgress = useCallback(async (sectionId: string, courseId: string, progressData: {
    is_completed?: boolean;
    time_spent?: number;
  }) => {
    if (!wallet) {
      throw new Error('Wallet not connected');
    }

    const response = await fetch('/api/courses/sections/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        wallet_address: wallet,
        section_id: sectionId,
        course_id: courseId,
        ...progressData
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update section progress');
    }

    const result = await response.json();
    return result.progress;
  }, [wallet]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return {
    progress,
    loading,
    error,
    fetchProgress,
    updateProgress,
    refetch: () => fetchProgress()
  };
}

/**
 * Hook for getting course summary statistics
 */
export function useCourseSummary() {
  const [summary, setSummary] = useState<CourseSummary>({
    total_courses: 0,
    completed_courses: 0,
    in_progress_courses: 0,
    total_xp_earned: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { wallet } = useWalletSupabase();

  const fetchSummary = useCallback(async () => {
    if (!wallet) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Calculate summary from course progress
      const response = await fetch(`/api/courses/progress?wallet_address=${wallet}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch course summary');
      }

      const data = await response.json();
      const progressList = data.progress || [];

      const summary: CourseSummary = {
        total_courses: progressList.length,
        completed_courses: progressList.filter((p: CourseProgress) => p.is_completed).length,
        in_progress_courses: progressList.filter((p: CourseProgress) => p.progress_percentage > 0 && !p.is_completed).length,
        total_xp_earned: progressList
          .filter((p: CourseProgress) => p.is_completed && p.courses)
          .reduce((total: number, p: CourseProgress) => total + (p.courses?.xp_reward || 0), 0)
      };

      setSummary(summary);
    } catch (err) {
      console.error('Error fetching course summary:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch course summary');
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    loading,
    error,
    refetch: fetchSummary
  };
}
