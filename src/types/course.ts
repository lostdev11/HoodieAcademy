import { z } from 'zod';

// Course interface
export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  cover_url?: string;
  emoji?: string;
  badge?: string;
  href?: string;
  total_lessons?: number;
  category?: string;
  level?: string;
  access?: string;
  squad?: string;
  is_visible: boolean;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Course progress interface
export interface CourseProgress {
  id: string;
  user_id: string;
  course_id: string;
  percent: number;
  is_completed: boolean;
  completed_at?: string;
  updated_at: string;
}

// Course statistics interface
export interface CourseStats {
  course_id: string;
  total_learners: number;
  completed_learners: number;
  avg_percent: number;
}

// Validation schemas
export const CourseUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  cover_url: z.string().url().optional(),
  sort_order: z.number().int().min(0).optional(),
  is_published: z.boolean().optional(),
});

export const CourseProgressUpdateSchema = z.object({
  percent: z.number().int().min(0).max(100).optional(),
  is_completed: z.boolean().optional(),
});

export const CourseCreateSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  cover_url: z.string().url().optional(),
  emoji: z.string().optional(),
  badge: z.string().optional(),
  total_lessons: z.number().int().min(1).optional(),
  category: z.string().optional(),
  level: z.string().optional(),
  access: z.string().optional(),
  squad: z.string().optional(),
  sort_order: z.number().int().min(0).default(0),
  is_visible: z.boolean().default(true),
  is_published: z.boolean().default(false),
});

export type CourseUpdateInput = z.infer<typeof CourseUpdateSchema>;
export type CourseProgressUpdateInput = z.infer<typeof CourseProgressUpdateSchema>;
export type CourseCreateInput = z.infer<typeof CourseCreateSchema>;
