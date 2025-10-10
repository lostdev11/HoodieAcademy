// API-based course progress utilities
// Database is the source of truth, localStorage is only cache

export type LessonStatus = 'locked' | 'unlocked' | 'completed';

export interface LessonProgress {
  index: number;
  status: LessonStatus;
}

export interface CourseProgress {
  wallet_address: string;
  course_slug: string;
  lesson_data: LessonProgress[];
  completion_percentage: number;
  total_lessons: number;
  completed_lessons: number;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch course progress from database
 * This is the source of truth
 */
export async function fetchCourseProgress(
  walletAddress: string,
  courseSlug: string
): Promise<CourseProgress | null> {
  try {
    const response = await fetch(
      `/api/course-progress?wallet_address=${walletAddress}&course_slug=${courseSlug}&t=${Date.now()}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      console.error('Failed to fetch course progress:', response.status);
      return null;
    }

    const data = await response.json();

    // Cache in localStorage
    if (data.hasProgress && data.progress) {
      const cacheKey = `course_progress_${courseSlug}`;
      localStorage.setItem(cacheKey, JSON.stringify({
        progress: data.progress,
        lastFetched: new Date().toISOString()
      }));
    }

    return data.hasProgress ? data.progress : null;
  } catch (error) {
    console.error('Error fetching course progress:', error);
    return null;
  }
}

/**
 * Get lesson status array from course progress
 */
export function getLessonStatusArray(progress: CourseProgress | null, totalLessons: number): LessonStatus[] {
  if (!progress || !progress.lesson_data) {
    // Default: first lesson unlocked, rest locked
    return Array(totalLessons).fill('locked').map((_, i) => i === 0 ? 'unlocked' : 'locked');
  }

  const statusArray: LessonStatus[] = Array(totalLessons).fill('locked');
  
  progress.lesson_data.forEach((lesson) => {
    if (lesson.index < totalLessons) {
      statusArray[lesson.index] = lesson.status;
    }
  });

  return statusArray;
}

/**
 * Update lesson progress in database
 */
export async function updateLessonProgress(
  walletAddress: string,
  courseSlug: string,
  lessonIndex: number,
  status: LessonStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/course-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet_address: walletAddress,
        course_slug: courseSlug,
        lesson_index: lessonIndex,
        status
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to update progress'
      };
    }

    // Update cache
    if (result.progress) {
      const cacheKey = `course_progress_${courseSlug}`;
      localStorage.setItem(cacheKey, JSON.stringify({
        progress: result.progress,
        lastFetched: new Date().toISOString()
      }));
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating lesson progress:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update progress'
    };
  }
}

/**
 * Update full course progress (array of lesson statuses)
 */
export async function updateCourseProgress(
  walletAddress: string,
  courseSlug: string,
  lessonStatusArray: LessonStatus[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Convert array to lesson data format
    const lessonData = lessonStatusArray.map((status, index) => ({
      index,
      status
    }));

    const response = await fetch('/api/course-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet_address: walletAddress,
        course_slug: courseSlug,
        lesson_data: lessonData
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to update progress'
      };
    }

    // Update cache
    if (result.progress) {
      const cacheKey = `course_progress_${courseSlug}`;
      localStorage.setItem(cacheKey, JSON.stringify({
        progress: result.progress,
        lastFetched: new Date().toISOString()
      }));
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating course progress:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update progress'
    };
  }
}

/**
 * Get cached course progress (for instant display)
 * Returns null if cache is stale or missing
 */
export function getCachedCourseProgress(courseSlug: string): CourseProgress | null {
  try {
    const cacheKey = `course_progress_${courseSlug}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) return null;

    const { progress, lastFetched } = JSON.parse(cached);
    const cacheAge = (new Date().getTime() - new Date(lastFetched).getTime()) / 60000;

    // Cache valid for 5 minutes
    if (cacheAge < 5) {
      return progress;
    }

    return null;
  } catch (error) {
    console.error('Error reading course progress cache:', error);
    return null;
  }
}

/**
 * Get lesson status from cache (quick, synchronous)
 */
export function getCachedLessonStatus(courseSlug: string, totalLessons: number): LessonStatus[] {
  const cached = getCachedCourseProgress(courseSlug);
  return getLessonStatusArray(cached, totalLessons);
}

/**
 * Clear course progress cache
 */
export function clearCourseProgressCache(courseSlug?: string): void {
  if (courseSlug) {
    localStorage.removeItem(`course_progress_${courseSlug}`);
  } else {
    // Clear all course progress caches
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('course_progress_')) {
        localStorage.removeItem(key);
      }
    });
  }
}

/**
 * Fetch all courses progress for a user
 */
export async function fetchAllCoursesProgress(walletAddress: string): Promise<CourseProgress[]> {
  try {
    const response = await fetch(
      `/api/course-progress?wallet_address=${walletAddress}&t=${Date.now()}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.courses || [];
  } catch (error) {
    console.error('Error fetching all courses progress:', error);
    return [];
  }
}

/**
 * Reset course progress
 */
export async function resetCourseProgress(
  walletAddress: string,
  courseSlug: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(
      `/api/course-progress?wallet_address=${walletAddress}&course_slug=${courseSlug}`,
      { method: 'DELETE' }
    );

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Failed to reset progress'
      };
    }

    // Clear cache
    clearCourseProgressCache(courseSlug);

    return { success: true };
  } catch (error) {
    console.error('Error resetting course progress:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset progress'
    };
  }
}

