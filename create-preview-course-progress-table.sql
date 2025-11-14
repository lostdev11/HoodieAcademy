-- Table to track free course progress for preview submissions
CREATE TABLE IF NOT EXISTS preview_course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES preview_submissions(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  completed_lessons TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT preview_course_progress_unique_submission_course UNIQUE (submission_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_preview_course_progress_submission ON preview_course_progress(submission_id);
CREATE INDEX IF NOT EXISTS idx_preview_course_progress_course ON preview_course_progress(course_id);

ALTER TABLE preview_course_progress ENABLE ROW LEVEL SECURITY;

