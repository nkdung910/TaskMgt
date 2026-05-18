-- Add completed_at column to Task table
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Add comment to document the field
COMMENT ON COLUMN "Task".completed_at IS 'Timestamp when task was moved to done status';

-- Create index for performance on completion queries
CREATE INDEX IF NOT EXISTS idx_task_completed_at ON "Task"(completed_at);

-- Create index for completed tasks filtering
CREATE INDEX IF NOT EXISTS idx_task_status_completed_at ON "Task"(status, completed_at) WHERE status = 'done';
