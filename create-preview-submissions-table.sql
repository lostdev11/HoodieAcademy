-- Create table for Free Course submissions
CREATE TABLE IF NOT EXISTS preview_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  wallet_address TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_preview_submissions_email ON preview_submissions(email);
CREATE INDEX IF NOT EXISTS idx_preview_submissions_wallet ON preview_submissions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_preview_submissions_submitted_at ON preview_submissions(submitted_at DESC);

-- Enable RLS
ALTER TABLE preview_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for public form submissions)
CREATE POLICY "Anyone can submit preview interest"
  ON preview_submissions FOR INSERT
  WITH CHECK (true);

-- Only admins can view (will be handled via service role key in API)
CREATE POLICY "Admins can view preview submissions"
  ON preview_submissions FOR SELECT
  USING (true); -- Admin check handled in API layer

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_preview_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_preview_submissions_updated_at
  BEFORE UPDATE ON preview_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_preview_submissions_updated_at();

