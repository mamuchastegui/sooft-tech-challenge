-- Migration: Add type column for company polymorphism
-- This migration ensures the type column exists with proper constraints

-- Add type column if it doesn't exist (for backwards compatibility)
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'PYME';

-- Update any NULL values to default
UPDATE companies SET type = 'PYME' WHERE type IS NULL;

-- Add check constraint to ensure valid types
ALTER TABLE companies 
ADD CONSTRAINT chk_company_type 
CHECK (type IN ('PYME', 'CORPORATE'));

-- Create index on type for better query performance
CREATE INDEX IF NOT EXISTS idx_company_type ON companies (type);

-- Update existing CUIT unique constraint to allow same CUIT for different types if needed
-- (This is optional depending on business rules)
-- DROP INDEX IF EXISTS companies_cuit_key;
-- CREATE UNIQUE INDEX idx_company_cuit_type ON companies (cuit, type);