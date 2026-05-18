-- Add password reset fields to app_users table
ALTER TABLE "app_users" 
ADD COLUMN IF NOT EXISTS "reset_token" TEXT,
ADD COLUMN IF NOT EXISTS "reset_token_expiry" TIMESTAMP WITH TIME ZONE;

-- Add index for faster token lookups
CREATE INDEX IF NOT EXISTS "idx_reset_token" ON "app_users"("reset_token") 
WHERE "reset_token" IS NOT NULL;

-- Add index for token expiry checks
CREATE INDEX IF NOT EXISTS "idx_reset_token_expiry" ON "app_users"("reset_token_expiry") 
WHERE "reset_token_expiry" IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN "app_users"."reset_token" IS 'Secure token for password reset (32 bytes hex, 64 chars)';
COMMENT ON COLUMN "app_users"."reset_token_expiry" IS 'Expiry timestamp for reset token (1 hour from generation)';

