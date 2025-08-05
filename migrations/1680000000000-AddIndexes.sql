-- Migration: Add performance indexes for company filtering
-- Created: $(date +%Y-%m-%d)
-- Purpose: Optimize /companies endpoint queries

-- Index for company join date filtering (joinedFrom/joinedTo parameters)
CREATE INDEX IF NOT EXISTS idx_company_joined_at
  ON companies (joined_at);

-- Composite index for transfer filtering by company and date
CREATE INDEX IF NOT EXISTS idx_transfer_company_date
  ON transfers (company_id, created_at);

-- Unique index for CUIT (should be unique for business logic)
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_cuit
  ON companies (cuit);

-- Optional: Index for company type if we add type filtering later
CREATE INDEX IF NOT EXISTS idx_company_type
  ON companies (type);

-- Analyze tables after index creation for query planner optimization
ANALYZE companies;
ANALYZE transfers;