-- Migration: Fix company type enum issue
-- Remove enum constraint that conflicts with TypeORM inheritance

-- Drop enum constraint if it exists
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_type_enum;

-- Drop enum type if it exists  
DROP TYPE IF EXISTS companies_type_enum;

-- Ensure type column exists and is VARCHAR
ALTER TABLE companies ALTER COLUMN type TYPE VARCHAR(20);

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_company_type ON companies (type);