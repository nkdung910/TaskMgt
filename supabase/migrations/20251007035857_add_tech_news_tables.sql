-- ============================================================================
-- MIGRATION: Tech News Feature
-- Date: 2025-10-07
-- Description: Adds news_articles, news_bookmarks, and news_digests tables
-- ============================================================================

-- ============================================================================
-- 1. CREATE news_articles TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS news_articles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    url TEXT UNIQUE NOT NULL,
    source TEXT NOT NULL,
    author TEXT,
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    relevance_score DOUBLE PRECISION,
    tags TEXT[] DEFAULT '{}',
    category TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_news_articles_published_at ON news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_source ON news_articles(source);
CREATE INDEX IF NOT EXISTS idx_news_articles_category ON news_articles(category);
CREATE INDEX IF NOT EXISTS idx_news_articles_relevance_score ON news_articles(relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_created_at ON news_articles(created_at DESC);

-- Add comment
COMMENT ON TABLE news_articles IS 'Tech news articles from various sources';

-- ============================================================================
-- 2. CREATE news_bookmarks TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS news_bookmarks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    article_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_bookmark_user FOREIGN KEY (user_id) 
        REFERENCES app_users(id) ON DELETE CASCADE,
    CONSTRAINT fk_bookmark_article FOREIGN KEY (article_id) 
        REFERENCES news_articles(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_article UNIQUE (user_id, article_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_news_bookmarks_user_id ON news_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_news_bookmarks_article_id ON news_bookmarks(article_id);
CREATE INDEX IF NOT EXISTS idx_news_bookmarks_created_at ON news_bookmarks(created_at DESC);

-- Add comment
COMMENT ON TABLE news_bookmarks IS 'User bookmarks for news articles';

-- ============================================================================
-- 3. CREATE news_digests TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS news_digests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    articles TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_user_date UNIQUE (user_id, date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_news_digests_user_id ON news_digests(user_id);
CREATE INDEX IF NOT EXISTS idx_news_digests_date ON news_digests(date DESC);
CREATE INDEX IF NOT EXISTS idx_news_digests_user_date ON news_digests(user_id, date DESC);

-- Add comment
COMMENT ON TABLE news_digests IS 'Daily news digests for users';

-- ============================================================================
-- 4. UPDATE TRIGGER for updated_at (news_articles)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_news_articles_updated_at 
    BEFORE UPDATE ON news_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

