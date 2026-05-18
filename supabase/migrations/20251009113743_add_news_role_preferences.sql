-- Add role preference fields to app_users table
ALTER TABLE app_users 
  ADD COLUMN IF NOT EXISTS role_preferences TEXT[] DEFAULT ARRAY['developer']::TEXT[],
  ADD COLUMN IF NOT EXISTS min_relevance INTEGER DEFAULT 50;

-- Add role scores as JSONB to news_articles table (flexible for any number of roles)
ALTER TABLE news_articles
  ADD COLUMN IF NOT EXISTS role_scores JSONB DEFAULT '{}'::JSONB;

-- Add foreign key for news_digests to app_users if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'news_digests_user_id_fkey'
  ) THEN
    ALTER TABLE news_digests
      ADD CONSTRAINT news_digests_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES app_users(id) 
      ON DELETE CASCADE;
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN app_users.role_preferences IS 'Array of role preferences: developer, qc, ba, pm, devops, etc.';
COMMENT ON COLUMN app_users.min_relevance IS 'Minimum relevance score percentage (0-100) for filtering news';
COMMENT ON COLUMN news_articles.role_scores IS 'JSONB object with role relevance scores, e.g. {"developer": 0.8, "qc": 0.3, "ba": 0.5}';

-- Create GIN index for JSONB role_scores for better query performance
CREATE INDEX IF NOT EXISTS idx_news_articles_role_scores ON news_articles USING GIN (role_scores);

-- Example queries with JSONB:
-- Find articles for developers with score >= 0.5:
-- SELECT * FROM news_articles WHERE (role_scores->>'developer')::float >= 0.5;
--
-- Find articles matching ANY of multiple roles:
-- SELECT * FROM news_articles WHERE 
--   (role_scores->>'developer')::float >= 0.5 OR 
--   (role_scores->>'qc')::float >= 0.5;

